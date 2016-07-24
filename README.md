# [Navigation Helper](https://github.com/jaydenlin/navigation-helper) 
> Trace codes easily with recording lines in files of each track in [Visual Studio Code](https://code.visualstudio.com/)!

```
ext install navigation-helper
```
  
## Background 

Developers offen trace codes back and forth with many files opened in the editor.  
But `it's hard to remember all those files belongs to which track you're tracing`.  
Especially, those files are in the same project folder.  

For exmaple, for tracing `Bug 111`, you may open several files like `File 1`, `File 3` ... etc and do the study.   
Then, suddenly you get a ticket about `Bug 112` with high priority, then you open `File 3`,`File 2` amd `File 22` to trace the root cause.  
Also, you might have `Feature 11` and `Feature 12` in the sprint backlog...

The following image illustrates the related files of each track (`Bug 111`,`Bug 112`,`Feature 11` and `Feature 12`)  
* It's tedious to record the related files manully on paper. 
* It's time-consuming to navigate to those files, if you write down it on paper.  
   
<img src="http://i.imgur.com/f8HceeJr.png" width="500"/>

## Concept

This extension helps you organize the file list into `track-based` in the editor.   
We called `Bug 111` as a `Track`, and called `File 1`, `File 3` ... etc as a `History`.    
<img src="http://i.imgur.com/ZQ0ueOY.png" width="500"/>

## Highlight
1. Record related files (History) into `track-based` file lists.
2. Add/Delete related files (History) into/from a track with ease.
3. Use `Quick Pick Selecter` to show related files of a track, and easy to navigate to them
4. Use `Quick Pick Selecter` to show tracks, and easy to switch between them


## Demo
### 1. Add a file (`History`) into current `Track`  
Press `cmd+m` (`ctrl+m`), You can see the `Save to [ Track 0 ]` message on status bar.   
also if you've selected the words before press the `cmd+m` (`ctrl+m`). it will be record too.    
 
![IDE](http://i.giphy.com/l0HlLXmnTdxeSqVr2.gif)   

The following image illustrates what the demo did.  
<img src="http://i.imgur.com/IgI9jXZ.png" width="500"/>

### 2. Show the recorded files (`History`) in current `Track`  
Press `cmd+h` (`ctrl+h`), and select the file you like, then navigate to it.
The status bar shows current Track `[ Track 0 ]`   
![IDE](http://i.giphy.com/l0MYOGrryCMkfyi5y.gif) 
  
  
### 3. Rename the current `Track`  
Press `cmd+shift+,` (`ctrl+shift+,`), and input the track name you like   
![IDE](http://i.giphy.com/3o7TKG7daHY8Trf1HW.gif) 

The following image illustrates what the demo did.    
<img src="http://i.imgur.com/ZSafXH9.png" width="500"/>
  
  
### 4. Switch to another `Track`  
Press `cmd+shift+m` (`ctrl+shift+m`), and select the track you like, then switch to it  
The status bar shows current Track is changed to`[ Track 3 ]`   
![IDE](http://i.giphy.com/3o7TKu12Q0KC2r4QdW.gif) 

The following image illustrates what the demo did.  
When you press `cmd+h`(`ctrl+h`) There would be an empty list in `[ Track 3 ]` now.  
<img src="http://i.imgur.com/9DjqA0p.png" width="500"/>  
  
  
### 5. Clear a file (`History`) from current `Track`  
Press `f1` and input `Navigation Helper: Clear One History From Current Track`  
, and select the history you would like to delete.      
![IDE](http://i.giphy.com/3oEjI7jWxlBqTcKIog.gif) 

The following image illustrates what the demo did.  
<img src="http://i.imgur.com/yT5qdEE.png" width="500"/>  
  
  
### 6. Clear all files (`History`) from current `Track`  
Press `f1` and input `Navigation Helper: Clear All History From Current Track`   
![IDE](http://i.giphy.com/26BRLnmOg35W8WNt6.gif) 

The following image illustrates what the demo did.  
<img src="http://i.imgur.com/TffnmFV.png" width="500"/>  
  

### 7. Clear all files (`History`) from all `Tracks`  
Press `f1` and input `Navigation Helper: Clear All History From All Tracks`  
![IDE](http://i.giphy.com/l0HlRtnQyP5c2rYHu.gif) 

The following image illustrates what the demo did.  
<img src="http://i.imgur.com/E69kI8I.png" width="500"/>  
  
## Custom Keybinding
You can also set custom shortcuts in `keybindings.json` via `Code => Preferences => Keyboard Shortcuts`  
For example:  
### Add a file (`History`) into current `Track` 
```
[
    { "key": "cmd+m",//set to your favorite shortcut
      "command": "extension.saveToTrack",
      "when": "editorTextFocus" }
]
```
### Show the recorded files (`History`) in current `Track`   
```
[
    { "key": "cmd+h",//set to your favorite shortcut
      "command": "extension.showCurrentTrackHistory",
      "when": "editorTextFocus" }
]
```
### Rename the current `Track`   
```
[
    { "key": "cmd+shift+,",//set to your favorite shortcut
      "command": "extension.editCurrentTrackName",
      "when": "editorTextFocus" }
]
```
### Switch to another `Track`   
```
[
    { "key": "cmd+shift+m",//set to your favorite shortcut
      "command": "extension.changeTrack",
      "when": "editorTextFocus" }
]
```
### Clear a file (`History`) from current `Track`       
```
[
    { "key": "set to your favorite shortcut",//set to your favorite shortcut
      "command": "extension.clearOneHistoryFromCurrentTrack",
      "when": "editorTextFocus" }
]
```
### Clear all files (`History`) from current `Track`    
```
[
    { "key": "set to your favorite shortcut",//set to your favorite shortcut
      "command": "extension.clearAllHistoryFromCurrentTrack",
      "when": "editorTextFocus" }
]
```
### Clear all files (`History`) from all `Tracks`   
```
[
    { "key": "set to your favorite shortcut",//set to your favorite shortcut
      "command": "extension.clearAllHistoryFromAllTracks",
      "when": "editorTextFocus" }
]
```

## Issues
Please submit issues to [navigation-helper](https://github.com/jaydenlin/navigation-helper)

**Enjoy!**