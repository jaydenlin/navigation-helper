'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
var STATE_KEY = 'navigationHelper';
var tracks:Array<Track> = [];
var trackLimit = 10;
var historyLimit = 20;
var currentTrackIndex = 0;
var path = require("path");

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
                initEmptyTracks();
            }
        }catch(e){
            console.log(e);
            initEmptyTracks();
        }     
    });
    
    //show current track on status bar
    vscode.window.setStatusBarMessage(currentTrackDisplay());  

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "navigation-helper" is now active!');

    let disposableSaveToTrack = vscode.commands.registerCommand('extension.saveToTrack', () => {
        saveToTrack(tracks);
        //save state
        saveWorkspaceState(context,STATE_KEY,{tracks:tracks});
        //show message and then change back to current track message
        vscode.window.setStatusBarMessage('Save to '+ currentTrackDisplay());  
        setTimeout(()=>{
            vscode.window.setStatusBarMessage(currentTrackDisplay());  
        },1500);     
        
    });

    let disposableChangeTrack = vscode.commands.registerCommand('extension.changeTrack', () => {
        
        vscode.window.showQuickPick(tracks,{matchOnDescription:true}).then(val=> {
            changeTrack(val.index);
            //show current track on status bar
            vscode.window.setStatusBarMessage(currentTrackDisplay());  
        });
    });

    let disposableEditCurrentTrackName = vscode.commands.registerCommand('extension.editCurrentTrackName', () => {     
        
        vscode.window.showInputBox({
            placeHolder : 'Input a new track name here',
            prompt:'Editing name of ' + currentTrackDisplay()
        }).then(val=> {
            if(typeof val === "undefined"){
                val = '';
            }
            editTrackName(currentTrackIndex,val);
            //show current track on status bar
            vscode.window.setStatusBarMessage(currentTrackDisplay());  

            
        });

    });

    let disposableShowCurrentTrackHistory = vscode.commands.registerCommand('extension.showCurrentTrackHistory', () => {     
        console.log(tracks[currentTrackIndex].history);
        vscode.window.showQuickPick(tracks[currentTrackIndex].history,{ placeHolder : 'Select a item from '+currentTrackDisplay()+' to navigate to',matchOnDetail:true,matchOnDescription:true}).then(val=> {
            navigateToFile(val.filePath,val.lineNumber);
            
            //saveWorkspaceState(context,STATE_KEY,{navigationHistories:navigationHistories});  
            //console.log(val);
        });

    });

    let disposableClearAllHistoryFromCurrentTrack = vscode.commands.registerCommand('extension.clearAllHistoryFromCurrentTrack', () => {     
                 
        tracks[currentTrackIndex].history = [];
        vscode.window.showInformationMessage('All history in '+ currentTrackDisplay() + ' are deleted');
        
    });

    let disposableClearOneHistoryFromCurrentTrack = vscode.commands.registerCommand('extension.clearOneHistoryFromCurrentTrack', () => {   
        vscode.window.showQuickPick(tracks[currentTrackIndex].history,{placeHolder : 'Select a item from '+currentTrackDisplay()+' to delete',matchOnDetail:true,matchOnDescription:true}).then(val=> {        
             tracks[currentTrackIndex].history = tracks[currentTrackIndex].history.filter((h)=>{
                //Case 1. diffrent files
                if(h.filePath !== val.filePath){
                    return true;
                //Case 2. same file but diffrent lines   
                }else if(h.lineNumber!==val.lineNumber){
                    return true;
                //Case 3. different files, diffent lines    
                }else{
                    return false;
                }
            });
            vscode.window.showInformationMessage('One history in '+ currentTrackDisplay() + ' is deleted');
            
        });
    });

    let disposableClearAllHistoryFromAll = vscode.commands.registerCommand('extension.clearAllHistoryFromAllTracks', () => {    
        initEmptyTracks();
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

function initEmptyTracks() {
    for(let i = 0; i < trackLimit ; i++){
        tracks[i] = {        
           index : i,
           history : [],  
           description : '', 
           label : '[ Track '+i+' ]', 
           detail : 'Select the track and switch to it!',
           recordCount: 0
        }
    }
}

function saveToTrack(tracks:Array<Track>) {
    var isRecorded:boolean = false;
    var navigationHistories:Array<NavigationHistory> = tracks[currentTrackIndex].history;
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

    if(navigationHistories.length < historyLimit){
        navigationHistories.map((val)=>{
            //if the new history was already in the Histroy, we will ignore it.
            if( val.filePath ===  newHistory.filePath && val.lineNumber === newHistory.lineNumber){
                isRecorded = true;
                console.log(val.filePath);
                console.log(newHistory.filePath);
                console.log(val.lineNumber);
                console.log(newHistory.lineNumber);
                console.log(tracks[currentTrackIndex].history);
            }
        });
        if(!isRecorded){
            navigationHistories.push(newHistory);
            console.log("push");
            tracks[currentTrackIndex].recordCount = navigationHistories.length;
        }       
    }else{
        navigationHistories.splice(1);
        navigationHistories.push(newHistory);
        tracks[currentTrackIndex].recordCount = navigationHistories.length;
    }
    
}
function currentTrackDisplay():string {
    var currentTrack = tracks[currentTrackIndex];
    return currentTrack.label + ' ' +currentTrack.description;
}

function changeTrack(trackIndex:number) {
    currentTrackIndex = trackIndex ;
}

function editTrackName(trackIndex:number,newName:string) {
    tracks[trackIndex].description = newName;
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

function goTolLine(line: number) {
    var line = line===0 ? line : line-1;
    var newSelection = new vscode.Selection(line, 0, line, 0);
    vscode.window.activeTextEditor.selection = newSelection;      
    vscode.window.activeTextEditor.revealRange(newSelection, vscode.TextEditorRevealType.InCenter);
}

function navigateToFile(filePath:string,lineNumber:number) {
    vscode.workspace.openTextDocument(filePath).then(d=> {
        vscode.window.showTextDocument(d).then(textEditor=>{
           goTolLine(lineNumber);           
        });                       
    });
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