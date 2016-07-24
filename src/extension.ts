'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

var tracks:Array<Track> = [];
var currentTrackIndex = 0;
var path = require("path");

//Const
const STATE_KEY = 'navigationHelper';
const TRACK_LIMIT = 10;
const HISTORY_LIMIT = 20;
const HISTORY_OP_OVERWRITE_LABEL = 'Overwrite';
const HISTORY_OP_OVERWRITE_MSG = ' this history to the track';

const HISTORY_OP_MOVE_LABEL = 'Move';
const HISTORY_OP_MOVE_MSG = ' this history to another track';

const HISTORY_OP_ADD_LABEL = 'Add';
const HISTORY_OP_ADD_MSG = ' this history to another track';

const HISTORY_OP_DELETE_LABEL = 'Delete';
const HISTORY_OP_DELETE_MSG = ' this history from the track';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    
    //Init tracks
    restoreWorkspaceState(context,STATE_KEY,(val)=>{
        try{
            var savedState = JSON.parse(val);
            if(savedState.tracks){
                tracks = JSON.parse(val).tracks;
            }else{
                initEmptyTracks(context);
            }
        }catch(e){
            console.log(e);
            initEmptyTracks(context);
        }     
    });
    
    //show current track on status bar
    vscode.window.setStatusBarMessage(trackDisplayName(currentTrackIndex));  

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "navigation-helper" is now active!');

    let disposableSaveToTrack = vscode.commands.registerCommand('extension.saveToTrack', () => {
        saveToTrack(context,tracks,currentTrackIndex,(trackIndex)=>{
            
            //show message and then change back to current track message
            vscode.window.setStatusBarMessage('Save to '+ trackDisplayName(trackIndex));  
            setTimeout(()=>{
                vscode.window.setStatusBarMessage(trackDisplayName(currentTrackIndex));  
            },1500);   
        });
              
    });

    let disposableChangeTrack = vscode.commands.registerCommand('extension.changeTrack', () => {
        
        vscode.window.showQuickPick(tracks,{
            matchOnDescription:true,
            placeHolder:"Select the track and switch to it"
        }).then(val=> {
            changeTrack(val.index,()=>{
                //show current track on status bar
                vscode.window.setStatusBarMessage(trackDisplayName(currentTrackIndex));  
            });
            
        });
    });

    let disposableEditCurrentTrackName = vscode.commands.registerCommand('extension.editCurrentTrackName', () => {     
        
        vscode.window.showInputBox({
            placeHolder : 'Input a new track name here',
            prompt:'Editing name of ' + trackDisplayName(currentTrackIndex)
        }).then(val=> {
            if(typeof val === "undefined"){
                val = '';
            }
            editTrackName(context,currentTrackIndex,val,()=>{
                //show current track on status bar
                vscode.window.setStatusBarMessage(trackDisplayName(currentTrackIndex));  
            });
                     
        });

    });

    let disposableShowCurrentTrackHistory = vscode.commands.registerCommand('extension.showCurrentTrackHistory', () => {     
        
        vscode.window.showQuickPick(tracks[currentTrackIndex].history,{ placeHolder : 'Select an item from '+trackDisplayName(currentTrackIndex)+' to navigate to',matchOnDetail:true,matchOnDescription:true}).then(val=> {
            navigateToFile(val.filePath,val.lineNumber);
        });

    });

    let disposableClearAllHistoryFromCurrentTrack = vscode.commands.registerCommand('extension.clearAllHistoryFromCurrentTrack', () => {     
        clearAllHistoryFromTrack(context,currentTrackIndex,()=>{
            vscode.window.showInformationMessage('All history in '+ trackDisplayName(currentTrackIndex) + ' are deleted');
        });         
    });

    let disposableClearOneHistoryFromCurrentTrack = vscode.commands.registerCommand('extension.clearOneHistoryFromCurrentTrack', () => {   
        vscode.window.showQuickPick(tracks[currentTrackIndex].history,{placeHolder : 'Select an item from ' + trackDisplayName(currentTrackIndex) + ' to delete', matchOnDetail:true, matchOnDescription:true}).then(val=> {        
            
            clearAHistoryFromTrack(context, val,currentTrackIndex,()=>{
                vscode.window.showInformationMessage('One history in '+ trackDisplayName(currentTrackIndex) + ' is deleted');
            });
                     
        });
    });

    let disposableClearAllHistoryFromAll = vscode.commands.registerCommand('extension.clearAllHistoryFromAllTracks', () => {    
        initEmptyTracks(context);
        vscode.window.showInformationMessage('All history in all tracks are deleted');
    });

    
    context.subscriptions.push(disposableSaveToTrack);
    context.subscriptions.push(disposableChangeTrack);
    context.subscriptions.push(disposableEditCurrentTrackName);
    context.subscriptions.push(disposableShowCurrentTrackHistory);
    context.subscriptions.push(disposableClearAllHistoryFromCurrentTrack);
    context.subscriptions.push(disposableClearOneHistoryFromCurrentTrack);
    context.subscriptions.push(disposableClearAllHistoryFromAll);
    
}

