# ChoiceScript Saving Feature
This is a plug-in for ChoiceScript allowing the player to save/load their game


## Installation

To include this plug-in to your existing ChoiceScript instance, unzip this into your game root directory.
The default path is `[choicescript-location]/web/mygame`.

Name the resulting directory as you wish, but I will call it `save-feature` for the rest of this guide.

<br>
Then, in game root directory, edit `index.html` and look for the line stating:
```
<script src="mygame.js"></script>
```
After this line, add the following:
```
<script src="save-feature/save-feature.js"></script>
<script src="save-feature/Modal.js"></script>
<link rel="stylesheet" href="save-feature/Modal.css" type="text/css"/>
```

## What it does

* It adds 2 buttons in the user interface for the player to use:
  * Save: adds a new saved game to the list of saved games.
  * Load: opens a window so the player can choose which saved game to load.
* It provides ChoiceScript writers the following commands:
  * `*save_game id arg`: saves the current game into the slot `id` and displays the text contained in `arg` to the player.
  * `*load_game id arg`: loads the game from the slot `id` and displays the text contained in `arg` to the player.
  * `*free_slot id arg`: deletes any saved game in the slot `id` and displays the text contained in `arg` to the player.

Both saving systems (the player's and the writer's) are completely distinct and one can _NOT_ act over the other.


## Possible future evolutions

* Better way for the player to tell saved games apart (the scene name + date isn't enough in my opinion)
* Quicksave/quickload feature common to the player & the writer
* Import/export system so players can share saved games and brag about their achievements (showing your friends you have the biggest is important)
* I would like to implement a command `*is_slot_used id` which would be used by the writers to check wether a particular slot is empty or not, but it doesn't seem possible given how the `*if` commands are working at the moment.