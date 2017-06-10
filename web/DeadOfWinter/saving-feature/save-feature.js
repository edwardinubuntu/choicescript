(function () {

    //TODO [Evolution] Special slot for an autosave. Make a quicksave/quickload feature just saving the state in JS variable.

    //TODO [Evolution] Import/Export system

    /** Retrieve all the saved games */
    function getSavedGames() {
        return jsonParse(localStorage.getItem('savedGames'));
    }

    /** Retrieve raw target writer's saved game */
    function getWritersSavedGames(id) {
        if(!isFinite(id)) {
            throw new Error('Id expected to be a number, received ' + id + 'instead');
        }
        return localStorage.getItem('writersSave' + id);
    }

    /** Retrieve target writer's saved game */
    function getJSONWritersSavedGames(id) {
        return jsonParse(getWritersSavedGames());
    }

    /** Writes given saved game into target writer's saved games slot */
    function insertWritersSave(id, save, isObfuscated) {
        if(!isFinite(id)) {
            throw new Error('Id expected to be a number, received ' + id + 'instead');
        }

        if(typeof save !== 'undefined') {
            localStorage.setItem('writersSave' + id, jsonStringifyAscii(wrapSavedGame(save, isObfuscated)));
        } else {
            localStorage.removeItem('writersSave' + id);
        }
    }

    function wrapSavedGame(save, isObfuscated) {
        var sceneName = jsonParse(save).stats.sceneName;
        return {
            //TODO determine how to identify each savegames for the user. Is the scene name + date enough ?
            name: sceneName.charAt(0).toUpperCase() + sceneName.slice(1),
            date: new Date(),
            isObfuscated: isObfuscated,
            save: save
        }
    }

    /** Generate the JSON description of the game's current state */
    function makeSave(isObfuscated) {
        var lineOrig = (function () {
            var line = window.stats.scene.lineNum,
                regex = new RegExp('[ ]+#');
            while( !regex.test(window.stats.scene.lines[--line]) && line > 0) {}
            return line;
        })();

        var save = computeCookie(
            window.stats.scene.stats,
            window.stats.scene.temps,
            lineOrig + 1,
            window.stats.scene.lines[lineOrig].match(/[ ]+/)[0].length + 2
        );

        if (isObfuscated) {
            return window.stats.scene.obfuscate(save);
        } else {
            return save;
        }
    }

    /** Insert the saved game into the localStorage */
    function insertSave(save, isObfuscated) {
        var savedGames = getSavedGames();

        if (savedGames == null) {
            savedGames = [];
        }

        var newSave = wrapSavedGame(save, isObfuscated),
            savesSize = jsonStringifyAscii(savedGames).length,
            newSaveSize = jsonStringifyAscii(newSave).length,
            overflow = savesSize + newSaveSize;
        if (overflow > Scene.localStorageLimit) {
            if(confirm('You have too many saved games (Yes, ' + savedGames.length + ' is a lot !). ' +
                'You need to delete some before being able to save your game again.\n\n' +
                'Do you want to delete some of the oldest saved games so you can save this game anyway ?')
            ) {
                var removal = 0;
                while(overflow > Scene.localStorageLimit) {
                    overflow -= jsonStringifyAscii(savedGames[savedGames.length - removal - 1]).length;
                    removal++;
                }

                savedGames.splice(savedGames.length - removal - 1, removal);

                alert('Oldest entries deleted, the current game is being saved');
            } else {
                alert('No games were saved, no saves were deleted.');
                return;
            }
        }

        savedGames.unshift(newSave);
        localStorage.setItem('savedGames', jsonStringifyAscii(savedGames));
    }

    /** Load a saved game */
    function loadSave(save) {
        var jsonSave = (typeof save === 'string')?jsonParse(save):save;

        var state;
        if(jsonSave.isObfuscated) {
            state = jsonParse(window.stats.scene.deobfuscatePassword(jsonSave.save));
        } else {
            state = jsonParse(jsonSave.save);
        }

        saveCookie(function () {
            clearScreen(function () {
                // we're going to pretend not to be user restored, so we get reprompted to save
                restoreGame(state, null, true);
            })
        }, "", state.stats, state.temps, state.lineNum, state.indent, this.debugMode, this.nav);
    }

    /** Display every available saved games */
    function displaySavedGames() {
        var savedGames = getSavedGames();

        if(window.Modal) {
            /** Convert the saved game into HTML */
            function getEntry(save) {
                var result = document.createElement('li'),
                    resultLink = document.createElement('a');

                var resultTitle = document.createElement('div');
                resultTitle.className = 'title';
                resultTitle.innerText = save.name;

                var resultDate = document.createElement('div'),
                    date = new Date(save.date);
                resultDate.className = 'date';
                resultDate.innerText = date.toLocaleDateString() + " " + date.toLocaleTimeString().replace(/(([0-9]{1,2}:?){3}) (AM|PM)/, function (match, p1, p2, p3) {
                    return (p3 == 'PM')?p1.split(':').map(function(value, index){return index?value:value - -12 + '';}).join(':'):p1;
                });

                resultLink.appendChild(resultTitle);
                resultLink.appendChild(resultDate);

                result.appendChild(resultLink);

                resultLink.addEventListener('click', function (e) {
                    e.preventDefault();
                    if(window.modal) window.modal.close();

                    clearScreen(function () {
                        loadSave(save);
                    });
                });


                return result;
            }

            var contentTitle = document.createElement('h1'),
                contentList = document.createElement('ul');

            contentTitle.innerText = 'Choose the save you want to load';

            savedGames.forEach(function (element) {
                contentList.appendChild(getEntry(element));
            });

            var htmlOutput = document.createElement('div');
            htmlOutput.appendChild(contentTitle);
            htmlOutput.appendChild(contentList);

            window.modal = new Modal({
                content: htmlOutput
            });

            window.modal.open();
        } else if(confirm('Missing plugin displaying the saved games. Load the most recent saved game ?')) {
            loadSave(savedGames[0]);
        }
    }

    /** The behaviour when the user clicks the save button */
    function userSave() {
        var isObfuscated = true;
        insertSave(makeSave(isObfuscated), isObfuscated);
    }

    /** Check if a given slot contains a saved game */
    function isSlotUSed(id) {
        return !!getWritersSavedGames(id);
    }


    /** Set the localStorage's length limit (not to exceed the 5MB limit) */
    Scene.localStorageLimit = 5200000;

    /** Give the developper the ability to use the save system */
    Scene.prototype.save_game = function (options) {
        options = options.split(' ');

        insertWritersSave(options[0], makeSave(true));

        if (options.length > 1) alert(options.slice(1).join(' '));
    };

    Scene.prototype.load_game = function (options) {
        options = options.split(' ');

        if(!isFinite(options[0])) {
            throw new Error('Id expected to be a number, received ' + options[0] + 'instead');
        } else if(!isSlotUSed(options[0])) {
            throw new Error('Attempted to load an empty save slot:' + options[0]);
        }
        loadSave(getJSONWritersSavedGames(options[0]));

        if (options.length > 1) alert(options.slice(1).join(' '));
    };

    Scene.prototype.is_slot_used = function (options) {
        //TODO To be used inside an *if statement. Seems impossible at the moment, as the *if statement only evaluates variables
    };

    Scene.prototype.free_slot = function (options) {
        options = options.split(' ');

        if(!isFinite(options[0])) {
            throw new Error('Id expected to be a number, received ' + options[0] + 'instead');
        } else if(isSlotUSed(options[0])) {
            insertWritersSave(options[0]);
        }

        if (options.length > 1) alert(options.slice(1).join(' '));
    };

    Scene.validCommands.save_game = 1;
    Scene.validCommands.load_game = 1;
    //Scene.validCommands.is_slot_used = 1;
    Scene.validCommands.free_slot = 1;


    /** Add the buttons to the document **/
    document.addEventListener("DOMContentLoaded", function () {
        if (typeof localStorage === 'undefined') {
            var errorMessage = document.createElement('span');
            errorMessage.innerText = 'Your browser can\'t use the saving feature. You should consider upgrading !';
            document.getElementById('buttons').appendChild(errorMessage);
        } else if(document.querySelectorAll('#saveButton, #loadButton').length == 0) {
            //Create save button
            var saveButton = document.createElement('button');
            saveButton.id = 'saveButton';
            saveButton.className = 'spacedLink';
            saveButton.innerText = 'Save';
            saveButton.onclick = userSave;

            document.getElementById('buttons').appendChild(saveButton);

            //Create load button
            var loadButton = document.createElement('button');
            loadButton.id = 'loadButton';
            loadButton.className = 'spacedLink';
            loadButton.innerText = 'Load';
            loadButton.onclick = displaySavedGames;

            document.getElementById('buttons').appendChild(loadButton);
        }
    });
})();