function initEmptyTracks(context:vscode.ExtensionContext) {
    for(let i = 0; i < TRACK_LIMIT ; i++){
        tracks[i] = {        
           index : i,
           history : [],  
           description : '', 
           label : '[ Track '+i+' ]', 
           detail : '',
           recordCount: 0
        }
    }
    //save state
    saveWorkspaceState(context,STATE_KEY,{tracks:tracks});
}

function saveToTrack(context: vscode.ExtensionContext,tracks:Array<Track>, trackIndex:number, callback:Function) {
    var isRecorded:boolean = false;
    var navigationHistories:Array<NavigationHistory> = tracks[trackIndex].history;
    var editor = getEditor();
    var doc = editor.document;
    var selectedText = getSelectedText(editor);
    var lineNumber = editor.selection.active.line + 1;
    var newHistory:NavigationHistory = { 
           description: selectedText, 
           label: path.basename(doc.fileName) +' : '+ lineNumber, 
           detail: doc.fileName,
           filePath : doc.fileName,
           lineNumber: lineNumber,
           snapshot:selectedText
    };

    if(navigationHistories.length < HISTORY_LIMIT){
        navigationHistories.map((val)=>{
            //if the new history was already in the Histroy, we set it as recorded.
            if( val.filePath ===  newHistory.filePath && val.lineNumber === newHistory.lineNumber){
                isRecorded = true;
            }
        });
        //Case 1. if the history does not exist, then record it to the track
        if(!isRecorded){
            navigationHistories.push(newHistory);
            //save state
            saveWorkspaceState(context,STATE_KEY,{tracks:tracks});
            callback(trackIndex);
        //Case 2. if the history exists, show other options    
        }else{
            var conflictTrackIndex = trackIndex;
            showHistoryOperationOptions(context, newHistory, conflictTrackIndex);
        }       
    }else{
        navigationHistories.splice(1);
        navigationHistories.push(newHistory);
        //save state
        saveWorkspaceState(context,STATE_KEY,{tracks:tracks});
        callback(trackIndex);
    }
    
    
}
function showHistoryOperationOptions(context: vscode.ExtensionContext,newHistory:NavigationHistory, conflictTrackIndex:number) {
    var historyOperationOptions: Array<HistoryOperationOption> = [
        {
            description: HISTORY_OP_OVERWRITE_MSG+" "+trackDisplayName(conflictTrackIndex), 
            label: HISTORY_OP_OVERWRITE_LABEL, 
            detail: ""
        },
        {
            description: HISTORY_OP_MOVE_MSG, 
            label: HISTORY_OP_MOVE_LABEL, 
            detail: ""
        },
        {
            description: HISTORY_OP_ADD_MSG, 
            label: HISTORY_OP_ADD_LABEL, 
            detail: ""
        },
        {
            description: HISTORY_OP_DELETE_MSG+" "+trackDisplayName(conflictTrackIndex), 
            label: HISTORY_OP_DELETE_LABEL, 
            detail: ""
        }
    ];
    vscode.window.showQuickPick(historyOperationOptions,{placeHolder : 'This line history existed in '+trackDisplayName(conflictTrackIndex)+'. Please select other options.',matchOnDetail:true,matchOnDescription:true}).then(val=> {        
        var trackHistory = tracks[conflictTrackIndex].history;
        //Case 1. Overwrite this history to the conflict track
        if(val.label === HISTORY_OP_OVERWRITE_LABEL){
            trackHistory = trackHistory.map((h)=>{
                if(h.filePath === newHistory.filePath && h.lineNumber === newHistory.lineNumber){
                    //replace with new history
                    return newHistory;
                }else{
                    return h;
                }
            });
            vscode.window.setStatusBarMessage('Overwrite to '+ trackDisplayName(conflictTrackIndex));  
            setTimeout(()=>{
                vscode.window.setStatusBarMessage(trackDisplayName(currentTrackIndex));  
            },1500); 

        //Case 2. MOVE this history to another track    
        }else if(val.label === HISTORY_OP_MOVE_LABEL){
            vscode.window.showQuickPick(tracks,{
                matchOnDescription:true,
                placeHolder:"Select the track that you want this history to be moved to"
            }).then(val=> {
                 clearAHistoryFromTrack(context,newHistory,conflictTrackIndex,()=>{});
                 saveToTrack(context, tracks,val.index,()=>{
                    //show message and then change back to current track message
                    vscode.window.setStatusBarMessage('Move to another'+ trackDisplayName(val.index));  
                    setTimeout(()=>{
                        vscode.window.setStatusBarMessage(trackDisplayName(currentTrackIndex));  
                    },1500); 
                 });
            });

        //Case 3. ADD this history to another track     
        }else if(val.label === HISTORY_OP_ADD_LABEL){
            vscode.window.showQuickPick(tracks,{
                matchOnDescription:true,
                placeHolder:"Select the track that you want this history to be added to"
            }).then(val=> {
                 saveToTrack(context, tracks,val.index,()=>{
                    //show message and then change back to current track message
                    vscode.window.setStatusBarMessage('Add to another'+ trackDisplayName(val.index));  
                    setTimeout(()=>{
                        vscode.window.setStatusBarMessage(trackDisplayName(currentTrackIndex));  
                    },1500); 
                 });
            });
        //Case 4. DELETE this history from the track       
        }else if(val.label === HISTORY_OP_DELETE_LABEL){
            clearAHistoryFromTrack(context,newHistory,conflictTrackIndex,()=>{
                vscode.window.showInformationMessage('One history in '+ trackDisplayName(conflictTrackIndex) + ' is deleted');
            });
        }     
        
     });
}

function trackDisplayName(trackIndex:number):string {
    var trackToDisplay = tracks[trackIndex];
    return trackToDisplay.label + ' ' +trackToDisplay.description;
}

function clearAHistoryFromTrack(context: vscode.ExtensionContext,history:NavigationHistory,trackIndex:number,callback:Function):void {
    tracks[trackIndex].history = tracks[currentTrackIndex].history.filter((h)=>{
                //Case 1. diffrent files
                if(h.filePath !== history.filePath){
                    return true;
                //Case 2. same file but diffrent lines   
                }else if(h.lineNumber!==history.lineNumber){
                    return true;
                //Case 3. different files, diffent lines    
                }else{
                    return false;
                }
    });
    //save state
    saveWorkspaceState(context,STATE_KEY,{tracks:tracks});
    callback();
}

function clearAllHistoryFromTrack(context: vscode.ExtensionContext, trackIndex:number,callback:Function):void {
    tracks[trackIndex].history = [];
    //save state
    saveWorkspaceState(context,STATE_KEY,{tracks:tracks});
    callback();
}

function changeTrack(trackIndex:number,callback:Function):void {
    currentTrackIndex = trackIndex ;
    callback();
}

function editTrackName(context: vscode.ExtensionContext,trackIndex:number,newName:string,callback:Function):void {
    tracks[trackIndex].description = newName;
    //save state
    saveWorkspaceState(context,STATE_KEY,{tracks:tracks});
    callback();
}

function navigateToFile(filePath:string,lineNumber:number) {
    vscode.workspace.openTextDocument(filePath).then(d=> {
        vscode.window.showTextDocument(d).then(textEditor=>{
           goTolLine(lineNumber);           
        });                       
    });
}

function getEditor(): vscode.TextEditor {
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    return editor;
}

function getSelectedText(editor: vscode.TextEditor) {
    var selection = editor.selection;
    var text = editor.document.getText(selection).trim();
    if (!text) {
        var range = editor.document.getWordRangeAtPosition(selection.active);
        text = editor.document.getText(range);
    }
    return text;
}

function goTolLine(line: number):void {
    var line = line===0 ? line : line-1;
    var newSelection = new vscode.Selection(line, 0, line, 0);
    vscode.window.activeTextEditor.selection = newSelection;      
    vscode.window.activeTextEditor.revealRange(newSelection, vscode.TextEditorRevealType.InCenter);
}

function saveWorkspaceState(context : vscode.ExtensionContext, key: string,value:any): void {     
    context.workspaceState.update(key, JSON.stringify(value));
}

function restoreWorkspaceState(context : vscode.ExtensionContext, key: string,callback:Function): void {     
    callback(context.workspaceState.get(key,''));
}

// this method is called when your extension is deactivated
export function deactivate() {
}