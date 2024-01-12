(() => {
    const DEBUG = false;

    window.oncontextmenu = (e) => {
        e.preventDefault();
    };

    function log(text) {
        if (DEBUG) {
            console.log(text);
        }
    }
    const _keyDownEnabled = new WeakMap();

    class KeyboardInputControl {
        constructor() {
            this.events = {};
            this.keyDownEnabled = true;
            this.on("onkeydown", (event) => {
                if (!event.isTrusted) return;
                if (!this.keyDownEnabled) return;

                let map = {
                    38: 0, // Up
                    39: 1, // Right
                    40: 2, // Down
                    37: 3, // Left
                    75: 0, // Vim up
                    76: 1, // Vim right
                    74: 2, // Vim down
                    72: 3, // Vim left
                    87: 0, // W
                    68: 1, // D
                    83: 2, // S
                    65: 3 // A
                };
                let modifiers = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
                let mapped = map[event.which];
                if (!modifiers) {
                    if (mapped !== undefined) {
                        event.preventDefault();
                        this.emit("move", mapped);
                    }
                }
            });
            this.listen();
        }
        on(event, callback) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(callback);
        }
        emit(event, data) {
            let callbacks = this.events[event];
            if (callbacks) {
                callbacks.forEach((callback) => {
                    callback(data);
                });
            }
        }
        /*
        bindButtonPress(selector, fn) {
            let button = document.querySelector(selector);
            button.addEventListener("click", fn);
        }
        */
        listen() {
            // Respond to direction keys
            document.addEventListener("keydown", (event) => {
                // this.emit("onkeydown", event);
            });
        }
        get keyDownEnabled() {
            return _keyDownEnabled.get(this);
        }
        set keyDownEnabled(enable) {
            _keyDownEnabled.set(this, enable);
        }
    }

    class UIHTMLControl {
        constructor() {
            this.tileContainer = document.querySelector(".tile-container");
            this.scoreContainers = [document.querySelector("#your_score"), document.querySelector('.endgame_your_score')];
            this.nameContainers = [document.querySelector('.your_name'), document.querySelector('.endgame_your_name')];
            this.opponentNameContainers = [document.querySelector('.opponent_name'), document.querySelector('.endgame_opponent_name')];
            this.opponentScoreContainers = [document.querySelector("#opponent_score"), document.querySelector('.endgame_opponent_score')];

            this.player = {
                score: 0,
                name: 'Your nickname'
            };
            this.opponent = {
                score: 0,
                name: 'Opponent nickname'
            };
        }
        get score() {
            return this.player.score;
        }
        set score(score) {
            this.player.score = score;
        }
        get opponentScore() {
            return this.opponent.score;
        }
        set opponentScore(score) {
            this.opponent.score = score;
        }
        get name() {
            return this.player.name;
        }
        set name(name) {
            this.player.name = name;
        }
        get opponentName() {
            return this.opponent.name;
        }
        set opponentName(name) {
            this.opponent.name = name;
        }
        clearContainer(container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }
        updateName(name) {
            this.name = name;
            for (let i = 0, len = this.nameContainers.length; i < len; i++) {
                this.nameContainers[i].textContent = this.name;
            }
        }
        updateOpponentName(name) {
            this.opponentName = name;
            for (let i = 0, len = this.opponentNameContainers.length; i < len; i++) {
                this.opponentNameContainers[i].textContent = this.opponentName;
            }
            document.querySelector('.opponent_rating').textContent = game.opponent.rating;
            document.querySelector('.your_rating').textContent = game.rating;
        }
        updateScore(scoreObj) {
            let score = scoreObj.score;
            this.clearContainer(this.scoreContainers[0]);
            let difference = score - this.score;
            this.score = score;

            this.scoreContainers[0].textContent = this.score;
            this.scoreContainers[1].textContent = this.score;
            game.socket.emit('score', {
                score: this.score,
                board: scoreObj.board
            });
            if (difference > 0) {
                let addition = document.createElement("div");
                addition.classList.add("score-addition");
                addition.textContent = "+" + difference;

                this.scoreContainers[0].appendChild(addition);
            }
        }
        updateOpponentScore(score) {
            this.clearContainer(this.opponentScoreContainers[0]);
            let difference = score - this.opponentScore;
            this.opponentScore = score;

            this.opponentScoreContainers[0].textContent = this.opponentScore;
            this.opponentScoreContainers[1].textContent = this.opponentScore;
            if (difference > 0) {
                let addition = document.createElement("div");
                addition.classList.add("opponent-score-addition");
                addition.textContent = "+" + difference;

                this.opponentScoreContainers[0].appendChild(addition);
            }
        }
        message(won) {
            log(`state = ${won}`);
            if (game.pmm_counter.oid !== 0) {
                won ? game.pmm_counter.you++ : game.pmm_counter.enemy++;
                document.querySelector('.endgame_private_score ').textContent = `${game.pmm_counter.you}:${game.pmm_counter.enemy}`;
                document.querySelector('.private_score .p_score').textContent = `${game.pmm_counter.you}:${game.pmm_counter.enemy}`;
            }
            game.changeScreen(SCREEN.GAMEOVER);
            document.querySelector('.review_btn[value="like"]').className = 'review_btn'
            document.querySelector('.review_btn[value="dislike"]').className = 'review_btn';
            document.querySelector('.container').className = `container ${won ? 'win' : 'lose'}`;
            document.querySelector('.modal_gameover').className = `modal_gameover ${won ? 'win' : 'lose'}`;
            document.querySelector('.endgame_totaltime').textContent = `${chrome.i18n.getMessage("match_time_label")} ${document.querySelector('.game_time').textContent}`;
            document.querySelector('.endgame_status').textContent = `${won ? chrome.i18n.getMessage('you_win') : chrome.i18n.getMessage('you_lose')}`;

            document.querySelector('.tooltiptext.tt_like').textContent = `${chrome.i18n.getMessage('like_tooltip_text')}`;// ${this.opponentName}`;
            document.querySelector('.tooltiptext.tt_dislike').textContent = `${chrome.i18n.getMessage('dislike_tooltip_text')}`;// ${this.opponentName}`;
            let mgNode = document.querySelector('#my_geyser');
            while (mgNode.firstChild) {
                mgNode.removeChild(mgNode.firstChild);
            }
            let egNode = document.querySelector('#enemy_geyser');
            while (egNode.firstChild) {
                egNode.removeChild(egNode.firstChild);
            }
            let smiles_parent = document.getElementById('smiles');
            smiles_parent.textContent = '';
            for (var id in game.smiles) {
                let img = document.createElement('img');
                img.className = 'smile';
                game.smiles[id].blocked && img.classList.add('blocked');
                img.setAttribute('smile_id', id);
                img.setAttribute('src', game.smiles[id].src);
                smiles_parent.appendChild(img);
            }
        }
        applyClasses(element, classes) {
            element.setAttribute("class", classes.join(" "));
        }
        normalizePosition(position) {
            return {
                x: position.x + 1,
                y: position.y + 1
            };
        }
        positionClass(position) {
            position = this.normalizePosition(position);
            return "tile-position-" + position.x + "-" + position.y;
        }
        addTile(tile) {
            let wrapper = document.createElement("div");
            let inner = document.createElement("div");
            let position = tile.previousPosition || {
                x: tile.x,
                y: tile.y
            };
            let positionClass = this.positionClass(position);

            // We can't use classlist because it somehow glitches when replacing classes
            let classes = ["tile", "tile-" + tile.value, positionClass];

            if (tile.value > 131072) classes.push("tile-super");

            this.applyClasses(wrapper, classes);

            inner.classList.add("tile-inner");
            inner.textContent = tile.value;

            if (tile.previousPosition) {
                // Make sure that the tile gets rendered in the previous position first
                window.requestAnimationFrame(() => {
                    classes[2] = this.positionClass({
                        x: tile.x,
                        y: tile.y
                    });
                    this.applyClasses(wrapper, classes); // Update the position
                });
            } else if (tile.mergedFrom) {
                classes.push("tile-merged");
                this.applyClasses(wrapper, classes);

                // Render the tiles that merged
                tile.mergedFrom.forEach((merged) => {
                    this.addTile(merged);
                });
            } else {
                classes.push("tile-new");
                this.applyClasses(wrapper, classes);
            }

            // Add the inner part of the tile to the wrapper
            wrapper.appendChild(inner);

            // Put the tile on the board
            this.tileContainer.appendChild(wrapper);
        }
        /**
         * @param   metadata    object
         {
            state: (string),
            score: (integer),
            name: (string),
            scoreObj: {
                score: (integer),
                steps: (integer),
                board: (object)
            },
            over: (boolean),
            won: (boolean),
            opponentScore: (integer),
            opponentName: (string),
            terminated: (boolean)
        }
         */
        actuate(grid, metadata) {
            window.requestAnimationFrame(() => {
                this.clearContainer(this.tileContainer);

                grid.cells.forEach((column) => {
                    column.forEach((cell) => {
                        if (cell) {
                            this.addTile(cell);
                        }
                    });
                });

                if (metadata.state) {
                    this.state = metadata.state;
                }
                if (metadata.name) {
                    this.updateName(metadata.name);
                }
                if (metadata.opponentName) {
                    this.updateOpponentName(metadata.opponentName);
                }
                this.updateScore(metadata.scoreObj);
                this.updateOpponentScore(metadata.opponentScore);

                if (metadata.terminated) {
                    if (metadata.out_of_moves) {
                        // TODO: think about it
                        game.socket.emit('nomoves');
                    }
                }

            });
        }
    }

    class SoloUIHTMLControl extends UIHTMLControl {
        constructor() {
            super();
            this.scoreContainers = [document.querySelector(".speedrun_score")];
        }

        updateScore(score) {
            this.clearContainer(this.scoreContainers[0]);
            this.score = score;

            this.scoreContainers[0].textContent = this.score;
        }

        message() {
            game.destroyMatch();
            game.changeScreen(SCREEN.GAMEOVER);
            document.querySelector('.container').className = `container solo lose`;
            document.querySelector('.modal_gameover').className = `modal_gameover solo`;
            document.querySelector('.endgame_status').textContent = chrome.i18n.getMessage('game_over');
            document.querySelector('.endgame_totaltime').textContent = '';

        }

        actuate(grid, metadata) {
            window.requestAnimationFrame(() => {
                this.clearContainer(this.tileContainer);

                grid.cells.forEach((column) => {
                    column.forEach((cell) => {
                        if (cell) {
                            this.addTile(cell);
                        }
                    });
                });

                if (metadata.state) {
                    this.state = metadata.state;
                }
                if (metadata.name) {
                    this.updateName(metadata.name);
                }
                this.updateScore(metadata.score);

                if (metadata.terminated) {
                    if (metadata.out_of_moves) {
                        // TODO: think about it

                    }
                }

            });
        }
    }

    /* BEGIN Battle Royale HTML Controller */
    class BattleRoyaleUIHTMLControl extends UIHTMLControl {
        constructor() {
            super();
            this.tileContainer = document.querySelector(".tile-container");
            this.scoreContainers = [document.querySelector(".br_your_score p"), document.querySelector(".endgame_brm_score")];
            this.nameContainers = [];

            this.player = {
                id: 0,
                score: 0,
                name: 'Your nickname'
            };
            this.opponents = [];
            this.finished = false;
        }
        updateScore(scoreObj) {
            let score = scoreObj.score;
            this.clearContainer(this.scoreContainers[0]);
            this.clearContainer(this.scoreContainers[1]);
            let difference = score - this.score;
            this.score = score;

            this.scoreContainers[0].textContent = this.score;
            this.scoreContainers[1].textContent = this.score;
            // TODO: add move event for battle royale
            game.socket.emit('brmm_move', {
                score: this.score
            });
            /*if (difference > 0) {
                let addition = document.createElement("div");
                addition.classList.add("score-addition");
                addition.textContent = "+" + difference;
    
                document.querySelector(".br_your_score").appendChild(addition);
            }*/
        }
        message(place) {
            log(`state = ${place}`);
            this.finished = true;
            game.changeScreen(SCREEN.GAMEOVERBR);
            document.querySelector('.modal_gameover').className = `modal_gameover ${place === 1 ? 'winbr' : 'losebr'}`;
            document.querySelector('.endgame_totaltime').textContent = `${chrome.i18n.getMessage("match_time_label")} ${formatTime(game.match_timer_counter)}`;
            document.querySelector('.endgame_status').textContent = `${place === 1 ? chrome.i18n.getMessage('rank_winner') : chrome.i18n.getMessage('rank') + '#' + place}`;
        }

        /**
         * @param   metadata    object
         {
            state: (string),
            score: (integer),
            name: (string),
            scoreObj: {
                score: (integer),
                steps: (integer),
                board: (object)
            },
            over: (boolean),
            won: (boolean),
            opponentScore: (integer),
            opponentName: (string),
            terminated: (boolean)
        }
         */
        actuate(grid, metadata) {
            window.requestAnimationFrame(() => {
                this.clearContainer(this.tileContainer);

                grid.cells.forEach((column) => {
                    column.forEach((cell) => {
                        if (cell) {
                            this.addTile(cell);
                        }
                    });
                });

                if (metadata.state) {
                    this.state = metadata.state;
                }
                if (metadata.name) {
                    this.updateName(metadata.name);
                }
                if (metadata.opponentName) {
                    this.updateOpponentName(metadata.opponentName);
                }
                this.updateScore(metadata.scoreObj);
                this.updateOpponentScore(metadata.opponentScore);

                if (metadata.terminated) {
                    if (metadata.out_of_moves) {
                        // TODO: think about it
                        game.socket.emit('brmm_nomoves');
                    }
                }
            });
        }
    }
    /* END Battle Royale HTML Controller */

    class MenuController {
        constructor(containerSelector, buttonSelector) {
            this.containerSelector = containerSelector;
            this.buttonSelector = buttonSelector;
            this.indicator = document.querySelector(`${this.containerSelector} .menu_button_indicator`);
            this.buttons = document.querySelectorAll(`${this.containerSelector} ${this.buttonSelector}`);
            this.containerBounds = document.querySelector(".content").getBoundingClientRect();
            this.focusedButton = this.buttons[0];

            for (let i = 0; i < this.buttons.length; i++) {
                this.buttons[i].addEventListener("focus", (event) => {
                    this.alignButtonIndicator(event.target);
                });
            }

            window.addEventListener('resize', () => {
                this.containerBounds = document.querySelector(".content").getBoundingClientRect();
                this.alignButtonIndicator();
            });
        }

        alignButtonIndicator(button) {
            button = button || this.focusedButton || document.querySelector(`${this.containerSelector} ${this.buttonSelector}:focus`);
            if (!button) {
                return;
            }
            const bounds = button.getBoundingClientRect();
            this.indicator.style.top = `${bounds.top - this.containerBounds.top}px`;
            this.focusedButton = button;
        }

        getFocusedButtonIndex() {
            const element = document.querySelector(`${this.containerSelector} ${this.buttonSelector}:focus`) ? document.activeElement : this.focusedButton;
            for (let i = 0; i < this.buttons.length; i++) {
                if (element === this.buttons[i]) {
                    return i;
                }
            }
            return -1;
        }

        down() {
            let index = this.getFocusedButtonIndex();
            if (index < 0) {
                return;
            }
            index = (index + 1) % this.buttons.length;
            this.buttons[index].focus();
        }

        up() {
            let index = this.getFocusedButtonIndex();
            if (index < 0) {
                return;
            }
            index = (index - 1 + this.buttons.length) % this.buttons.length;
            this.buttons[index].focus();
        }
    }

    class ShareDialog {
        constructor() {
            this.reset();
            this.visible = false;

            this.container = document.querySelector(".share_popup_container");

            this.linkInput = document.querySelector(".share_popup_container .social_button.link");

            this.menu = new MenuController(".share_popup", ".social_button");

            this.linkInput.addEventListener("click", () => {
                this.linkInput.select();
                document.execCommand('copy');
            });

            document.querySelector(".share_popup_container .close_button").addEventListener("click", () => {
                this.hide();
            });

            document.querySelector(".share_popup .social_button.facebook").addEventListener("click", () => {
                this.share("fb");
            });
            document.querySelector(".share_popup .social_button.twitter").addEventListener("click", () => {
                this.share("tw");
            });
            document.querySelector(".share_popup .social_button.vk").addEventListener("click", () => {
                this.share("vk");
            });


        }

        reset() {
            this.win = null;
            this.league = null;
            this.leagueUp = false;
            this.url = null;
            this.screenshot = null;
        }

        makePicture() {
            const images = {};
            const loadImage = (name) => {
                return new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => {
                        images[name] = image;
                        resolve();
                    }
                    image.src = `./files/images/${name}`;
                });
            }
            const resources = ['share-background.png', 'icon-goldladders.svg', 'icon-silverladders.svg', 'icon-bronzeladders.svg', 'icon-newbieladders.svg', 'icon-win.svg', 'icon-lose.svg', 'green-block.svg', 'red-block.svg'];
            return Promise.all(resources.map(loadImage)).then(() => {
                function txt(text, x, y, size, color, weight) {
                    weight = weight || 'bold';
                    ctx.font = `${weight} ${size}px 'Roboto'`;
                    ctx.fillStyle = color;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, x, y);
                }
                const canvas = document.createElement("canvas");
                canvas.width = 537;
                canvas.height = 240;
                const ctx = canvas.getContext("2d");

                ctx.drawImage(images['share-background.png'], 0, 0);

                if (game.currentScreen == SCREEN.GAMEOVER) {
                    // main icon
                    if (this.win) {
                        ctx.drawImage(images['icon-win.svg'], 227, 43, 84, 66);
                    } else {
                        ctx.drawImage(images['icon-lose.svg'], 236, 43, 66, 66);
                    }

                    // score containers
                    ctx.drawImage(images[this.win ? 'green-block.svg' : 'red-block.svg'], 29, 105, 133, 54);
                    txt(document.querySelector(".endgame_your_score").textContent, 43 + 52, 112 + 23, 36, '#faf8ef');

                    ctx.drawImage(images[!this.win ? 'green-block.svg' : 'red-block.svg'], 375, 105, 133, 54);
                    txt(document.querySelector(".endgame_opponent_score").textContent, 389 + 52, 112 + 23, 36, '#faf8ef');

                    // nicknames
                    txt(document.querySelector(".endgame_your_name").textContent, 43 + 52, 82 + 9, 15, '#a4917f');
                    txt(document.querySelector(".endgame_opponent_name").textContent, 389 + 52, 82 + 9, 15, '#a4917f');

                    // match time
                    txt(`${chrome.i18n.getMessage("match_time_label")} ${document.querySelector('.game_time').textContent}`,
                        200 + 138 / 2, 121 + 8, 14, '#8e7966', 'normal');

                    // result
                    txt(chrome.i18n.getMessage(this.win ? "you_win" : "you_lose"), 176 + 185 / 2, 137 + 47 / 2, 40, '#3d3d3d');

                    // score diff
                    txt(document.querySelector(".modal_gameover .endgame_pts").textContent, 225 + 88 / 2, 181 + 8, 14, this.win ? '#76c47d' : '#d9534f');
                } else {
                    const colors = {
                        'newbie': '#8e7966',
                        'bronze': '#c67a4b',
                        'silver': '#999999',
                        'gold': '#e39c29'
                    };
                    ctx.drawImage(images[`icon-${this.league}ladders.svg`], 219, 21, 100, 100);
                    txt(chrome.i18n.getMessage(this.leagueUp ? "leagueupdate_up" : "leagueupdate_down"), 194 + 150 / 2, 127 + 12, 20, colors[this.league]);
                    txt(chrome.i18n.getMessage(this.leagueUp ? "leagueupdate_moved_to" : "leagueupdate_moved_down"), 132 + 274 / 2, 153 + 32 / 2, 32, '#3d3d3d');
                    txt(chrome.i18n.getMessage(`leagueupdate_${this.league}`), 132 + 274 / 2, 153 + 32 + 32 / 2, 32, colors[this.league]);
                }
                return canvas.toDataURL('image/jpeg');
            }).catch((error) => {
                console.log(error);
            });
        }

        show() {
            this.makePicture().then((dataUrl) => {
                this.container.hidden = false;
                this.screenshot = dataUrl;
                this.toggleButtons(true);
                this.menu.focusedButton.focus();
            });
            this.visible = true;
            if (game.currentScreen == SCREEN.GAMEOVER) {
                this.linkInput.value = "https://play2048.pro/?utm_source=sharing&utm_medium=game_results";
            } else {
                this.linkInput.value = "https://play2048.pro/?utm_source=sharing&utm_medium=ranks";
            }
        }

        hide() {
            this.visible = false;
            this.container.hidden = true;

            // reset only actual shared data
            this.url = null;
            this.screenshot = null;
        }

        toggleButtons(state) {
            const buttons = document.querySelectorAll(".share_popup .social_button");
            for (let i = 0; i < buttons.length; i++) {
                buttons[i].disabled = !state;
            }
        }

        share(network) {
            function actualShare(url) {
                url = encodeURIComponent(url);
                let shareUrl;
                switch (network) {
                    case 'tw':
                        shareUrl = `https://twitter.com/intent/tweet?url=${url}`;
                        break;
                    case 'vk':
                        shareUrl = `https://vk.com/share.php?url=${url}`;
                        break;
                    case 'fb':
                    default:
                        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                        break;
                }
                window.open(shareUrl);
            }

            if (this.url) {
                actualShare(this.url);
            } else {
                this.upload().then(() => {
                    actualShare(this.url);
                }).catch(error => {

                });
            }
        }

        upload() {
            if (!this.screenshot) {
                return;
            }
            this.toggleButtons(false);
            return fetch("https://share2048.browser-games.xyz/share", {
                method: "POST",
                mode: "cors",
                body: JSON.stringify({
                    time: Date.now(),
                    reason: game.currentScreen == SCREEN.GAMEOVER ? (this.win ? 'win' : 'lose') : chrome.i18n.getMessage(`leagueupdate_${this.league}`),
                    img: this.screenshot,
                    lang: chrome.i18n.getMessage("@@ui_locale").slice(0, 2)
                })
            }).then((response) => response.json()).then(json => {
                this.toggleButtons(true);
                if (json.url) {
                    this.url = json.url;
                } else {
                    throw new Error("Error while creating URL for share");
                }
            });
        }
    }

    class Grid {
        constructor(size, previousState) {
            this.size = size;
            this.cells = previousState ? this.fromState(previousState) : this.empty();
        }
        empty() {
            let cells = [];
            for (let x = 0; x < this.size; x++) {
                let row = cells[x] = [];
                for (let y = 0; y < this.size; y++) {
                    row.push(null);
                }
            }
            return cells;
        }
        fromState(state) {
            let cells = [];
            for (let x = 0; x < this.size; x++) {
                let row = cells[x] = [];
                for (let y = 0; y < this.size; y++) {
                    let tile = state[x][y];
                    row.push(tile ? new Tile(tile.position, tile.value) : null);
                }
            }
            return cells;
        }
        // Find the first available random position
        randomAvailableCell() {
            let cells = this.availableCells();
            if (cells.length) {
                return cells[Math.floor(Math.random() * cells.length)];
            }
        }
        availableCells() {
            let cells = [];
            this.eachCell((x, y, tile) => {
                if (!tile) {
                    cells.push({
                        x: x,
                        y: y
                    });
                }
            });
            return cells;
        }
        // Call callback for every cell
        eachCell(callback) {
            for (let x = 0; x < this.size; x++) {
                for (let y = 0; y < this.size; y++) {
                    callback(x, y, this.cells[x][y]);
                }
            }
        }
        // Check if there are any cells available
        cellsAvailable() {
            return !!this.availableCells().length;
        }
        // Check if the specified cell is taken
        cellAvailable(cell) {
            return !this.cellOccupied(cell);
        }
        cellOccupied(cell) {
            return !!this.cellContent(cell);
        }
        cellContent(cell) {
            if (this.withinBounds(cell)) {
                return this.cells[cell.x][cell.y];
            } else {
                return null;
            }
        }
        // Inserts a tile at its position
        insertTile(tile) {
            this.cells[tile.x][tile.y] = tile;
        }
        removeTile(tile) {
            this.cells[tile.x][tile.y] = null;
        }
        withinBounds(position) {
            return position.x >= 0 && position.x < this.size && position.y >= 0 && position.y < this.size;
        }
        serialize() {
            let cellState = [];
            for (let x = 0; x < this.size; x++) {
                let row = cellState[x] = [];
                for (let y = 0; y < this.size; y++) {
                    row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
                }
            }
            return {
                size: this.size,
                cells: cellState
            };
        }
    }

    class Tile {
        constructor(position, value) {
            this.x = position.x;
            this.y = position.y;
            this.value = value || 2;

            this.previousPosition = null;
            this.mergedFrom = null; // Tracks tiles that merged together
        }
        savePosition() {
            this.previousPosition = {
                x: this.x,
                y: this.y
            };
        }
        updatePosition(position) {
            this.x = position.x;
            this.y = position.y;
        }
        serialize() {
            return {
                position: {
                    x: this.x,
                    y: this.y
                },
                value: this.value
            };
        }
    }

    class LocalStorageControl {
        constructor() {
            this.storage = window.localStorage;
            this.sStorage = window.SyncStorage;
            this.user = '';
        }

        init() {
            return new Promise(resolve => {
                isIdentityUnavailable ? resolve() : chrome.identity.getProfileUserInfo((info) => {
                    this.user = info.email || '';
                    resolve();
                });
            });
        }
        getBestScore() {
            return parseInt(this.storage[`${this.user}-bestScore`]) || 0;
        }
        saveBestScore(score) {
            this.storage[`${this.user}-bestScore`] = score;
        }
        getBestRun() {
            let bestRun = {
                "tile16": null,
                "tile32": null,
                "tile64": null,
                "tile128": null,
                "tile256": null,
                "tile512": null,
                "tile1024": null,
                "tile2048": null,
                "tile4096": null,
                "tile8192": null,
                "tile16384": null,
                "tile32768": null
            };
            try {
                bestRun = JSON.parse(this.storage[`${this.user}-bestRun`]);
            } catch (e) { }
            return bestRun;
        }
        setBestRun(jsonRun) {
            let bestRun = this.getBestRun();
            let updated = [];
            for (let val in jsonRun) {
                if (jsonRun[val]) {
                    if (bestRun[val]) {
                        if (jsonRun[val] < bestRun[val]) {
                            bestRun[val] = jsonRun[val];
                            updated.push(val);
                        }
                    } else {
                        bestRun[val] = jsonRun[val];
                        updated.push(val);
                    }
                }
            }
            this.storage[`${this.user}-bestRun`] = JSON.stringify(bestRun);
            return updated;
        }
        getGameState() {
            return this.storage[`${this.user}-gameState`] ? JSON.parse(this.storage[`${this.user}-gameState`]) : null;
        }
        saveGameState(state) {
            if (!state) {
                delete this.storage[`${this.user}-gameState`];
            } else {
                this.storage[`${this.user}-gameState`] = JSON.stringify(state);
            }
        }
    }

    const _instance = new WeakMap();

    class GameEngine {
        constructor(size, InputControl, HTMLControl, StorageControl) {
            if (_instance.has(this)) {
                return _instance.get(this);
            }
            this.size = size;
            this.inputManager = new InputControl;
            this.storageManager = new StorageControl;
            this.actuator = new HTMLControl;

            this.startTiles = 2;
            this.inputManager.on("move", this.move.bind(this));

            this.grid = new Grid(this.size);
            this.player = {
                score: 0,
                name: 'Your nickname'
            };
            this.opponent = {
                score: 0,
                name: 'Opponent nickname'
            };
            this.over = false;
            this.won = false;
            this.out_of_moves = false;
            this.steps = 0;
            this.state = 'playing';
            _instance.set(this);
        }
        get score() {
            return this.player.score;
        }
        set score(score) {
            this.player.score = score;
        }
        get opponentScore() {
            return this.opponent.score;
        }
        set opponentScore(score) {
            this.opponent.score = score;
        }
        get name() {
            return this.player.name;
        }
        set name(name) {
            this.player.name = name;
        }
        get opponentName() {
            return this.opponent.name;
        }
        set opponentName(name) {
            this.opponent.name = name;
        }
        isGameTerminated() {
            return this.over || this.won || this.out_of_moves;
        }
        movesAvailable() {
            return this.grid.cellsAvailable() || this.tileMatchesAvailable();
        }
        getVector(direction) {
            // Vectors representing tile movement
            let map = {
                0: {
                    x: 0,
                    y: -1
                }, // Up
                1: {
                    x: 1,
                    y: 0
                }, // Right
                2: {
                    x: 0,
                    y: 1
                }, // Down
                3: {
                    x: -1,
                    y: 0
                } // Left
            };
            return map[direction];
        }
        // Build a list of positions to traverse in the right order
        buildTraversals(vector) {
            let traversals = {
                x: [],
                y: []
            };

            for (let pos = 0; pos < this.size; pos++) {
                traversals.x.push(pos);
                traversals.y.push(pos);
            }

            // Always traverse from the farthest cell in the chosen direction
            if (vector.x === 1) traversals.x = traversals.x.reverse();
            if (vector.y === 1) traversals.y = traversals.y.reverse();

            return traversals;
        }
        prepareTiles() {
            this.grid.eachCell((x, y, tile) => {
                if (tile) {
                    tile.mergedFrom = null;
                    tile.savePosition();
                }
            });
        }
        findFarthestPosition(cell, vector) {
            let previous;

            // Progress towards the vector direction until an obstacle is found
            do {
                previous = cell;
                cell = {
                    x: previous.x + vector.x,
                    y: previous.y + vector.y
                };
            } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));

            return {
                farthest: previous,
                next: cell // Used to check if a merge is required
            };
        }
        // Move a tile and its representation
        moveTile(tile, cell) {
            this.grid.cells[tile.x][tile.y] = null;
            this.grid.cells[cell.x][cell.y] = tile;
            tile.updatePosition(cell);
        }
        positionsEqual(first, second) {
            return first.x === second.x && first.y === second.y;
        }
        // Adds a tile in a random position
        addRandomTile() {
            if (this.grid.cellsAvailable()) {
                let value = Math.random() < 0.9 ? 2 : 4;
                let tile = new Tile(this.grid.randomAvailableCell(), value);

                this.grid.insertTile(tile);
            }
        }
        // Check for available matches between tiles (more expensive check)
        tileMatchesAvailable() {
            let tile;
            for (let x = 0; x < this.size; x++) {
                for (let y = 0; y < this.size; y++) {
                    tile = this.grid.cellContent({
                        x: x,
                        y: y
                    });
                    if (tile) {
                        for (let direction = 0; direction < 4; direction++) {
                            let vector = this.getVector(direction);
                            let cell = {
                                x: x + vector.x,
                                y: y + vector.y
                            };

                            let other = this.grid.cellContent(cell);

                            if (other && other.value === tile.value) {
                                return true; // These two tiles can be merged
                            }
                        }
                    }
                }
            }
            return false;
        }
        // Sends the updated grid to the actuator
        actuate() {
            // Clear the state when the game is over (game over only)
            if (this.over) {
                //this.storageManager.clearGameState();
            } else {
                //this.storageManager.setGameState(this.serialize());
            }

            this.actuator.actuate(this.grid, {
                state: this.state,
                score: this.score,
                name: this.name,
                scoreObj: {
                    score: this.score,
                    steps: this.steps,
                    board: this.grid.serialize()
                },
                over: this.over,
                won: this.won,
                out_of_moves: this.out_of_moves,
                opponentScore: this.opponentScore,
                opponentName: this.opponentName,
                terminated: this.isGameTerminated()
            });
        }
        move(direction) {
            // 0: up, 1: right, 2: down, 3: left
            if (this.isGameTerminated()) return; // Don't do anything if the game's over

            let cell, tile;

            let vector = this.getVector(direction);
            let traversals = this.buildTraversals(vector);
            let moved = false;

            // Save the current tile positions and remove merger information
            this.prepareTiles();

            // Traverse the grid in the right direction and move tiles
            traversals.x.forEach((x) => {
                traversals.y.forEach((y) => {
                    cell = {
                        x: x,
                        y: y
                    };
                    tile = this.grid.cellContent(cell);

                    if (tile) {
                        let positions = this.findFarthestPosition(cell, vector);
                        let next = this.grid.cellContent(positions.next);

                        // Only one merger per row traversal?
                        if (next && next.value === tile.value && !next.mergedFrom) {
                            let merged = new Tile(positions.next, tile.value * 2);
                            merged.mergedFrom = [tile, next];

                            this.grid.insertTile(merged);
                            this.grid.removeTile(tile);

                            // Converge the two tiles' positions
                            tile.updatePosition(positions.next);

                            // Update the score
                            this.score += merged.value;
                        } else {
                            this.moveTile(tile, positions.farthest);
                        }
                        if (!this.positionsEqual(cell, tile)) {
                            moved = true; // The tile moved from its original cell!
                        }
                    }
                });
            });

            if (moved) {
                Number.isInteger(this.steps) && this.steps++;
                this.addRandomTile();

                if (!this.movesAvailable()) {
                    //this.over = true; // Game over! STATE: No any available moves
                    this.out_of_moves = true;
                }

                this.actuate();
            }
        }
        addStartTiles() {
            for (let i = 0; i < this.startTiles; i++) {
                this.addRandomTile();
            }
        }
        setup() {
            // Add the initial tiles
            this.addStartTiles();
            this.actuate();
        }
        serialize() {
            return {
                grid: this.grid.serialize(),
                score: this.score,
                name: this.name,
                opponentScore: this.opponentScore,
                opponentName: this.opponentName,
                over: this.over,
                won: this.won,
                out_of_moves: this.out_of_moves,
                steps: this.steps,
                state: this.state
            };
        }
    }

    class TimerPerformance {
        constructor(selector, offset = 0, onUpdate = () => { }) {
            this.timerID = null;
            this.startTime = null;
            this._time = 0;
            this.timerViewDOM = document.querySelector(selector);
            this.onUpdate = onUpdate;
            this.init(offset);
        }
        get offset() { return this._offset; }
        get time() { return this._time; }
        set time(time) {
            this._time = time + this.offset;
            this.timerViewDOM.textContent = this.formatTime(this.time);
        }
        formatTime(time) {
            return `${~~(time / 60000)}`.padStart(2, 0) + ':' + `${~~((time - (~~(time / 60000)) * 60000) / 1000)}`.padStart(2, 0) + '.' + `${~~(time - (~~(time / 60000)) * 60000 - (~~((time - (~~(time / 60000)) * 60000) / 1000)) * 1000)}`.padStart(3, 0);// + '.' + `${(time - (~~(time/60000)) * 60000 - (~~((time - (~~(time/60000)) * 60000)/1000)) * 1000) - (~~(time - (~~(time/60000)) * 60000 - (~~((time - (~~(time/60000)) * 60000)/1000)) * 1000))}`.replace('0.', '');
        }
        now() { return performance.now(); }
        init(offset = 0) {
            this._offset = offset;
            this.time = 0;
        }
        get isRunning() { return !!this.timerID; }
        start() {
            clearInterval(this.timerID);
            this.timerID = null;
            this.startTime = this.now();
            this.timerID = setInterval((startTime) => { this.update(startTime); }, 1000 / 60, this.startTime);
        }
        update(startTime) {
            let curTime = this.now();
            this.time = curTime - startTime;
            this.onUpdate(this.time);
        }
        stop() {
            if (this.isRunning) {
                clearInterval(this.timerID);
                this.timerID = null;
                let curTime = this.now();
                this.time = curTime - this.startTime;
            }
        }
        toJSON() {
            return {
                timerID: this.timerID,
                startTime: this.startTime,
                time: this.time,
                offset: this.offset
            }
        }
    }

    class SoloGameEngine extends GameEngine {
        constructor(size, InputControl, HTMLControl, StorageControl) {
            super(size, InputControl, HTMLControl, StorageControl);
            this.firstMove = false;
            this.checkpoints = {
                "tile16": null,
                "tile32": null,
                "tile64": null,
                "tile128": null,
                "tile256": null,
                "tile512": null,
                "tile1024": null,
                "tile2048": null,
                "tile4096": null,
                "tile8192": null,
                "tile16384": null,
                "tile32768": null
            };
            this.updated = false;
        }

        setup() {
            document.querySelector(`.checkpoint.one`).classList.toggle('one', false);
            document.querySelector(`.checkpoint.two`).classList.toggle('two', false);
            document.querySelector(`.checkpoint.three`).classList.toggle('three', false);
            document.querySelector(`.checkpoint.tile16`).classList.toggle('one', true);
            document.querySelector(`.checkpoint.tile32`).classList.toggle('two', true);
            document.querySelector(`.checkpoint.tile64`).classList.toggle('three', true);

            document.querySelector('.endgame_best_run').classList.toggle('updated', false);
            document.querySelector('.srb_best_run').classList.toggle('updated', false);

            let arr = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
            for (let i = 0, len = arr.length; i < len; i++) {
                document.querySelector(`.checkpoint.tile${arr[i]} .cp_time p`).textContent = `-`;
                document.querySelector(`.srm_endgame_results .checkpoint.tile${arr[i]} .cp_time p`).textContent = `-`;
                document.querySelector(`.speedrun_best_results .checkpoint.tile${arr[i]}`).classList.toggle('updated', false);
            }
            this.storageManager.init().then(() => {
                this.addStartTiles();
                this.timer = new TimerPerformance(".solo-scores-container .speedrun_timer", 0);
                this.actuate();
                this.saveGame();
            });
        }

        quit() {
            this.timer.stop();
        }

        saveGame() {
            let updated = this.storageManager.setBestRun(this.checkpoints);
            let bestRun = this.storageManager.getBestRun();
            let arr = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
            for (let i = 0, len = arr.length; i < len; i++) {
                document.querySelector(`.speedrun_best_results .checkpoint.tile${arr[i]} .cp_time p`).textContent = `${bestRun['tile' + arr[i]] ? this.timer.formatTime(bestRun['tile' + arr[i]]) : '-'}`;
                if (updated.indexOf(`tile${arr[i]}`) !== -1) {
                    document.querySelector(`.speedrun_best_results .checkpoint.tile${arr[i]}`).classList.toggle('updated', true);
                }/* else {
                document.querySelector(`.speedrun_best_results .checkpoint.tile${arr[i]}`).classList.toggle('updated', false);
            }*/
            }
            if (updated.length > 0) {
                this.updated = true;
                document.querySelector('.endgame_best_run').classList.toggle('updated', true);
                document.querySelector('.srb_best_run').classList.toggle('updated', true);
            }/* else {
            document.querySelector('.endgame_best_run').classList.toggle('updated', false);
        }*/
            return updated;
            // TODO: fix for speedrun
            /*this.storageManager.saveGameState({
                grid: this.grid.serialize(),
                score: this.score,
                time: this.timer_counter
            });*/
        }

        eraseGame() {
            this.storageManager.saveGameState(null);
        }
        move(direction) {
            // 0: up, 1: right, 2: down, 3: left
            if (this.isGameTerminated()) return; // Don't do anything if the game's over

            let cell, tile;

            let vector = this.getVector(direction);
            let traversals = this.buildTraversals(vector);
            let moved = false;

            // Save the current tile positions and remove merger information
            this.prepareTiles();

            // Traverse the grid in the right direction and move tiles
            traversals.x.forEach((x) => {
                traversals.y.forEach((y) => {
                    cell = {
                        x: x,
                        y: y
                    };
                    tile = this.grid.cellContent(cell);

                    if (tile) {
                        let positions = this.findFarthestPosition(cell, vector);
                        let next = this.grid.cellContent(positions.next);

                        // Only one merger per row traversal?
                        if (next && next.value === tile.value && !next.mergedFrom) {
                            let merged = new Tile(positions.next, tile.value * 2);
                            merged.mergedFrom = [tile, next];

                            this.grid.insertTile(merged);
                            this.grid.removeTile(tile);

                            // Converge the two tiles' positions
                            tile.updatePosition(positions.next);

                            // Update the score
                            this.score += merged.value;

                            if ((merged.value === 16 || merged.value === 32 || merged.value === 64 ||
                                merged.value === 128 || merged.value === 256 || merged.value === 512 ||
                                merged.value === 1024 || merged.value === 2048 || merged.value === 4096 ||
                                merged.value === 8192 || merged.value === 16384 || merged.value === 32768) && !this.checkpoints[`tile${merged.value}`]) {
                                let time = this.timer.time;
                                this.checkpoints[`tile${merged.value}`] = time;
                                document.querySelector(`.checkpoint.one`).classList.toggle('one', false);
                                document.querySelector(`.checkpoint.two`).classList.toggle('two', false);
                                document.querySelector(`.checkpoint.three`).classList.toggle('three', false);
                                if (merged.value === 16) {
                                    document.querySelector(`.checkpoint.tile16`).classList.toggle('one', true);
                                    document.querySelector(`.checkpoint.tile32`).classList.toggle('two', true);
                                    document.querySelector(`.checkpoint.tile64`).classList.toggle('three', true);
                                } else if (merged.value === 32) {
                                    document.querySelector(`.checkpoint.tile16`).classList.toggle('one', true);
                                    document.querySelector(`.checkpoint.tile32`).classList.toggle('two', true);
                                    document.querySelector(`.checkpoint.tile64`).classList.toggle('three', true);
                                } else if (merged.value === 64) {
                                    document.querySelector(`.checkpoint.tile32`).classList.toggle('one', true);
                                    document.querySelector(`.checkpoint.tile64`).classList.toggle('two', true);
                                    document.querySelector(`.checkpoint.tile128`).classList.toggle('three', true);
                                } else if (merged.value === 128) {
                                    document.querySelector(`.checkpoint.tile64`).classList.toggle('one', true);
                                    document.querySelector(`.checkpoint.tile128`).classList.toggle('two', true);
                                    document.querySelector(`.checkpoint.tile256`).classList.toggle('three', true);
                                } else if (merged.value === 256) {
                                    document.querySelector(`.checkpoint.tile128`).classList.toggle('one', true);
                                    document.querySelector(`.checkpoint.tile256`).classList.toggle('two', true);
                                    document.querySelector(`.checkpoint.tile512`).classList.toggle('three', true);
                                } else if (merged.value === 512) {
                                    document.querySelector(`.checkpoint.tile256`).classList.toggle('one', true);
                                    document.querySelector(`.checkpoint.tile512`).classList.toggle('two', true);
                                    document.querySelector(`.checkpoint.tile1024`).classList.toggle('three', true);
                                } else if (merged.value === 1024) {
                                    document.querySelector(`.checkpoint.tile512`).classList.toggle('one', true);
                                    document.querySelector(`.checkpoint.tile1024`).classList.toggle('two', true);
                                    document.querySelector(`.checkpoint.tile2048`).classList.toggle('three', true);
                                } else if (merged.value === 2048) {
                                    document.querySelector(`.checkpoint.tile1024`).classList.toggle('one', true);
                                    document.querySelector(`.checkpoint.tile2048`).classList.toggle('two', true);
                                    document.querySelector(`.checkpoint.tile4096`).classList.toggle('three', true);
                                } else if (merged.value === 4096) {
                                    document.querySelector(`.checkpoint.tile2048`).classList.toggle('one', true);
                                    document.querySelector(`.checkpoint.tile4096`).classList.toggle('two', true);
                                    document.querySelector(`.checkpoint.tile8192`).classList.toggle('three', true);
                                } else if (merged.value === 8192) {
                                    document.querySelector(`.checkpoint.tile4096`).classList.toggle('one', true);
                                    document.querySelector(`.checkpoint.tile8192`).classList.toggle('two', true);
                                    document.querySelector(`.checkpoint.tile16384`).classList.toggle('three', true);
                                } else if (merged.value === 16384) {
                                    document.querySelector(`.checkpoint.tile8192`).classList.toggle('one', true);
                                    document.querySelector(`.checkpoint.tile16384`).classList.toggle('two', true);
                                    document.querySelector(`.checkpoint.tile32768`).classList.toggle('three', true);
                                } else if (merged.value === 32768) {
                                    document.querySelector(`.checkpoint.tile8192`).classList.toggle('one', true);
                                    document.querySelector(`.checkpoint.tile16384`).classList.toggle('two', true);
                                    document.querySelector(`.checkpoint.tile32768`).classList.toggle('three', true);
                                } else {
                                    document.querySelector(`.checkpoint.tile8192`).classList.toggle('one', true);
                                    document.querySelector(`.checkpoint.tile16384`).classList.toggle('two', true);
                                    document.querySelector(`.checkpoint.tile32768`).classList.toggle('three', true);
                                }
                                document.querySelector(`.checkpoint.tile${merged.value} .cp_time p`).textContent = `${this.timer.formatTime(time)}`;
                                document.querySelector(`.srm_endgame_results .checkpoint.tile${merged.value} .cp_time p`).textContent = `${this.timer.formatTime(time)}`;
                                this.saveGame();
                            }
                        } else {
                            this.moveTile(tile, positions.farthest);
                        }
                        if (!this.positionsEqual(cell, tile)) {
                            moved = true; // The tile moved from its original cell!
                        }
                    }
                });
            });

            if (moved) {
                if (!this.firstMove) {
                    this.firstMove = true;
                    this.timer.start();
                }
                Number.isInteger(this.steps) && this.steps++;
                this.addRandomTile();

                if (!this.movesAvailable()) {
                    //this.over = true; // Game over! STATE: No any available moves
                    this.out_of_moves = true;
                }

                this.actuate();
            }
        }
        actuate() {
            if (this.out_of_moves) {
                let updated = this.saveGame();
                this.actuator.message();
                this.eraseGame();
                this.quit();
                game.setHint({
                    msg: this.updated > 0 ? chrome.i18n.getMessage('speedrun_updated_hint') : '',
                    type: this.updated > 0 ? "success" : "normal"
                });
            }/* else {
            this.saveGame();
        }*/
            this.actuator.actuate(this.grid, {
                state: this.state,
                score: this.score,
                name: this.name,
                scoreObj: {
                    score: this.score,
                    steps: this.steps,
                    board: this.grid.serialize()
                },
                over: this.over,
                won: this.won,
                out_of_moves: this.out_of_moves,
                terminated: this.isGameTerminated()
            });
        }
    }

    /* BEGINE Battle Royale Game Engine */
    const _brmm_instance = new WeakMap();

    class BattleRoyaleGameEngine extends GameEngine {
        constructor(size, data, InputControl, HTMLControl, StorageControl) {
            super(size, InputControl, HTMLControl, StorageControl);
            if (_brmm_instance.has(this)) {
                return _brmm_instance.get(this);
            }
            this.player = {
                id: 4462,
                score: 0,
                name: 'Your nickname'
            };
            this.opponents = [];
            this.over = false;
            this.won = false;
            this.out_of_moves = false;
            this.steps = 0;
            this.state = 'playing';
            _brmm_instance.set(this);
        }

        // Sends the updated grid to the actuator
        actuate() {
            // Clear the state when the game is over (game over only)

            this.actuator.actuate(this.grid, {
                state: this.state,
                score: this.score,
                name: this.name,
                scoreObj: {
                    score: this.score,
                    steps: this.steps,
                    board: this.grid.serialize()
                },
                over: this.over,
                won: this.won,
                out_of_moves: this.out_of_moves,
                opponentScore: this.opponentScore,
                opponentName: this.opponentName,
                terminated: this.isGameTerminated()
            });
        }
        setup() {
            // Add the initial tiles
            this.addStartTiles();
            this.actuate();
        }
        serialize() {
            return {
                grid: this.grid.serialize(),
                score: this.score,
                name: this.name,
                opponentScore: this.opponentScore,
                opponentName: this.opponentName,
                over: this.over,
                won: this.won,
                out_of_moves: this.out_of_moves,
                steps: this.steps,
                state: this.state
            };
        }
    }
    /* END Battle Royale Game Engine */

    const port = (isFF ? browser.runtime : chrome.extension).connect({
        name: chrome.i18n.getMessage('appName')
    });
    port.onMessage.addListener((data) => {
        // data = { success: true, type: 'products' }
        log("message recieved : " + JSON.stringify(data));
        try {
            if (data.success) {
                if (data.type === 'products') {
                    //    game.socket && game.socket.emit('shop_products');
                    window.store.getInfo(true, true, () => {
                        singleGame.checkCanUndo();
                        window.store.getProducts(true, (products) => {
                            if (game.currentModal == MODAL.SHOP) {
                                game.changeModal(MODAL.NONE);
                                if (game.currentScreen == SCREEN.SINGLE) {
                                    singleGame.unblock();
                                }
                            }
                            if (data.product == 'night_mode') {
                                game.setNightMode(true);
                            }
                        });
                    });
                }
            }
        } catch (e) { }
    });

    class GameManager {
        constructor() {
            this.storage = window.localStorage;

            this.serverUrl = "https://beta.apihub.info";
            this.rmmTimer = null;
            this.match = null;
            this.match_timer = null;
            this.match_timer_counter = 0;
            this.timeout_timer = null;
            this.timeout_counter = 0;
            this.timeout_limit = 0;
            this.currentScreen = SCREEN.PRELOAD;
            this.screenPool = [];
            this.currentModal = '';

            this.currentMM = 0; /* 0 - NONE, 1 - RMM, 2 - PMM, 3 - BR */
            this.prevMatch = 0; /* 0 - NONE, 1 - Rating Duel, 2 - Private Duel Host, 3 - Battle Royale, 4 - Private Duel Join, 5 - Speedrun, 6 - Classic */
            this.mmpHintDOM = document.querySelector('.mm_hint');
            this.mmpMainDOM = document.querySelector('.matchmaking_popup');

            this._nickname = '';
            this._rating = 0;

            //battleroyale's first places count
            this._rank1 = 0;

            this._league = 'newbie';
            this._position = -1;
            this._ready = false;
            this._id = 0;
            this._avatar = "files/images/avatars/icon-profile.png";
            this.shareDialog = new ShareDialog();

            this.pmm_attempts = 0;
            this.pmm_attempts_max = 5;
            this.pmm_attempts_interval = 3000;
            this.pmm_attempts_timer = null;

            this.pmm_counter = {
                oid: 0,
                you: 0,
                enemy: 0
            };

            // Timer Countdown for Battle Royale Match Ready Stage
            this.brmm_countdown_ready = null;
            this.brmm_countdown_ready_counter = 5;

            this.brmm_countdown_outsider_counter = 30;

            this.last_log = ``;

            this.opponent = {
                nickname: '',
                rating: 0,
                score: 0,
                ready: false,
                id: -1
            };

            this.init();
            this.setNightMode(this.storage['night_mode_on'] === '1');
        }
        get position() {
            return this._position;
        }
        set position(newPosition) {
            this._position = newPosition;
            document.querySelector('.short_info_top_position .short_info_value').textContent = newPosition;
        }
        get rating() {
            return this._rating;
        }
        set rating(newRating) {
            this._rating = newRating;
            document.querySelector('.short_info_rating .short_info_value').textContent = `${this.rating} ${chrome.i18n.getMessage('label_pts')}`;
            if (newRating < 200) {
                document.querySelector('.short_info').className = 'short_info';
            } else {
                document.querySelector('.short_info').className = 'short_info si_plus';
                let league = newRating < 600 ? 'bronze' : (newRating < 1000 ? 'silver' : 'gold');
                document.querySelector('.short_info_league .short_info_value').textContent = chrome.i18n.getMessage(`${league}_ladders`);
                document.querySelector('.short_info_icon_ladders').src = `files/images/icon-${league}ladders.svg`
            }
        }
        get avatar() {
            return this._avatar;
        }
        set avatar(newAvatar) {
            this._avatar = newAvatar;
        }

        get rank1() {
            return this._rank1;
        }
        set rank1(newRank1) {
            this._rank1 = newRank1;
        }

        get id() {
            return this._id;
        }
        set id(newId) {
            this._id = newId;
            document.querySelector('.profile-option').dataset.profile = newId;
            document.querySelector('.endgame_your_name').dataset.profile = newId;
            document.querySelector('.above-game .your_name').dataset.profile = newId;
        }
        get nickname() {
            return this._nickname;
        }
        set nickname(newNickname) {
            if (newNickname) {
                this.storage['nickname'] = newNickname;
                this._nickname = newNickname;
                document.querySelector('#nickname').value = newNickname;
            }
        }
        get ready() {
            return this._ready;
        }
        set ready(r) {
            this._ready = r;
        }
        get hasNightMode() {
            return this._has_night_mode;
        }
        set hasNightMode(nm) {
            this._has_night_mode = nm;
        }
        get smiles() {
            return this._smiles;
        }
        set smiles(s) {
            this._smiles = s;
        }
        get products() {
            return this._products;
        }
        set products(p) {
            this._products = p;
        }
        /**
         *
         * @param   Object  data        {
         *                                  id: (Integer), 
         *                                  score: (Integer), 
         *                                  nickname: (String), 
         *                                  alive: (Boolean), 
         *                                  place: (Integer: 1-10), 
         *                                  reason: ('surrender' || 'timeout' || 'disconnect' || 'nomoves'), 
         *                                  avatar: (Integer : 1-21)
         *                              }
         */
        brmm_update_players(data) {

            let total = data.players.length;
            let alive = 0;
            let minScore = Infinity, minId = -1;
            document.querySelector('.outsider') && document.querySelector('.outsider').classList.toggle('outsider', false);
            let yinfo = {
                id: this.id,
                nickname: this.nickname,
                score: this.score,
                alive: true,
                place: -1,
                reason: 'timeout',
                i: 0
            };
            document.querySelector(`.br_players .you`) && document.querySelector(`.br_players .you`).classList.toggle('you', false);
            data.players = data.players.sort((a, b) => {
                if (!a.alive && !b.alive) {
                    return 0;
                }
                if (!a.alive) {
                    return 1;
                }
                if (!b.alive) {
                    return -1;
                }
                return b.score - a.score;
            });
            for (let i = data.players.length; i <= 9; i++) {
                document.querySelector(`.brp_${i + 1}`).classList.toggle('brloser', true);
            }
            data.players.sort((a, b) => {
                let val_a = a.place >= 1 && a.place <= 10 ? a.place : -a.score;
                let val_b = b.place >= 1 && b.place <= 10 ? b.place : -b.score;
                return val_a - val_b;
            })
            for (let i = 0; i < data.players.length; i++) {
                let info = data.players[i];
                /*
                { id: (Integer), nickname: (String), score: (Integer), alive: (Boolean), place: (Integer)}
                */
                if (info.alive) {
                    alive++;
                }
                document.querySelector(`.brp_${i + 1}`).dataset.brpid = info.id;

                document.querySelector(`.brp_${i + 1} .mini-avatar`).src = `files/images/avatars/${this.storage['night_mode_on'] == '1' ? 'dark' : 'normal'}/a-24-px-lvl-${info.avatar}.svg`;

                info.i = i;
                info.id === this.id && (document.querySelector(`.brp_${i + 1}`).classList.toggle('you', true));
                info.id === this.id && (yinfo = info) && (yinfo.i = i);
                !info.alive && (document.querySelector(`.brp_${i + 1}`).classList.toggle('brloser', true));
                if (info.place >= 1 && info.place <= 10) {
                    document.querySelector(`.ebrmrt-row-${info.place}`).dataset.profile = info.id;
                    document.querySelector(`.ebrmrt-row-${info.place} .ebrmrt-col-nickname`).textContent = info.nickname;
                    document.querySelector(`.ebrmrt-row-${info.place} .ebrmrt-col-reason`).textContent = info.place === 1 ? chrome.i18n.getMessage(`rank_winner_s`) : chrome.i18n.getMessage(`reason_${info.reason}`);;
                    document.querySelector(`.ebrmrt-row-${info.place} .ebrmrt-col-score`).textContent = info.score;
                } else {
                    document.querySelector(`.ebrmrt-row-${i + 1}`).dataset.profile = info.id;
                    document.querySelector(`.ebrmrt-row-${i + 1} .ebrmrt-col-nickname`).textContent = info.nickname;
                    document.querySelector(`.ebrmrt-row-${i + 1} .ebrmrt-col-reason`).textContent = info.place === -1 ? chrome.i18n.getMessage(`rank_playing`) : info.place === 1 ? chrome.i18n.getMessage(`rank_winner_s`) : chrome.i18n.getMessage(`reason_${info.reason}`);;
                    document.querySelector(`.ebrmrt-row-${i + 1} .ebrmrt-col-score`).textContent = info.score;
                }
                if (info.alive) {
                    if (minScore >= info.score) {
                        minScore = info.score;
                        minId = info.id;
                    }
                }
            }
            alive > 0 && (document.querySelector(`.br_players`).className = `br_players alive_${alive}`);
            if (minId !== -1 && alive > 1) {
                document.querySelector(`[data-brpid="${minId}"]`).classList.toggle('outsider', true);
            }
            if (minId === this.id && yinfo.alive && this.match) {
                document.querySelector('.container').className = 'container penalty_danger';
                this.setHint({
                    msg: chrome.i18n.getMessage('lowest_score_br'),
                    type: 'penalty_danger'
                });
            } else {
                if (document.querySelector('.container').className.match(/penalty_danger/)) {
                    // TODO: restore previous notification
                    this.setHint({
                        msg: this.last_log || '',
                        type: 'normal'
                    });
                }
                document.querySelector('.container').className = (this.brmm_countdown_outsider_counter <= 10 && this.match) ? 'container outrunning' : 'container';
            }
            // TODO: replace with value of you forwarder
            //document.querySelector(`.br_alive p`).textContent = `${alive} / ${total}`;
            document.querySelector(`.right_neighbour`) && document.querySelector(`.right_neighbour`).classList.toggle('right_neighbour', false);
            document.querySelector(`.left_neighbour`) && document.querySelector(`.left_neighbour`).classList.toggle('left_neighbour', false);
            document.querySelector(`.br_alive2`).classList.toggle('outsider', false);

            if (yinfo.alive && data.players.length > 1) {
                let left_neighbour;
                let right_neighbour;
                if (yinfo.i === 0) {
                    // You're the first one

                    right_neighbour = data.players[yinfo.i + 1];
                    document.querySelector(`.brp_${right_neighbour.i + 1}`).classList.toggle('right_neighbour', true);
                    document.querySelector(`.br_alive p`).textContent = chrome.i18n.getMessage('battleroyale__infobar_label_you');
                    document.querySelector(`.br_nickname_left p`).textContent = yinfo.nickname;
                    document.querySelector(`.br_alive2 p`).textContent = `${right_neighbour.score - yinfo.score > 0 ? '-' : ''}${right_neighbour.score - yinfo.score}`;
                    document.querySelector(`.br_nickname_right p`).textContent = right_neighbour.nickname;
                } else if (yinfo.i === data.players.length - 1) {
                    // You're the last one
                    left_neighbour = data.players[yinfo.i - 1];
                    document.querySelector(`.brp_${left_neighbour.i + 1}`).classList.toggle('left_neighbour', true);
                    document.querySelector(`.br_alive p`).textContent = `+${left_neighbour.score - yinfo.score}`;
                    document.querySelector(`.br_nickname_left p`).textContent = left_neighbour.nickname;
                    document.querySelector(`.br_alive2 p`).textContent = chrome.i18n.getMessage('battleroyale__infobar_label_you');
                    document.querySelector(`.br_nickname_right p`).textContent = yinfo.nickname;
                    document.querySelector(`.br_alive2`).classList.toggle('outsider', true);
                } else {
                    // Otherwise
                    right_neighbour = data.players[yinfo.i + 1];
                    left_neighbour = data.players[yinfo.i - 1];
                    document.querySelector(`.brp_${left_neighbour.i + 1}`).classList.toggle('left_neighbour', true);
                    document.querySelector(`.br_alive p`).textContent = `+${left_neighbour.score - yinfo.score}`;
                    document.querySelector(`.br_nickname_left p`).textContent = left_neighbour.nickname;
                    if (right_neighbour.alive) {
                        // both are alive
                        document.querySelector(`.brp_${right_neighbour.i + 1}`).classList.toggle('right_neighbour', true);
                        document.querySelector(`.br_alive2 p`).textContent = `${right_neighbour.score - yinfo.score > 0 ? '-' : ''}${right_neighbour.score - yinfo.score}`;
                        document.querySelector(`.br_nickname_right p`).textContent = right_neighbour.nickname;
                    } else {
                        // only left neighbour is alive
                        document.querySelector(`.br_alive2 p`).textContent = chrome.i18n.getMessage('battleroyale__infobar_label_you');
                        document.querySelector(`.br_nickname_right p`).textContent = yinfo.nickname;
                        document.querySelector(`.br_alive2`).classList.toggle('outsider', true);
                    }
                }
            }
            if (this.match && !this.match.actuator.finished) {
                if ((yinfo.alive && alive <= 1) || !yinfo.alive) {
                    document.querySelector('.endgame_brm_reason').textContent = yinfo.place === 1 ? '' : chrome.i18n.getMessage(`reason_${yinfo.reason}`);
                    document.querySelector(`.ebrmrt-row-${yinfo.place}`).classList.toggle('self', true);
                    if (yinfo.place === 1) {
                        this.rank1 += 1;
                        this.updateUserInfo();
                    }
                    this.match.actuator.message(yinfo.place);
                    this.match.inputManager.keyDownEnabled = false;
                    //this.destroyMatch();
                }
            }
            if (alive <= 1) {
                document.querySelector('.endgame_image').classList.toggle('hidden', false);
                document.querySelector('.endgame_image_timer').classList.toggle('hidden', true);
                this.destroyMatch();
            } else {
                document.querySelector('.endgame_image').classList.toggle('hidden', true);
                document.querySelector('.endgame_image_timer').classList.toggle('hidden', false);
            }
        }

        updateUserInfo() {
            if (Auth.logged_as) {
                singleGame.getLocalScore().then(best_score => {
                    window.store.getInfo(true, true, false, { online: this.rating, classic: best_score, br_wins: this.rank1 });
                });
            }
        }

        init() {
            this.menu = new MenuController(".content", ".menu_button");
            this.menuRMM = new MenuController(".public_lobby", ".pl_button");

            this.AftergameModuleInstance = new AftergameModule(this);

            Auth.login({ interactive: false }).then((logged) => {
                this.screenPool = [logged ? SCREEN.MENU_LOGGED : SCREEN.MENU];
                if (logged) {
                    if (Auth.logged_as) {
                        singleGame.getUserScoreAndUpdateLocal();
                    }
                    Auth.accountInfo().then((accountInfo) => {
                        this.position = accountInfo.position;
                        if (this.storage['new_nickname']) {
                            if (game.socket) {
                                game.socket.emit('nickname', {
                                    nickname: this.storage['new_nickname']
                                });
                            }
                            this.nickname = this.storage['new_nickname'];
                            saveNickname(this.nickname);
                        } else {
                            this.nickname = accountInfo.nickname;
                        }
                        this.rating = accountInfo.rating;
                        this.rank1 = accountInfo.rank1;
                        this.id = accountInfo.id;
                        this.updateUserInfo();

                    }).catch((error) => {
                        this.nickname = this.storage['nickname'];
                    });
                    let on_reload_settings_socket = JSON.parse(this.storage['on_reload_settings_socket'] || '{}');
                    if (on_reload_settings_socket && Object.keys(on_reload_settings_socket).length > 0) {
                        this.init_socket(on_reload_settings_socket);
                    } else {
                        this.changeScreen(SCREEN.MENU_LOGGED);
                    }
                } else {
                    this.nickname = this.storage['nickname'];
                    this.changeScreen(SCREEN.MENU);
                    this.storage['night_mode_on'] = '0';
                    window.store.clearNightStyleData();
                    this.setNightMode(this.storage['night_mode_on'] === '1');
                }
                this.changeModal(MODAL.NONE);
            }).catch((error) => {
                this.nickname = this.storage['nickname'];
                this.changeScreen(SCREEN.MENU);
                this.storage['night_mode_on'] = '0';
                window.store.clearNightStyleData();
                this.setNightMode(this.storage['night_mode_on'] === '1');
            });
        }
        // socket initialized only after auth, so use init_socket when auth required
        init_socket(settings, callback, unauth_callback) {
            if (!Auth.logged_as) {
                this.storage['on_reload_settings_socket'] = JSON.stringify(settings);
                if (unauth_callback) {
                    unauth_callback();
                }
                else {
                    game.changeScreen(SCREEN.SIGNIN);
                }

                return;
            }
            if (this.socket) {
                delete this.storage['on_reload_settings_socket'];
                callback && callback();
                return;
            }

            game.changeScreen(SCREEN.SIMPLE_LOADING);
            try {
                this.socket = io.connect(this.serverUrl);
            } catch (e) {
                log(`Cannot connect to server`);
                return;
            }

            this.socket.on('connect', (data) => {
                log(`socket :: connect :: ${JSON.stringify(data)}`);
                if (Auth.logged_as) {
                    game.socket.emit('signin');
                } else {
                    game.changeScreen(SCREEN.SIGNIN);
                }
                return;
            });
            this.socket.on('versions_compatibility', (data) => {
                // TODO : for chrome version control
                /* data = { chrome_version: (Integer), minimum_chrome_version: (Integer)} */
                /*port.postMessage({
                    upgradeChrome: true
                });*/
            })
            this.socket.on('online', (data) => {
                /* data = { authenticated: (Integer) }*/
                document.querySelector('.online_counter').textContent = `${chrome.i18n.getMessage('online_counter')}: ${data.authenticated}`;
            });
            this.socket.on('reconnect', (attemptNumber) => {
                log(`socket :: reconnect :: ${attemptNumber}`);
                this.setHint({
                    msg: chrome.i18n.getMessage('reconnected'),
                    type: 'success'
                });
                document.location.reload();
            });
            this.socket.on('reconnecting', (attemptNumber) => {
                log(`socket :: reconnecting :: ${attemptNumber}`);
                this.setHint({
                    msg: chrome.i18n.getMessage('reconnecting'),
                    type: 'normal'
                });
            });
            this.socket.on('reconnect_error', (error) => {
                log(`socket :: reconnect_error :: ${error}`);
            });
            this.socket.on('reconnect_failed', () => {
                log(`socket :: reconnect_failed`);
            });
            this.socket.on('pong', (latency) => {
                log(`socket :: pong latency = ${latency}`);
            });
            this.socket.on('disconnect', (data) => {
                log(`socket :: disconnect :: ${JSON.stringify(data)}`);
                this.changeScreen(SCREEN.DISCONNECTED);
                document.querySelector('.loading_text').textContent = chrome.i18n.getMessage('loading');
            });

            this.socket.on('error', (data) => {
                log(`socket :: error :: ${JSON.stringify(data)}`);
                this.changeScreen(SCREEN.DISCONNECTED);
                setTimeout(() => {
                    document.location.reload();
                }, 5 * 1000);
            });
            this.socket.on('another_device', () => {
                this.cancelMatchMakingPopup();
                Auth.logout().then(() => {
                    document.location.reload();
                });
            });
            this.socket.on('ready_check', (data) => {
                /**
                 data = {
                    matchId: (String),
                    opponent: {
                        nickname: (String),
                        rating: (Integer)
                    }
                 }
                 */
                port.postMessage({
                    attention: true,
                    focus: true
                });
                this.opponent.nickname = data.opponent.nickname;
                this.opponent.rating = data.opponent.rating;
                log(`socket :: ready_check :: ${JSON.stringify(data)}`);
                document.querySelector('.loading_text').textContent = `${chrome.i18n.getMessage("syncing_with")}${data.opponent.nickname}(${data.opponent.rating})`
                this.changeScreen(SCREEN.READY_CHECK);
            });

            this.socket.on('ready_opponent', (data) => {
                /* data = { gameid: (String), nickname: (String) } */
                log(`socket :: ready_opponent :: ${JSON.stringify(data)}`);
                this.setHint({
                    msg: `${chrome.i18n.getMessage("opponent")} ${chrome.i18n.getMessage("opponent_is_ready")}`,
                    type: 'success'
                })
            });

            this.socket.on('ready', (data) => {
                /* data = { id:(Integer), nickname: (String), rating: (Integer) } */
                log(`socket :: ready :: ${JSON.stringify(data)}`);
                if (this.prevMatch === 5)
                    this.destroyMatch(true);
                this.createMatch(data);
                game.changeScreen(SCREEN.INGAME);
            });

            this.socket.on('ready_countdown', (data) => {
                /* data = { id:(Integer), nickname: (String), rating: (Integer), matchType: ('rmm'|'pmm'), avatar: (1-21), your_avatar: (1-21) } */
                log(`socket :: ready_countdown :: ${JSON.stringify(data)}`);
                port.postMessage({
                    attention: true,
                    focus: true
                });
                this.opponent.nickname = data.nickname;
                this.opponent.rating = data.rating;
                this.opponent.id = data.id;
                this.avatar = data.your_avatar;
                this.readyCountdownCounter = 3;
                this.changeScreen(SCREEN.READY_COUNTDOWN_RMM);
                document.querySelector('#rcw_player1 .rcw_nickname p').textContent = `${this.nickname}`;
                document.querySelector('#rcw_player1 .rcw_rating p').textContent = `${this.rating}`;
                document.querySelector('#rcw_player1 .rcw_avatar img').src = `files/images/avatars/${this.storage['night_mode_on'] == '1' ? 'dark' : 'normal'}/a-24-px-lvl-${this.avatar}.svg`;
                document.querySelector('#rcw_player2 .rcw_nickname p').textContent = `${data.nickname}`;
                document.querySelector('#rcw_player2 .rcw_rating p').textContent = `${data.rating}`;
                document.querySelector('#rcw_player2 .rcw_avatar img').src = `files/images/avatars/${this.storage['night_mode_on'] == '1' ? 'dark' : 'normal'}/a-24-px-lvl-${data.avatar}.svg`;
                if (this.prevMatch === 5)
                    this.destroyMatch(true);
                this.initMatch({
                    id: this.opponent.id,
                    nickname: this.opponent.nickname,
                    rating: this.opponent.rating
                });
                if (data.matchType === 'pmm') {
                    if (this.pmm_counter.oid != data.id) {
                        this.pmm_counter.oid = data.id;
                        this.pmm_counter.you = 0;
                        this.pmm_counter.enemy = 0;
                    }
                } else {
                    this.pmm_counter.oid = 0;
                    this.pmm_counter.you = 0;
                    this.pmm_counter.enemy = 0;
                }
                this.readyCountdownTimer = setInterval(() => {
                    if (this.readyCountdownCounter <= 0) {
                        clearInterval(this.readyCountdownTimer);
                        this.readyCountdownCounter = 3;
                        document.querySelector('#rcw_countdown').textContent = '';
                        document.querySelector('.container').className = 'container';
                        document.querySelector('.game_time').textContent = '';
                        this.runMatch();
                        this.changeScreen(SCREEN.INGAME);
                    } else {
                        document.querySelector('#rcw_countdown').textContent = `${this.readyCountdownCounter}`;
                        this.readyCountdownCounter--;
                    }
                }, 1 * 1000);
            });

            this.socket.on('ready_success', () => {
                log(`socket :: ready_success`);
                this.ready = true;
                game.changeScreen(SCREEN.READY);
            })

            this.socket.on('opponentscore', (data) => {
                /* data = { score: (Integer) } */
                log(`socket :: opponentscore :: ${JSON.stringify(data)}`);
                if (this.match) {
                    this.opponent.score = data.score;
                    this.match.opponentScore = this.opponent.score;
                    this.match.actuator.updateOpponentScore(this.opponent.score);
                }
            });
            this.socket.on('exit', (data) => {
                /* data = {reason: (text), dRating: (Integer)} */
                log(`socket :: exit :: ${JSON.stringify(data)}`);
                let win;
                // UPDATED: for ready countdown
                clearInterval(this.readyCountdownTimer);
                this.readyCountdownCounter = 3;
                document.querySelector('#rcw_countdown').textContent = '';
                this.prevRating = game.rating;
                this.drating = data.drating;
                if (data.reason === 'notready') {
                    this.changeScreen(this.screenPool.pop());
                } else {
                    let reason;
                    if (data.reason === 'disconnect') {
                        win = true;
                        reason = 'disconnected';
                    } else if (data.reason.match(/:(nomoves)$/gi)) {
                        win = '__you__' !== data.reason.replace(':nomoves', '');
                        reason = 'nomoves';
                    } else if (data.reason.match(/:(timerout)$/gi)) {
                        win = '__you__' !== data.reason.replace(':timerout', '');
                        reason = 'timeout';
                    } else if (data.reason.match(/:(surrender)$/gi)) {
                        win = '__you__' !== data.reason.replace(':surrender', '');
                        reason = 'surrender';
                    } else if (data.reason.match(/:(cheated)$/gi)) {
                        win = '__you__' !== data.reason.replace(':cheated', '');
                        reason = 'cheated';
                    } else if (data.reason.match(/:(afk)$/gi)) {
                        win = '__you__' !== data.reason.replace(':afk', '');
                        reason = 'afk';
                    }
                    if (win) {
                        document.querySelector('.endgame_opponent_reason').textContent = chrome.i18n.getMessage(`reason_${reason}`);
                        document.querySelector('.endgame_your_reason').textContent = ``;
                    } else {
                        document.querySelector('.endgame_your_reason').textContent = chrome.i18n.getMessage(`reason_${reason}`);
                        document.querySelector('.endgame_opponent_reason').textContent = ``;
                    }
                    document.querySelector('.endgame_pts').textContent = `${game.rating} (${data.drating > 0 ? '+' + data.drating : data.drating}) ${chrome.i18n.getMessage('label_pts')}`;
                    this.match.actuator.message(win);
                    this.shareDialog.win = win;
                    let newRating = game.rating + data.drating;
                    let oldRating = game.rating;
                    let oldLeague = (oldRating < 200 ? 'newbie' : (oldRating < 600 ? 'bronze' : (oldRating < 1000 ? 'silver' : 'gold')));
                    let newLeague = (newRating < 200 ? 'newbie' : (newRating < 600 ? 'bronze' : (newRating < 1000 ? 'silver' : 'gold')));
                    let league_up = false;
                    if (oldLeague !== newLeague && newLeague !== 'newbie') {
                        if (newRating > oldRating) {
                            league_up = true;
                        } else {
                            league_up = false;
                        }
                        this.shareDialog.league = newLeague;
                        this.shareDialog.leagueUp = league_up;
                        this.changeScreen(SCREEN.LEAGUEUPDATE, {
                            league_up: league_up,
                            league: newLeague
                        });
                    }
                }
                /*
                switch (data.reason) {
                    case 'notready':
                        this.changeScreen(this.screenPool.pop());
                        break; // notready
                    case 'disconnect':
                        document.querySelector('.endgame_opponent_reason').textContent = chrome.i18n.getMessage('reason_disconnected');
                        document.querySelector('.endgame_your_reason').textContent = ``;
                        document.querySelector('.endgame_pts').textContent = `${game.rating} (${data.drating > 0? '+' + data.drating: data.drating}) ${chrome.i18n.getMessage('label_pts')}`;
                        this.match.actuator.message(true);
                        this.shareDialog.win = true;
                        let newRating = game.rating + data.drating;
                        let oldRating = game.rating;
                        let oldLeague = (oldRating < 200 ? 'newbie' : (oldRating < 600 ? 'bronze' : (oldRating < 1000 ? 'silver' : 'gold')));
                        let newLeague = (newRating < 200 ? 'newbie' : (newRating < 600 ? 'bronze' : (newRating < 1000 ? 'silver' : 'gold')));
                        let league_up = false;
                        if (oldLeague !== newLeague && newLeague !== 'newbie') {
                            if (newRating > oldRating) {
                                league_up = true;
                            } else {
                                league_up = false;
                            }
                            this.shareDialog.league = newLeague;
                            this.shareDialog.leagueUp = league_up;
                            this.changeScreen(SCREEN.LEAGUEUPDATE, {
                                league_up: league_up,
                                league: newLeague
                            });
                        }
                        break; // disconnect
                    default:
                        // uuid:nomoves || uuid:timerout
                        if (data.reason.match(/:(nomoves)$/gi)) {
                            win = '__you__' !== data.reason.replace(':nomoves', '');
                            if (win) {
                                document.querySelector('.endgame_opponent_reason').textContent = chrome.i18n.getMessage('reason_nomoves');
                                document.querySelector('.endgame_your_reason').textContent = ``;
                            } else {
                                document.querySelector('.endgame_your_reason').textContent = chrome.i18n.getMessage('reason_nomoves');
                                document.querySelector('.endgame_opponent_reason').textContent = ``;
                            }
                            document.querySelector('.endgame_pts').textContent = `${game.rating} (${data.drating > 0? '+' + data.drating: data.drating}) ${chrome.i18n.getMessage('label_pts')}`;
                            this.match.actuator.message(win);
                            this.shareDialog.win = win;
                            let newRating = game.rating + data.drating;
                            let oldRating = game.rating;
                            let oldLeague = (oldRating < 200 ? 'newbie' : (oldRating < 600 ? 'bronze' : (oldRating < 1000 ? 'silver' : 'gold')));
                            let newLeague = (newRating < 200 ? 'newbie' : (newRating < 600 ? 'bronze' : (newRating < 1000 ? 'silver' : 'gold')));
                            let league_up = false;
                            if (oldLeague !== newLeague && newLeague !== 'newbie') {
                                if (newRating > oldRating) {
                                    league_up = true;
                                } else {
                                    league_up = false;
                                }
                                this.shareDialog.league = newLeague;
                                this.shareDialog.leagueUp = league_up;
                                this.changeScreen(SCREEN.LEAGUEUPDATE, {
                                    league_up: league_up,
                                    league: newLeague
                                });
                            }
                        } else if (data.reason.match(/:(timerout)$/gi)) {
                            win = '__you__' !== data.reason.replace(':timerout', '');
                            if (win) {
                                document.querySelector('.endgame_opponent_reason').textContent = chrome.i18n.getMessage('reason_timeout');
                                document.querySelector('.endgame_your_reason').textContent = ``;
                            } else {
                                document.querySelector('.endgame_your_reason').textContent = chrome.i18n.getMessage('reason_timeout');
                                document.querySelector('.endgame_opponent_reason').textContent = ``;
                            }
                            document.querySelector('.endgame_pts').textContent = `${game.rating} (${data.drating > 0? '+' + data.drating: data.drating}) ${chrome.i18n.getMessage('label_pts')}`;
                            this.match.actuator.message(win);
                            this.shareDialog.win = win;
                            let newRating = game.rating + data.drating;
                            let oldRating = game.rating;
                            let oldLeague = (oldRating < 200 ? 'newbie' : (oldRating < 600 ? 'bronze' : (oldRating < 1000 ? 'silver' : 'gold')));
                            let newLeague = (newRating < 200 ? 'newbie' : (newRating < 600 ? 'bronze' : (newRating < 1000 ? 'silver' : 'gold')));
                            let league_up = false;
                            if (oldLeague !== newLeague && newLeague !== 'newbie') {
                                if (newRating > oldRating) {
                                    league_up = true;
                                } else {
                                    league_up = false;
                                }
                                this.shareDialog.league = newLeague;
                                this.shareDialog.leagueUp = league_up;
                                this.changeScreen(SCREEN.LEAGUEUPDATE, {
                                    league_up: league_up,
                                    league: newLeague
                                });
                            }
                        } else if (data.reason.match(/:(cheated)$/gi)) {
                            win = '__you__' !== data.reason.replace(':cheated', '');
                            if (win) {
                                document.querySelector('.endgame_opponent_reason').textContent = chrome.i18n.getMessage('reason_cheated');
                                document.querySelector('.endgame_your_reason').textContent = ``;
                            } else {
                                document.querySelector('.endgame_your_reason').textContent = chrome.i18n.getMessage('reason_cheated');
                                document.querySelector('.endgame_opponent_reason').textContent = ``;
                            }
                            document.querySelector('.endgame_pts').textContent = `${game.rating} (${data.drating > 0? '+' + data.drating: data.drating}) ${chrome.i18n.getMessage('label_pts')}`;
                            this.match.actuator.message(win);
                            this.shareDialog.win = win;
                            let newRating = game.rating + data.drating;
                            let oldRating = game.rating;
                            let oldLeague = (oldRating < 200 ? 'newbie' : (oldRating < 600 ? 'bronze' : (oldRating < 1000 ? 'silver' : 'gold')));
                            let newLeague = (newRating < 200 ? 'newbie' : (newRating < 600 ? 'bronze' : (newRating < 1000 ? 'silver' : 'gold')));
                            let league_up = false;
                            if (oldLeague !== newLeague && newLeague !== 'newbie') {
                                if (newRating > oldRating) {
                                    league_up = true;
                                } else {
                                    league_up = false;
                                }
                                this.shareDialog.league = newLeague;
                                this.shareDialog.leagueUp = league_up;
                                this.changeScreen(SCREEN.LEAGUEUPDATE, {
                                    league_up: league_up,
                                    league: newLeague
                                });
                            }
                        } else if (data.reason.match(/:(afk)$/gi)) {
                            win = '__you__' !== data.reason.replace(':afk', '');
                            if (win) {
                                document.querySelector('.endgame_opponent_reason').textContent = chrome.i18n.getMessage('reason_afk');
                                document.querySelector('.endgame_your_reason').textContent = ``;
                            } else {
                                document.querySelector('.endgame_your_reason').textContent = chrome.i18n.getMessage('reason_afk');
                                document.querySelector('.endgame_opponent_reason').textContent = ``;
                            }
                            document.querySelector('.endgame_pts').textContent = `${game.rating} (${data.drating > 0? '+' + data.drating: data.drating}) ${chrome.i18n.getMessage('label_pts')}`;
                            this.match.actuator.message(win);
                            this.shareDialog.win = win;
                            let newRating = game.rating + data.drating;
                            let oldRating = game.rating;
                            let oldLeague = (oldRating < 200 ? 'newbie' : (oldRating < 600 ? 'bronze' : (oldRating < 1000 ? 'silver' : 'gold')));
                            let newLeague = (newRating < 200 ? 'newbie' : (newRating < 600 ? 'bronze' : (newRating < 1000 ? 'silver' : 'gold')));
                            let league_up = false;
                            if (oldLeague !== newLeague && newLeague !== 'newbie') {
                                if (newRating > oldRating) {
                                    league_up = true;
                                } else {
                                    league_up = false;
                                }
                                this.shareDialog.league = newLeague;
                                this.shareDialog.leagueUp = league_up;
                                this.changeScreen(SCREEN.LEAGUEUPDATE, {
                                    league_up: league_up,
                                    league: newLeague
                                });
                            }
                        }  else if (data.reason.match(/:(surrender)$/gi)) {
                            win = '__you__' !== data.reason.replace(':surrender', '');
                            if (win) {
                                document.querySelector('.endgame_opponent_reason').textContent = chrome.i18n.getMessage('reason_surrender');
                                document.querySelector('.endgame_your_reason').textContent = ``;
                            } else {
                                document.querySelector('.endgame_your_reason').textContent = chrome.i18n.getMessage('reason_surrender');
                                document.querySelector('.endgame_opponent_reason').textContent = ``;
                            }
                            document.querySelector('.endgame_pts').textContent = `${game.rating} (${data.drating > 0? '+' + data.drating: data.drating}) ${chrome.i18n.getMessage('label_pts')}`;
                            this.match.actuator.message(win);
                            this.shareDialog.win = win;
                            let newRating = game.rating + data.drating;
                            let oldRating = game.rating;
                            let oldLeague = (oldRating < 200 ? 'newbie' : (oldRating < 600 ? 'bronze' : (oldRating < 1000 ? 'silver' : 'gold')));
                            let newLeague = (newRating < 200 ? 'newbie' : (newRating < 600 ? 'bronze' : (newRating < 1000 ? 'silver' : 'gold')));
                            let league_up = false;
                            if (oldLeague !== newLeague && newLeague !== 'newbie') {
                                if (newRating > oldRating) {
                                    league_up = true;
                                } else {
                                    league_up = false;
                                }
                                this.shareDialog.league = newLeague;
                                this.shareDialog.leagueUp = league_up;
                                this.changeScreen(SCREEN.LEAGUEUPDATE, {
                                    league_up: league_up,
                                    league: newLeague
                                });
                            }
                        }
                        break;
                }*/
                this.rating += data.drating;
                this.updateUserInfo();
                this.destroyMatch();
            });

            this.socket.on('timer', (data) => {
                /* data = { duration: (Integer), status: ('run'|'ping'|'none')} */
                log(`socket :: timer :: ${JSON.stringify(data)}`);
                switch (data.status) {
                    case 'run':
                        log(`Timer End of Game: ${data.duration} sec`);
                        document.querySelector('.container').className = 'container penalty';
                        this.setHint({
                            msg: chrome.i18n.getMessage('tlog_you_are_behind'),
                            type: 'penalty'
                        });
                        this.timeout_limit = data.duration;
                        this.timeout_counter = 0;
                        document.querySelector('.timer-container p').textContent = `${~~((this.timeout_limit - this.timeout_counter) / 60)}:${((this.timeout_limit - this.timeout_counter) % 60) < 10 ? '0' + (((this.timeout_limit - this.timeout_counter) % 60)) : ((this.timeout_limit - this.timeout_counter) % 60)}`;
                        this.timeout_timer && clearInterval(this.timeout_timer);
                        this.timeout_timer = setInterval(() => {
                            if (this.timeout_counter === (~~(this.timeout_limit / 2))) {
                                document.querySelector('.container').className = 'container penalty_danger';
                                this.setHint({
                                    msg: chrome.i18n.getMessage('tlog_you_are_behind'),
                                    type: 'penalty_danger'
                                });
                            }
                            document.querySelector('.timer-container p').textContent = `${~~((this.timeout_limit - this.timeout_counter) / 60)}:${((this.timeout_limit - this.timeout_counter) % 60) < 10 ? '0' + (((this.timeout_limit - this.timeout_counter) % 60)) : ((this.timeout_limit - this.timeout_counter) % 60)}`;
                            log(`timer: ${this.timeout_counter}/${this.timeout_limit}`);
                            this.timeout_counter++;
                            if (this.timeout_limit && this.timeout_counter > this.timeout_limit) {
                                clearInterval(this.timeout_timer);
                                this.socket.emit(`timerout`);
                            }
                        }, 1000);
                        break;
                    case 'ping':
                        log(`Timer End of Game for your opponent: ${data.duration} sec`);
                        document.querySelector('.container').className = 'container advantage';
                        this.setHint({
                            msg: chrome.i18n.getMessage('tlog_you_are_ahead'),
                            type: 'advantage'
                        });
                        this.timeout_limit = data.duration;
                        this.timeout_counter = 0;
                        document.querySelector('.timer-container p').textContent = `${~~((this.timeout_limit - this.timeout_counter) / 60)}:${((this.timeout_limit - this.timeout_counter) % 60) < 10 ? '0' + (((this.timeout_limit - this.timeout_counter) % 60)) : ((this.timeout_limit - this.timeout_counter) % 60)}`;
                        this.timeout_timer && clearInterval(this.timeout_timer);
                        this.timeout_timer = setInterval(() => {
                            document.querySelector('.timer-container p').textContent = `${~~((this.timeout_limit - this.timeout_counter) / 60)}:${((this.timeout_limit - this.timeout_counter) % 60) < 10 ? '0' + (((this.timeout_limit - this.timeout_counter) % 60)) : ((this.timeout_limit - this.timeout_counter) % 60)}`;
                            log(`timer: ${this.timeout_counter}/${this.timeout_limit}`);
                            this.timeout_counter++;
                            if (this.timeout_counter > this.timeout_limit) {
                                clearInterval(this.timeout_timer);
                                this.socket.emit(`timerout`);
                            }
                        }, 1000);
                        break;
                    case 'stop':
                        log(`Timer End of Game Off`);
                        document.querySelector('.container').className = 'container';
                        this.setHint({
                            msg: chrome.i18n.getMessage('tlog_get_more_points'),
                            type: 'normal'
                        });
                        clearInterval(this.timeout_timer);
                        this.timeout_timer = null;
                        this.timeout_counter = 0;
                        this.timeout_limit = 0;
                        break;
                }
            });

            //deprecated
            this.socket.on('ladder', (data) => {
                /* data = {
                        type: ('top100' | 'bronze' | 'silver' | 'gold'),
                        table: [{
                            position: <your_position>, nickname: <your_nickname>, rating: <your_rating>
                        }, {
                            position: (Integer), nickname: (String), rating: (Integer)
                        }, ...]
                    }
                */
                /*
                 log(`socket :: ladder :: ${JSON.stringify(data)}`);
                 switch (data.type) {
                     case 'top100':
                         document.querySelector('.ladders-view').className = 'ladders-view top100';
                         document.querySelector('.tab.tab-top100').className = "tab tab-top100 active";
                         document.querySelector('.tab.tab-bronze').className = "tab tab-bronze";
                         document.querySelector('.tab.tab-silver').className = "tab tab-silver";
                         document.querySelector('.tab.tab-gold').className = "tab tab-gold";
                         break;
                     case 'bronze':
                         document.querySelector('.ladders-view').className = 'ladders-view bronze';
                         document.querySelector('.tab.tab-top100').className = "tab tab-top100";
                         document.querySelector('.tab.tab-bronze').className = "tab tab-bronze active";
                         document.querySelector('.tab.tab-silver').className = "tab tab-silver";
                         document.querySelector('.tab.tab-gold').className = "tab tab-gold";
                         break;
                     case 'silver':
                         document.querySelector('.ladders-view').className = 'ladders-view silver';
                         document.querySelector('.tab.tab-top100').className = "tab tab-top100";
                         document.querySelector('.tab.tab-bronze').className = "tab tab-bronze";
                         document.querySelector('.tab.tab-silver').className = "tab tab-silver active";
                         document.querySelector('.tab.tab-gold').className = "tab tab-gold";
                         break;
                     case 'gold':
                         document.querySelector('.ladders-view').className = 'ladders-view gold';
                         document.querySelector('.tab.tab-top100').className = "tab tab-top100";
                         document.querySelector('.tab.tab-bronze').className = "tab tab-bronze";
                         document.querySelector('.tab.tab-silver').className = "tab tab-silver";
                         document.querySelector('.tab.tab-gold').className = "tab tab-gold active";
                         break;
                 }
                 let gridNode = document.querySelector('.ladders-grid');
                 while (gridNode.firstChild) {
                     gridNode.removeChild(gridNode.firstChild);
                 }
                 for (let i = 1; i < data.table.length; i++) {
                     let divLadderTableRow = document.createElement('div');
                     divLadderTableRow.className = `ladders-row${data.table[0].position === data.table[i].position ? ' self' : ''}`;
                     divLadderTableRow.setAttribute('data-profile', data.table[i].id);
                     // IMPORTANT: used function () {} instead of () => {} cause of `this` must be DOMElement
                     divLadderTableRow.addEventListener('click', function (e){
                         game.showProfile(parseInt(this.dataset.profile));
                     });
                     let divPosition = document.createElement('div');
                     divPosition.className = 'ladders-col-1';
                     divPosition.textContent = data.table[i].position;
                     divLadderTableRow.appendChild(divPosition);
                     let divNickname = document.createElement('div');
                     divNickname.className = 'ladders-col-2';
                     divNickname.textContent = data.table[i].nickname;
                     divLadderTableRow.appendChild(divNickname);
                     let divRating = document.createElement('div');
                     divRating.className = 'ladders-col-3';
                     divRating.textContent = data.table[i].rating;
                     divLadderTableRow.appendChild(divRating);
                     gridNode.appendChild(divLadderTableRow);
                 }
                 this.rating = data.table[0].rating;
                 let li = (this.rating < 200 ? 'newbie' : (this.rating < 600 ? 'bronze' : (this.rating < 1000 ? 'silver' : 'gold')));
                 switch (li) {
                     case 'bronze':
                         this.setHint({
                             msg: chrome.i18n.getMessage('ladders_in'),
                             type: 'extended',
                             config: [{
                                 node: 'span',
                                 styleClass: 'sbronze',
                                 text: `#${this.position}`
                             }, {
                                 node: 'span',
                                 styleClass: '',
                                 text: chrome.i18n.getMessage('ladders_in_with', [this.rating])
                             }]
                         });
                         break;
                     case 'silver':
                         this.setHint({
                             msg: chrome.i18n.getMessage('ladders_in'),
                             type: 'extended',
                             config: [{
                                 node: 'span',
                                 styleClass: 'ssilver',
                                 text: `#${this.position}`
                             }, {
                                 node: 'span',
                                 styleClass: '',
                                 text: chrome.i18n.getMessage('ladders_in_with', [this.rating])
                             }]
                         });
                         break;
                     case 'gold':
                         this.setHint({
                             msg: chrome.i18n.getMessage('ladders_in'),
                             type: 'extended',
                             config: [{
                                 node: 'span',
                                 styleClass: 'sgold',
                                 text: `#${this.position}`
                             }, {
                                 node: 'span',
                                 styleClass: '',
                                 text: chrome.i18n.getMessage('ladders_in_with', [this.rating])
                             }]
                         });
                         break;
                     case 'newbie':
                     default:
                         break;
                 }*/
            });

            this.socket.on('auth_success', (data) => {
                /* data = { nickname: (String), rating: (Integer), id: (Integer), avatar: (1-21)} */
                log(`socket :: auth_success :: ${JSON.stringify(data)}`);
                if (this.storage['new_nickname']) {
                    game.socket.emit('nickname', {
                        nickname: this.storage['new_nickname']
                    });
                    this.nickname = this.storage['new_nickname'];
                } else {
                    this.nickname = data.nickname;
                }
                this.rating = data.rating;
                this.avatar = data.avatar;
                this.id = data.id;
                delete this.storage['on_reload_settings_socket'];
                if (callback) {
                    callback();
                } else {
                    this.changeScreen(SCREEN.MENU_LOGGED);
                    if (settings['elSelectorClick']) {
                        try {
                            document.querySelector(settings['elSelectorClick']).dispatchEvent(new Event('click'));
                        } catch (e) { }
                    }
                }
            });

            this.socket.on('auth_fail', (data) => {
                /* data = { reason: (String) } */
                log(`socket :: auth_fail :: ${JSON.stringify(data)}`);
                this.hideMatchMakingPopup();
                Auth.logout().then(() => {
                    document.location.reload();
                });
            });

            this.socket.on('nickname_success', () => {
                log(`socket :: nickname_success`);
                cancelEditMode();
                game.nickname = game.storage['new_nickname'];
                delete this.storage['new_nickname'];
            });

            this.socket.on('nickname_fail', (data) => {
                /* data = { reason: (String) } */
                log(`socket :: nickname_fail :: ${JSON.stringify(data)}`);
                try {
                    const code = parseInt(data.reason.match('(.*)::')[1]);
                    showOrHideTip(true, document.querySelector('#nickname').nextElementSibling, code);
                    delete this.storage['new_nickname'];
                } catch (e) { }
            });

            this.socket.on('rmm_continue', (data) => {
                /* data = { timeout: (Integer) } */
                log(`socket :: rmm_continue :: ${JSON.stringify(data)}`);
                if (!this.rmmTimer) {
                    this.rmmTimer = setTimeout(() => {
                        this.socket.emit('rmm');
                        this.rmmTimer = null;
                    }, data.timeout);
                }
            });

            this.socket.on('rmm_pause', () => {
                log(`socket :: rmm_pause}`);
                this.rmmTimer && clearTimeout(this.rmmTimer);
                this.rmmTimer = null;
            });

            this.socket.on('search_cancel_success', () => {
                log(`socket :: search_cancel_success`);
                this.hideMatchMakingPopup();
                this.rmmTimer && clearTimeout(this.rmmTimer);
                this.rmmTimer = null;
                this.changeScreen(this.screenPool.pop());
            });

            this.socket.on('rmm_fail', (data) => {
                /* data = { reason: (String) } */
                log(`socket :: rmm_fail :: ${JSON.stringify(data)}`);
                this.hideMatchMakingPopup();
                this.rmmTimer && clearTimeout(this.rmmTimer);
                this.rmmTimer = null;
                document.querySelector('.loading_text').textContent = chrome.i18n.getMessage('matchmaking_failed');
                this.setHint({
                    msg: chrome.i18n.getMessage(data.reason),
                    type: 'error'
                });
            });

            this.socket.on('pmm_host_success', (data) => {
                /* data = { matchName: (String) } */
                log(`socket :: pmm_host_success :: ${JSON.stringify(data)}`);
                this.hideMatchMakingPopup();
                game.changeScreen(SCREEN.PMM_HOST_WAIT, {
                    lobby: {
                        name: data.matchName
                    }
                });
                document.querySelector('.loading_text').textContent = chrome.i18n.getMessage('please_wait');
            });

            this.socket.on('pmm_host_fail', (data) => {
                /* data = { reason: (String) } */
                log(`socket :: pmm_host_fail :: ${JSON.stringify(data)}`);
                this.hideMatchMakingPopup();
                this.setHint({
                    msg: chrome.i18n.getMessage(data.reason),
                    type: 'error'
                });
            });

            this.socket.on('pmm_join_fail', (data) => {
                /* data = { reason: (String) } */
                this.hideMatchMakingPopup();
                this.pmm_attempts++;
                if (this.pmm_attempts >= this.pmm_attempts_max) {
                    log(`socket :: pmm_join_fail :: ${JSON.stringify(data)}`);
                    this.screenPool.pop();
                    this.changeScreen(SCREEN.PMM_JOIN);
                    this.setHint({
                        msg: chrome.i18n.getMessage(data.reason),
                        type: 'error'
                    });
                } else {
                    this.pmm_attempts_timer = setTimeout(() => {
                        if (document.querySelector('#jlobby_name').value) {
                            this.socket.emit('pmm_join', document.querySelector('#jlobby_name').value);
                            this.changeScreen(SCREEN.PMM_JOIN_LOBBY, {
                                lobby: {
                                    name: document.querySelector('#jlobby_name').value
                                }
                            })
                            document.querySelector('.loading_text').textContent = chrome.i18n.getMessage('please_wait');
                        }
                    }, this.pmm_attempts_interval);
                }
            });

            this.socket.on('account_info', (data) => {
                /* data = {
                    id: (INTEGER),
                    position: (TINYINT),
                    nickname: (String),
                    rating: (SMALLINT SIGNED),
                    avatar: (String),
                    wins: (INTEGER),
                    loses: (INTEGER),
                    winrate: (INTEGER),
                    avg_apm: (INTEGER),
                    avg_duration: (INTEGER),
                    matches: (INTEGER),
                    history: [{ 
                        matchId: (INTEGER), 
                        type: (TINYINT), 
                        duration: (INTEGER), 
                        created_at: (TIMESTAMP), 
                        ended_at: (TIMESTAMP),
                        player: {
                            id: (INTEGER),
                            nickname: (String),
                            score: (INTEGER),
                            reason: (String),
                            drating: (SMALLINT SIGNED),
                            position: (TINYINT)
                        },
                        opponents: [{
                            id: (INTEGER),
                            nickname: (String),
                            score: (INTEGER),
                            reason: (String),
                            drating: (SMALLINT SIGNED),
                            position: (TINYINT)
                        }, ...]
                    }]
                } */
                log(`socket :: account_info :: ${JSON.stringify(data)}`);
                this.displayProfile(data);
            });
            this.socket.on('account_position', (data) => {
                /* data = { position: (Integer) } */
                log(`socket :: account_position :: ${JSON.stringify(data)}`);
                this.position = data.position;
            });

            this.socket.on('smiles_list', (data) => {
                /* data = {
                            product_id: (String),
                            id: (String),
                            src: (Base64 String),
                            blocked: (Boolean)
                        } */
                log(`socket :: smiles_list :: ${JSON.stringify(data)}`);
                let handled_data = {};
                for (let i = 0; i < data.length; i++) {
                    handled_data[data[i].id] = data[i];
                }
                this.smiles = handled_data;
                let smiles_parent = document.getElementById('smiles');
                smiles_parent.textContent = '';
                for (var id in game.smiles) {
                    let img = document.createElement('img');
                    img.className = 'smile';
                    game.smiles[id].blocked && img.classList.add('blocked');
                    img.setAttribute('smile_id', id);
                    img.setAttribute('src', game.smiles[id].src);
                    smiles_parent.appendChild(img);
                }
            });
            this.socket.on('smile', (data) => {
                /* data = { smile: (smile object) } */
                log(`socket :: smile :: ${JSON.stringify(data)}`);

                //if (this.match) {
                this.showSmile(data.id, true);
                //}
            });

            //deprecated
            this.socket.on('products_list', (data) => {
                return;

                /* data = [{ id: (String), type: (String), title: (JSON), description: (JSON), price: (DECIMAL(10,2)), currency: (String), value: (DECIMAL(10,2)), icon: (Base64 String), blocked: (Boolean) },...]*/
                let handled_data = {};
                for (let i = 0, len = data.length; i < len; i++) {
                    handled_data[data[i].id] = data[i];
                }
                this.products = handled_data;
                this.displayShop();
                port.postMessage({
                    attention: true,
                    focus: true
                });
            });

            this.socket.on('buy_redirect', (data) => {
                // data = { product_id: (String), currency: ("USD"|etc.)}
                chrome.tabs.create({ url: this.serverUrl + '/store/buy?id=' + data.product_id + '&currency=' + data.currency, active: true });
            })

            this.socket.on('buy_error', (data) => {
                /* data = { product_id: (String), msg: (String) }*/
                log(`socket :: buy_error :: ${JSON.stringify(data)}`);
            });

            this.socket.on('buy_already', (data) => {
                /* data = { product_id: (String) }*/
                log(`socket :: buy_already :: ${JSON.stringify(data)}`);
                this.socket.emit('shop_products');
            });

            this.socket.on('buy_success', (data) => {
                /* data = { product_id: (String) }*/
                log(`socket :: buy_success :: ${JSON.stringify(data)}`);
                this.socket.emit('shop_products');
            });

            //deprecated
            this.socket.on('themes_list', (data) => {
                /* data = [{
                    product_id: (String),
                    blocked: (Boolean)
                },...] */
                /*this.hasNightMode = !data[0].blocked;
                if (!this.hasNightMode) {
                    delete this.storage['night_mode_css'];
                    delete this.storage['night_mode_on'];
                    this.setNightMode(false);
                }*/
            });
            //deprecated
            this.socket.on('themes_css', (data) => {
                /* data = [{
                   product_id: (String),
                   css: (String),
                   blocked: (Boolean)
               },...] */
                /*log(`socket :: themes_css :: ${JSON.stringify(data)}`);
                if (data.length > 0) {
                    this.storage['night_mode_css'] = data[0].css;
                    if (this.storage['night_mode_on'] === undefined || this.storage['night_mode_on'] === '1') {
                        this.setNightMode(!!data[0].css);
                    }
                }*/
            });

            this.socket.on('brmm_searching', () => {
                log(`BRMM brmm_searching event`);
                this.changeScreen(SCREEN.BR_SEARCH);
            });

            this.socket.on('brmm_search_update', (data) => {
                log(`BRMM brmm_search_update event data = ${JSON.stringify(data)}`);
                document.querySelector('.brs_info_counter').textContent = `${data.current} / ${data.maximum}`;
                this.mmpHintDOM.textContent = `${chrome.i18n.getMessage("mmpopup_hint_battleroyal")}${data.current}/${data.maximum}`;
            });

            this.socket.on('brmm_cancel_success', () => {
                log(`BRMM brmm_cancel_success event`);
                this.hideMatchMakingPopup();
                if (this.curretMM === 0) {
                    this.changeScreen(this.screenPool.pop());
                }
            });

            this.socket.on('brmm_ready', (data) => {
                log(`BRMM brmm_ready event data = ${JSON.stringify(data)}`);
                this.hideMatchMakingPopup();
                if (this.prevMatch === 5)
                    this.destroyMatch(true);
                this.changeScreen(SCREEN.READY_COUNTDOWN_BR);
                port.postMessage({
                    attention: true,
                    focus: true
                });
                clearInterval(this.brmm_countdown_ready);
                this.brmm_countdown_ready_counter = 5;
                for (let i = 0; i < 10; i++) {
                    document.querySelector(`.brsplt_${i + 1} .brsplt-avatar`).src = '';
                    document.querySelector(`.brsplt_${i + 1} .brplt_nickname`).textContent = '';
                }
                for (let i = 0; i < data.players.length; i++) {
                    document.querySelector(`.brsplt_${i + 1} .brsplt-avatar`).src = `files/images/avatars/${this.storage['night_mode_on'] == '1' ? 'dark' : 'normal'}/a-24-px-lvl-${data.players[i].avatar}.svg`;
                    document.querySelector(`.brsplt_${i + 1} .brplt_nickname`).textContent = data.players[i].nickname;
                }
                document.querySelector('.brs_ready_counter').textContent = `${this.brmm_countdown_ready_counter}`;
                this.brmm_countdown_ready = setInterval(() => {
                    if (this.brmm_countdown_ready_counter > 0) {
                        this.brmm_countdown_ready_counter--;
                        document.querySelector('.brs_ready_counter').textContent = `${this.brmm_countdown_ready_counter}`;
                    } else {
                        clearInterval(this.brmm_countdown_ready);
                        this.brmm_countdown_ready = null;
                        this.brmm_countdown_ready_counter = 5;
                    }
                }, 1000)
            });

            this.socket.on('brmm_start', (data) => {
                log(`BRMM brmm_start event data = ${JSON.stringify(data)}`);
                document.querySelector(`.endgame_brm_rt .self`) && document.querySelector(`.endgame_brm_rt .self`).classList.toggle('self', false);
                for (let i = 0; i < 10; i++) {
                    document.querySelector(`.brp_${i + 1}`).className = `brp_${i + 1}`;
                    document.querySelector(`.brp_${i + 1}`).dataset.brpid = "";
                }
                document.querySelector(`.br_players`).className = `br_players`;
                clearInterval(this.brmm_countdown_ready);
                this.brmm_countdown_ready = null;
                this.brmm_countdown_ready_counter = 5;
                this.createBRMatch(data);
                this.changeScreen(SCREEN.BATTLEROYALE);
            });

            this.socket.on('brmm_timer_reset', (data) => {
                log(`BRMM brmm_timer_reset event data = ${JSON.stringify(data)}`);
                this.brmm_countdown_outsider_counter = 29;
                document.querySelector('.br_timer p').textContent = formatTime(this.brmm_countdown_outsider_counter);
                document.querySelector('.endgame_image_timer p').textContent = formatTime(this.brmm_countdown_outsider_counter);
                this.last_log = `${data.player} ${chrome.i18n.getMessage('is_out_due_to')} ` + chrome.i18n.getMessage(`reason_${data.reason}`);
                this.setHint({
                    msg: `${data.player} ${chrome.i18n.getMessage('is_out_due_to')} ` + chrome.i18n.getMessage(`reason_${data.reason}`),
                    type: 'outdue'
                });
                setTimeout(() => {
                    if (document.querySelector('.footer').className === 'footer outdue') {
                        this.setHint({
                            msg: `${data.player} ${chrome.i18n.getMessage('is_out_due_to')} ` + chrome.i18n.getMessage(`reason_${data.reason}`),
                            type: 'normal'
                        });
                    }
                }, 1000);
            });

            this.socket.on('brmm_update', (data) => {
                log(`BRMM brmm_update event data = ${JSON.stringify(data)}`);
                this.brmm_update_players(data);
            });

            this.socket.on('brmm_end', (data) => {
                log(`BRMM brmm_end event data = ${JSON.stringify(data)}`);
                this.brmm_update_players(data);
            });
        }

        initMatch(opponent) {
            /* opponent = { id:(Integer), nickname: (String), rating: (Integer) } */
            if (!this.match) {
                if (!(this.prevMatch == 2 || this.prevMatch == 4))
                    this.prevMatch = 1;
                this.match = new GameEngine(4, KeyboardInputControl, UIHTMLControl, LocalStorageControl);
                this.match.setup();
                this.match.opponentScore = 0;
                this.match.opponentName = this.opponent.nickname;
                this.match.name = this.nickname;
                this.match.actuate();
                this.shareDialog.reset();
                this.opponent.id = opponent.id;
                document.querySelector('.endgame_opponent_name').dataset.profile = opponent.id;
                document.querySelector('.above-game .opponent_name').dataset.profile = opponent.id;
                this.match_timer = null;
                this.match && (this.match.inputManager.keyDownEnabled = false);
            }
        }
        runMatch() {
            this.match && (this.match.inputManager.keyDownEnabled = true);
            if (!this.match_timer) {
                this.match_timer = setInterval(() => {
                    if (this.match) {
                        this.match_timer_counter++;
                        document.querySelector('.scores-container .game_time').textContent = formatTime(this.match_timer_counter);
                    }
                }, 1 * 1000);
            }
        }
        createMatch(opponent) {
            /* opponent = { id:(Integer), nickname: (String), rating: (Integer) } */
            if (!this.match) {
                if (!(this.prevMatch == 2 || this.prevMatch == 4))
                    this.prevMatch = 1;
                this.match = new GameEngine(4, KeyboardInputControl, UIHTMLControl, LocalStorageControl);
                this.match.setup();
                this.match.opponentScore = 0;
                this.match.opponentName = this.opponent.nickname;
                this.match.name = this.nickname;
                this.match.actuate();
                this.shareDialog.reset();
                this.opponent.id = opponent.id;
                document.querySelector('.endgame_opponent_name').dataset.profile = opponent.id;
                document.querySelector('.above-game .opponent_name').dataset.profile = opponent.id;
                this.match_timer = setInterval(() => {
                    if (this.match) {
                        this.match_timer_counter++;
                        document.querySelector('.scores-container .game_time').textContent = formatTime(this.match_timer_counter);
                    }
                }, 1 * 1000);
            }
        }
        createBRMatch(data) {
            /* opponent = { id:(Integer), nickname: (String), rating: (Integer) } */
            if (!this.match) {
                this.prevMatch = 3;
                this.last_log = ``;

                this.brmm_countdown_outsider_counter = 29;
                document.querySelector('.br_timer p').textContent = formatTime(this.brmm_countdown_outsider_counter);
                document.querySelector('.endgame_image_timer p').textContent = formatTime(this.brmm_countdown_outsider_counter);
                document.querySelector('.endgame_image').classList.toggle('hidden', true);
                document.querySelector('.endgame_image_timer').classList.toggle('hidden', false);
                this.match = new GameEngine(4, KeyboardInputControl, BattleRoyaleUIHTMLControl, LocalStorageControl);
                this.match.setup();
                this.match.actuator.finished = false;
                /*this.match.opponentScore = 0;
                this.match.opponentName = this.opponent.nickname;
                this.match.name = this.nickname;*/
                // Clear Results Table for Game Over screen
                for (let i = 1; i <= 10; i++) {
                    document.querySelector(`.ebrmrt-row-${i}`).dataset.profile = 0;
                    document.querySelector(`.ebrmrt-row-${i} .ebrmrt-col-nickname`).textContent = "";
                    document.querySelector(`.ebrmrt-row-${i} .ebrmrt-col-reason`).textContent = "";
                    document.querySelector(`.ebrmrt-row-${i} .ebrmrt-col-score`).textContent = "";
                }
                this.match.actuate();
                //this.shareDialog.reset();
                //this.opponent.id = opponent.id;
                //document.querySelector('.endgame_opponent_name').dataset.profile = opponent.id;
                //document.querySelector('.above-game .opponent_name').dataset.profile = opponent.id;
                //document.querySelector('.br_game_time p').textContent = formatTime(this.match_timer_counter);
                this.match_timer = setInterval(() => {
                    if (this.match) {
                        this.match_timer_counter++;
                        if (this.brmm_countdown_outsider_counter > 0) {
                            this.brmm_countdown_outsider_counter--;
                            document.querySelector('.br_timer p').textContent = formatTime(this.brmm_countdown_outsider_counter);
                            document.querySelector('.endgame_image_timer p').textContent = formatTime(this.brmm_countdown_outsider_counter);
                        } else {
                            this.brmm_countdown_outsider_counter = 29;
                            document.querySelector('.br_timer p').textContent = formatTime(this.brmm_countdown_outsider_counter);
                            document.querySelector('.endgame_image_timer p').textContent = formatTime(this.brmm_countdown_outsider_counter);
                        }
                        /*if (this.brmm_countdown_outsider_counter <= 10) {
                            this.setHint({
                                msg: '',
                                type: 'normal'
                            });
                        }*/
                        //document.querySelector('.br_game_time p').textContent = formatTime(this.match_timer_counter);
                    }
                }, 1 * 1000);
            }
        }
        createSoloMatch() {
            if (!this.match) {
                chrome.permissions.request({
                    permissions: isIdentityUnavailable ? [] : ["identity", "identity.email"]
                }, function (granted) {
                    if (granted) {
                        this.prevMatch = 5;
                        this.match = new SoloGameEngine(4, KeyboardInputControl, SoloUIHTMLControl, LocalStorageControl);
                        this.match.name = this.nickname;
                        this.match.setup();
                        try {
                            this.socket.emit('update_solo_stats');
                        } catch (e) { }
                    }
                }.bind(this));
                // timer is operated by SoloGameEngine
            }
        }
        destroyMatch(ignoreAfterGame, callback) {
            this.match_timer && clearInterval(this.match_timer);
            this.match_timer = null;
            this.match_timer_counter = 0;
            this.timeout_timer && clearInterval(this.timeout_timer);
            this.timeout_timer = null;
            this.timeout_counter = 0;
            this.timeout_limit = -1;
            this.match && this.match.quit && this.match.quit(); // for solo
            this.match && (this.match.inputManager.keyDownEnabled = false);
            this.ready = false;

            if (this.match && !ignoreAfterGame) {
                //enable ads if needed
                try { this.AftergameModuleInstance.showPopup(callback); } catch (e) { }
            }
            else {
                if (callback) {
                    callback();
                }
            }

            this.match = null;


        }

        changeScreen(screenId, data) {
            let title = ``;
            let hint = ``;
            let type = 'normal';
            let config = [];
            let skip = false;

            switch (screenId) {
                case SCREEN.SIMPLE_LOADING:
                    title = chrome.i18n.getMessage('loading');
                    break;
                case SCREEN.DISCONNECTED:
                    this.screenPool = [SCREEN.MENU];
                    title = chrome.i18n.getMessage('appName');
                    hint = chrome.i18n.getMessage('disconnected');
                    type = 'error';
                    this.pmm_counter.oid = 0;
                    this.pmm_counter.you = 0;
                    this.pmm_counter.enemy = 0;
                    break;
                case SCREEN.PRELOAD:
                    break;
                case SCREEN.SIGNIN:
                    this.screenPool.push(SCREEN.SIGNIN);
                    title = chrome.i18n.getMessage('appName');
                    this.pmm_counter.oid = 0;
                    this.pmm_counter.you = 0;
                    this.pmm_counter.enemy = 0;
                    break;
                case SCREEN.MENU:
                    if (Auth.logged_as) {
                        screenId = SCREEN.MENU_LOGGED;
                    }
                    hint = '';
                    type = 'normal';
                case SCREEN.MENU_LOGGED:
                    hint = '';
                    type = 'normal';
                    this.screenPool = [screenId == SCREEN.MENU ? SCREEN.MENU : SCREEN.MENU_LOGGED];
                    document.querySelector('.label_surrender').textContent = chrome.i18n.getMessage('label_surrender');
                    document.querySelector('.endgame_messaging').className = 'endgame_messaging';
                    document.querySelector('.endgame_pts').className = 'endgame_pts';
                    document.querySelector('.endgame_private_score').className = 'endgame_private_score';
                    document.querySelector('.private_score').className = 'private_score';
                    game.socket && game.socket.emit('account_position', game.id);
                    title = chrome.i18n.getMessage('appName');
                    this.pmm_counter.oid = 0;
                    this.pmm_counter.you = 0;
                    this.pmm_counter.enemy = 0;
                    for (let i = 0; i < 10; i++) {
                        document.querySelector(`.brp_${i + 1}`).className = `brp_${i + 1}`;
                        document.querySelector(`.brp_${i + 1}`).dataset.brpid = "";
                    }
                    document.querySelector(`.br_players`).className = `br_players`;
                    document.querySelector('.endgame_image').classList.toggle('hidden', false);
                    document.querySelector('.endgame_image_timer').classList.toggle('hidden', true);
                    break;
                case SCREEN.GAME_RULES:
                    this.screenPool.push(SCREEN.GAME_RULES);
                    title = chrome.i18n.getMessage('title_game_rules');
                    hint = chrome.i18n.getMessage('game_rules_hint');
                    break;
                case SCREEN.PROFILE_INIT:
                    title = chrome.i18n.getMessage('title_profile');
                    break;
                case SCREEN.PROFILE:
                    this.screenPool.push(SCREEN.PROFILE);
                    title = chrome.i18n.getMessage('title_profile');
                    break;
                case SCREEN.SINGLE_LADDER:
                case SCREEN.ONLY_SINGLE_LADDER:
                    document.querySelector('.ladder-selector.selected').classList.remove('selected');
                    document.querySelector('#single_ladders').classList.add('selected');
                    if (this.screenPool[this.screenPool.length - 1] == SCREEN.LADDERBOARD) {
                        this.screenPool.pop();
                    }
                    this.screenPool.push(screenId);
                    title = chrome.i18n.getMessage('ladders_title');
                    break;
                case SCREEN.LADDERBOARD:
                    document.querySelector('.ladder-selector.selected').classList.remove('selected');
                    document.querySelector('#mltpl_ladders').classList.add('selected');
                    if (this.screenPool[this.screenPool.length - 1] == SCREEN.SINGLE_LADDER) {
                        this.screenPool.pop();
                    }
                    this.screenPool.push(SCREEN.LADDERBOARD);
                    title = chrome.i18n.getMessage('ladders_title');
                    let li = (this.rating < 200 ? 'newbie' : (this.rating < 600 ? 'bronze' : (this.rating < 1000 ? 'silver' : 'gold')));
                    switch (li) {
                        case 'bronze':
                            hint = chrome.i18n.getMessage('ladders_in');
                            type = 'extended';
                            config = [{
                                node: 'span',
                                styleClass: 'sbronze',
                                text: `#${this.position}`
                            }, {
                                node: 'span',
                                styleClass: '',
                                text: chrome.i18n.getMessage('ladders_in_with', [this.rating])
                            }];
                            break;
                        case 'silver':
                            hint = chrome.i18n.getMessage('ladders_in');
                            type = 'extended';
                            config = [{
                                node: 'span',
                                styleClass: 'ssilver',
                                text: `#${this.position}`
                            }, {
                                node: 'span',
                                styleClass: '',
                                text: chrome.i18n.getMessage('ladders_in_with', [this.rating])
                            }];
                            break;
                        case 'gold':
                            hint = chrome.i18n.getMessage('ladders_in');
                            type = 'extended';
                            config = [{
                                node: 'span',
                                styleClass: 'sgold',
                                text: `#${this.position}`
                            }, {
                                node: 'span',
                                styleClass: '',
                                text: chrome.i18n.getMessage('ladders_in_with', [this.rating])
                            }];
                            break;
                        case 'newbie':
                        default:
                            hint = chrome.i18n.getMessage('ladders_out', [this.position, this.rating]);
                            break;
                    }
                    this.pmm_counter.oid = 0;
                    this.pmm_counter.you = 0;
                    this.pmm_counter.enemy = 0;
                    break;
                case SCREEN.RMM_SEARCH:
                    hint = chrome.i18n.getMessage('tlog_search_for_competitor');
                    break;
                case SCREEN.BR_SEARCH:
                    // TODO: fix
                    hint = chrome.i18n.getMessage('w8ingother');
                    title = chrome.i18n.getMessage('battleroyal_title');
                    break;
                case SCREEN.RMM_LOBBY:
                    this.prevMatch = 0;
                    document.querySelector('.endgame_image').classList.toggle('hidden', false);
                    document.querySelector('.endgame_image_timer').classList.toggle('hidden', true);
                    (this.screenPool[this.screenPool.length - 1] !== screenId) && this.screenPool.push(SCREEN.RMM_LOBBY);
                    title = chrome.i18n.getMessage('appName');
                    break;
                case SCREEN.PMM_LOBBY:
                    document.querySelector('.endgame_image').classList.toggle('hidden', false);
                    document.querySelector('.endgame_image_timer').classList.toggle('hidden', true);
                    (this.screenPool[this.screenPool.length - 1] !== screenId) && this.screenPool.push(SCREEN.PMM_LOBBY);
                    title = chrome.i18n.getMessage('appName');
                    document.querySelector('.endgame_messaging').className = 'endgame_messaging pmm';
                    document.querySelector('.endgame_pts').className = 'endgame_pts pmm';
                    document.querySelector('.endgame_private_score').className = 'endgame_private_score pmm';
                    document.querySelector('.private_score').className = 'private_score pmm';
                    document.querySelector('.label_surrender').textContent = chrome.i18n.getMessage('label_surrender_pmm');
                    this.pmm_counter.oid = 0;
                    this.pmm_counter.you = 0;
                    this.pmm_counter.enemy = 0;
                    break;
                case SCREEN.PMM_HOST:
                    this.screenPool.push(SCREEN.PMM_HOST);
                    title = chrome.i18n.getMessage('host_title');
                    hint = chrome.i18n.getMessage('host_text');
                    this.pmm_counter.oid = 0;
                    this.pmm_counter.you = 0;
                    this.pmm_counter.enemy = 0;
                    //document.querySelector('#hlobby_name').focus();
                    break;
                case SCREEN.PMM_HOST_WAIT:
                    this.prevMatch = 2;
                    document.querySelector('.lobby').value = data.lobby.name;
                    hint = `${chrome.i18n.getMessage('tlog_waiting_for_competitor')}`;
                    break;
                case SCREEN.PMM_JOIN:
                    this.screenPool.push(SCREEN.PMM_JOIN);
                    title = chrome.i18n.getMessage('join_title');
                    hint = chrome.i18n.getMessage('join_text');
                    this.pmm_counter.oid = 0;
                    this.pmm_counter.you = 0;
                    this.pmm_counter.enemy = 0;
                    //document.querySelector('#jlobby_name').focus();
                    break;
                case SCREEN.PMM_JOIN_LOBBY:
                    this.prevMatch = 4;
                    hint = `${chrome.i18n.getMessage('join_to')}${data.lobby.name}`;
                    break;
                case SCREEN.INGAME:
                    // TODO :fix
                    if (!this.timeout_timer) {
                        hint = chrome.i18n.getMessage('tlog_get_more_points');
                    } else {
                        skip = true;
                        this.currentScreen = screenId;
                        document.querySelector('.screen').className = `screen ${screenId}`;
                        document.querySelector('.title').textContent = title;
                        document.querySelector('.endgame_private_score ').textContent = `${game.pmm_counter.you}:${game.pmm_counter.enemy}`;
                        document.querySelector('.private_score .p_score').textContent = `${game.pmm_counter.you}:${game.pmm_counter.enemy}`;
                    }
                    break;
                case SCREEN.BATTLEROYALE:
                    // TODO :fix
                    break;
                case SCREEN.SOLO:
                    (this.screenPool[this.screenPool.length - 1] !== screenId) && this.screenPool.push(SCREEN.SOLO);
                    this.createSoloMatch();
                    document.querySelector('.container').className = 'container solo';
                    document.querySelector('.game_time').textContent = '';
                    hint = chrome.i18n.getMessage('tlog_try_to_win');
                    this.pmm_counter.oid = 0;
                    this.pmm_counter.you = 0;
                    this.pmm_counter.enemy = 0;
                    break;
                case SCREEN.SINGLE:
                    singleGame.show();
                    this.screenPool.push(SCREEN.SINGLE);
                    document.querySelector('.game_time').textContent = '';
                    this.pmm_counter.oid = 0;
                    this.pmm_counter.you = 0;
                    this.pmm_counter.enemy = 0;
                    hint = '';
                    type = 'normal';
                    break;
                case SCREEN.READY_CHECK:
                    hint = `${chrome.i18n.getMessage('tlog_waiting_for_competitor')}`;
                    break;
                case SCREEN.READY:
                    hint = `${chrome.i18n.getMessage('tlog_waiting_for_competitor')}`;
                    this.hideMatchMakingPopup();
                    break;
                case SCREEN.READY_COUNTDOWN_RMM:
                    this.hideMatchMakingPopup(true);
                    break;
                case SCREEN.READY_COUNTDOWN_BR:
                    this.hideMatchMakingPopup(true);
                    hint = `${chrome.i18n.getMessage('battleroyal_ready')}`;
                    title = chrome.i18n.getMessage('battleroyal_title');
                    break;
                case SCREEN.GAMEOVERBR:
                    this.screenPool.push(SCREEN.GAMEOVERBR);
                    // TODO :fix
                    hint = ``;
                    break;
                case SCREEN.GAMEOVER:
                    this.screenPool.push(SCREEN.GAMEOVER);
                    hint = `${chrome.i18n.getMessage('tlog_ladder_position')}`;
                    type = 'extended';
                    config = [{
                        node: 'span',
                        styleClass: game.drating > 0 ? 'pts_bottom_green' : 'pts_bottom_red',
                        text: `${game.prevRating} (${game.drating > 0 ? '+' + game.drating : game.drating}) ${chrome.i18n.getMessage('label_pts')}. `
                    }, {
                        node: 'span',
                        styleClass: 'pts_bottom',
                        text: `${chrome.i18n.getMessage('your_current_pts')}: ${game.prevRating + game.drating}`
                    }];

                    break;
                case SCREEN.LEAGUEUPDATE:
                    hint = `${chrome.i18n.getMessage('tlog_ladder_position')}`;
                    document.querySelector('.modal_leagueupdate').className = `modal_leagueupdate ${(data.league_up ? 'up' : 'down') + '_' + data.league}`;
                    document.querySelector('.league_message').textContent = `${data.league_up ? chrome.i18n.getMessage("leagueupdate_up") : chrome.i18n.getMessage("leagueupdate_down")}`;
                    document.querySelector('.league_ladder_title').textContent = `${chrome.i18n.getMessage('leagueupdate_' + data.league)}`;
                    break;
                case SCREEN.SURRENDER:
                    skip = true;
                    this.currentScreen = screenId;
                    document.querySelector('.screen').className = `screen ${screenId}`;
                    document.querySelector('.title').textContent = title;
                    document.querySelector('.endgame_private_score ').textContent = `${game.pmm_counter.you}:${game.pmm_counter.enemy}`;
                    document.querySelector('.private_score .p_score').textContent = `${game.pmm_counter.you}:${game.pmm_counter.enemy}`;
                    break;
                case SCREEN.MATCHHISTORY:
                    title = chrome.i18n.getMessage('matchhistory_title');
                    break;
                case SCREEN.SPEEDRUNBEST:
                    title = chrome.i18n.getMessage('speedrunbest_title');
                    hint = '';
                    break;
                case SCREEN.SHOP_INIT:
                    title = chrome.i18n.getMessage('title_shop');
                    break;
                case SCREEN.SHOP:
                    skip = true;
                    if (this.screenPool[this.screenPool.length - 1] !== SCREEN.SHOP) {
                        this.screenPool.push(SCREEN.SHOP);
                    }
                    this.currentScreen = SCREEN.SHOP;
                    document.querySelector('.screen').className = 'screen ' + this.screenPool.slice(-2).join(' ');
                    break;
            }
            if (!skip) {
                this.currentScreen = screenId;
                document.querySelector('.screen').className = `screen ${screenId}`;
                document.querySelector('.title').textContent = title;
                document.querySelector('.endgame_private_score ').textContent = `${game.pmm_counter.you}:${game.pmm_counter.enemy}`;
                document.querySelector('.private_score .p_score').textContent = `${game.pmm_counter.you}:${game.pmm_counter.enemy}`;
                if (this.currentScreen === SCREEN.MENU || this.currentScreen === SCREEN.MENU_LOGGED) {
                    this.menu.alignButtonIndicator();
                } else if (this.currentScreen === SCREEN.RMM_LOBBY) {
                    this.menuRMM.alignButtonIndicator();
                }
                this.setHint({
                    msg: hint,
                    type: type,
                    config: config
                });
            }
        }
        changeModal(modalId) {
            switch (modalId) {
                case MODAL.NONE:
                    break;
                case MODAL.SHOP:
                    break;
            }

            this.currentModal = modalId;
            document.querySelector('.screen').setAttribute('modal', modalId);
        }
        setHint(data) {
            /* data = { msg: (String), type: ('error'|'success'|'normal'|'penalty'|'advantage'|'extended'), config: [{ node: (Node type), styleClass: (String), text: (String)}...]} */
            document.querySelector('.hint').textContent = data.msg;
            switch (data.type) {
                case 'error':
                    document.querySelector('.timer-container p').textContent = '';
                    document.querySelector('.footer').className = 'footer';
                    document.querySelector('.hint').className = 'hint error';
                    break;
                case 'success':
                    document.querySelector('.timer-container p').textContent = '';
                    document.querySelector('.footer').className = 'footer';
                    document.querySelector('.hint').className = 'hint success';
                    break;
                case 'penalty':
                    document.querySelector('.footer').className = 'footer penalty';
                    document.querySelector('.hint').className = 'hint penalty';
                    break;
                case 'outdue':
                    document.querySelector('.footer').className = 'footer outdue';
                    document.querySelector('.hint').className = 'hint outdue';
                    break;
                case 'penalty_danger':
                    document.querySelector('.footer').className = 'footer penalty_danger';
                    document.querySelector('.hint').className = 'hint penalty_danger';
                    break;
                case 'advantage':
                    document.querySelector('.footer').className = 'footer advantage';
                    document.querySelector('.hint').className = 'hint advantage';
                    break;
                case 'extended':
                    document.querySelector('.footer').className = 'footer';
                    document.querySelector('.hint').className = 'hint';
                    for (let c = 0, len = data.config.length; c < len; c++) {
                        let el = document.createElement(data.config[c].node);
                        el.className = data.config[c].styleClass;
                        el.textContent = data.config[c].text;
                        document.querySelector('.hint').appendChild(el);
                    }
                    break;
                case 'linked':
                    document.querySelector('.footer').className = 'footer';
                    document.querySelector('.hint').className = 'hint';
                    for (let c = 0, len = data.config.length; c < len; c++) {
                        let el = document.createElement('a');
                        el.target = "_blank";
                        el.href = data.config[c].href;
                        el.textContent = data.config[c].text;
                        document.querySelector('.hint').appendChild(el);
                    }
                    break;
                default:
                case 'normal':
                    document.querySelector('.timer-container p').textContent = '';
                    document.querySelector('.footer').className = 'footer';
                    document.querySelector('.hint').className = 'hint';
                    break;
            }
        }
        showProfile(id) {
            game.init_socket({ elSelectorClick: '.profile-option' }, () => {
                document.querySelector('.loading_text').textContent = chrome.i18n.getMessage('loading');
                document.querySelector('.profile_wrapper').setAttribute('user_id', id)
                this.changeScreen(SCREEN.PROFILE_INIT);
                this.socket.emit('account_info', id);
            });
        }
        displayProfile(data) {
            /* data = {
                id: (INTEGER),
                online: (Boolean),
                position: (TINYINT),
                nickname: (String),
                rating: (SMALLINT SIGNED),
                avatar: (String),
                wins: (INTEGER),
                loses: (INTEGER),
                winrate: (INTEGER),
                avg_apm: (INTEGER),
                avg_duration: (INTEGER),
                rank1: (Integer),
                avgrank: (NUMBER),
                totalbr: (INTEGER),
                matches: (INTEGER),
                history: [{ 
                    matchId: (INTEGER), 
                    type: (TINYINT), 
                    duration: (INTEGER), 
                    created_at: (TIMESTAMP), 
                    ended_at: (TIMESTAMP),
                    player: {
                        id: (INTEGER),
                        nickname: (String),
                        score: (INTEGER),
                        reason: (String),
                        drating: (SMALLINT SIGNED),
                        position: (TINYINT)
                    },
                    opponents: [{
                        id: (INTEGER),
                        nickname: (String),
                        score: (INTEGER),
                        reason: (String),
                        drating: (SMALLINT SIGNED),
                        position: (TINYINT)
                    }, ...]
                }]
            } */
            if (this.currentScreen !== SCREEN.PROFILE_INIT || document.querySelector('.profile_wrapper').getAttribute('user_id') != data.id) {
                return;
            }

            this.changeScreen(SCREEN.PROFILE);
            if (data.id == this._id) {
                document.querySelector('.screen .header').classList.add('my_profile');
                this.avatar = data.avatar;
            } else {
                document.querySelector('.screen .header').classList.remove('my_profile');
            }
            document.querySelector('.profile-avatar').src = `files/images/avatars/${this.storage['night_mode_on'] == '1' ? 'dark' : 'normal'}/avatar-profile-60-px-lvl-${data.avatar}.svg`;
            document.querySelector('.profile-nickname').textContent = data.nickname;
            document.querySelector('.profile-status-online').className = `profile-status-online ${data.online ? 'online' : 'offline'}`;
            document.querySelector('.profile-status').textContent = data.online ? 'Online' : 'Offline';
            document.querySelector('.profile-status').className = `profile-status ${data.online ? 'online' : 'offline'}`;
            document.querySelector('.info_rating .irtl_value').textContent = `${data.rating} ${chrome.i18n.getMessage('label_pts')}`;
            if (data.league !== 'newbie') {
                document.querySelector('.info_rating').className = 'info_rating';
                document.querySelector('.info_top_position').className = 'info_top_position';
                document.querySelector('.info_league').className = 'info_league';
                document.querySelector('.info_league .irtl_value').textContent = chrome.i18n.getMessage(`${data.league}_ladders`);
                document.querySelector('.icon_ladders').src = `files/images/icon-${data.league}ladders.svg`;
            } else {
                document.querySelector('.info_rating').className = 'info_rating pi_nonleague';
                document.querySelector('.info_top_position').className = 'info_top_position pi_nonleague';
                document.querySelector('.info_league').className = 'info_league pi_nonleague';
                document.querySelector('.info_league .irtl_value').textContent = '';
                document.querySelector('.icon_ladders').src = '';
            }
            document.querySelector('.info_top_position .irtl_value').textContent = data.position;
            document.querySelector('.info_statistics_matches .is_value').textContent = data.matches;
            document.querySelector('.info_statistics_apm .is_value').textContent = data.avg_apm;
            document.querySelector('.info_statistics_avg_duration .is_value').textContent = `${formatTime(parseInt(data.avg_duration / 1000))}`;
            document.querySelector('.info_statistics_wins .is_value').textContent = data.wins;
            document.querySelector('.info_statistics_loses .is_value').textContent = data.loses;
            document.querySelector('.info_statistics_winrate .is_value').textContent = `${parseInt(data.winrate)}%`;

            document.querySelector('.info_statistics_br_rank1 .is_value').textContent = data.rank1;
            document.querySelector('.info_statistics_br_avg_rank .is_value').textContent = data.avgrank.toFixed(2);
            document.querySelector('.info_statistics_br_total_br .is_value').textContent = data.totalbr;
            let mhNode = document.querySelector('.list_matchhistory');
            while (mhNode.firstChild) {
                mhNode.removeChild(mhNode.firstChild);
            }
            for (let i = 0; i < data.history.length; i++) {
                /*
                    <div class="lmh_match win">
                        <p class="lmhm_player_nickname">Player Nickname</p>
                        <p class="lmhm_opponent_nickname">Opponent Nickname</p>
                        <p class="lmhm_player_score">999999</p>
                        <p class="lmhm_opponent_score">9999999</p>
                        <div class="lmhm_pts">
                            <p>+20 pts</p>
                        </div>
                        <div class="lmhm_duration">
                            <p>3.5 min</p>
                        </div>
                        <div class="lmhm_reason">
                            <p>No moves</p>
                        </div>
                    </div>
                 */
                let divLmhMatch = document.createElement('div');
                divLmhMatch.className = `lmh_match ${data.history[i].player.position === 1 ? 'win' : 'lose'}`;
                let divLmhmplayernickname = document.createElement('p');
                divLmhmplayernickname.className = 'lmhm_player_nickname';
                divLmhmplayernickname.textContent = data.history[i].player.nickname;
                divLmhMatch.appendChild(divLmhmplayernickname);
                let divLmhmopponentnickname = document.createElement('p');
                divLmhmopponentnickname.className = 'lmhm_opponent_nickname';
                divLmhmopponentnickname.textContent = data.history[i].opponents[0].nickname;
                divLmhMatch.appendChild(divLmhmopponentnickname);
                let divLmhmplayerscore = document.createElement('p');
                divLmhmplayerscore.className = 'lmhm_player_score';
                divLmhmplayerscore.textContent = data.history[i].player.score;
                divLmhMatch.appendChild(divLmhmplayerscore);
                let divLmhmopponentscore = document.createElement('p');
                divLmhmopponentscore.className = 'lmhm_opponent_score';
                divLmhmopponentscore.textContent = data.history[i].opponents[0].score;
                divLmhMatch.appendChild(divLmhmopponentscore);

                let divLmhmpts = document.createElement('div');
                divLmhmpts.className = 'lmhm_pts';
                let plmhmpts = document.createElement('p');
                plmhmpts.textContent = `${data.history[i].player.drating > 0 ? '+' : ''}${data.history[i].player.drating} ${chrome.i18n.getMessage('label_pts')}`;
                divLmhmpts.appendChild(plmhmpts)
                divLmhMatch.appendChild(divLmhmpts);

                let divLmhmduration = document.createElement('div');
                divLmhmduration.className = 'lmhm_duration';
                let plmhmduration = document.createElement('p');
                plmhmduration.textContent = `${formatTime(parseInt(data.history[i].duration / 1000))} ${chrome.i18n.getMessage('label_min')}`;
                divLmhmduration.appendChild(plmhmduration)
                divLmhMatch.appendChild(divLmhmduration);

                let divLmhmreason = document.createElement('div');
                divLmhmreason.className = 'lmhm_reason';
                let plmhmreason = document.createElement('p');
                plmhmreason.textContent = data.history[i].player.position === 1 ? chrome.i18n.getMessage(`reason_${data.history[i].opponents[0].reason}`) : chrome.i18n.getMessage(`reason_${data.history[i].player.reason}`);
                divLmhmreason.appendChild(plmhmreason)
                divLmhMatch.appendChild(divLmhmreason);
                mhNode.appendChild(divLmhMatch);
            }
        }
        showSmile(id, for_me) {
            if (this.smiles[id]) {
                let img = document.createElement('img');
                img.setAttribute('src', this.smiles[id]['src']);
                img.style.setProperty('--random-pos', (Math.random() * 14 - 7) + 'px');
                img.style.setProperty('--random-scale', (Math.random() * 0.5 + 0.5));
                img.style.setProperty('--random-delta', ((Math.random() * 5 + 2) * (Math.random() > 0.5 ? 1 : -1)) + 'px');
                img.style.transform = 'rotate(' + (Math.random() * 10 - 5) + 'deg)';
                document.querySelector('#' + (for_me ? 'my' : 'enemy') + '_geyser').appendChild(img);
                img.addEventListener("animationend", (e) => {
                    if (e.animationName == 'geyser-ver') {
                        e.target.remove();
                    }
                });
            }
        }
        //deprecated
        showShop(data) {
            return;

            document.querySelector('#shop').className = data.product || 'products';

            if (this.products) {
                this.displayShop();
            } else {
                document.querySelector('.loading_text').textContent = chrome.i18n.getMessage('loading');
                this.changeScreen(SCREEN.SHOP_INIT);
                this.socket.emit('shop_products');
            }
        }
        //deprecated
        displayShop() {
            return;

            this.changeScreen(SCREEN.SHOP);

            switch (document.querySelector('#shop').className) {
                case 'products':
                    document.querySelector('#products .header .title').textContent = `${chrome.i18n.getMessage('title_shop')}`;
                    document.querySelector('#products .footer .currency').textContent = `${chrome.i18n.getMessage('select_currency')}:`;
                    document.querySelector('#products .footer .report a').textContent = `${chrome.i18n.getMessage('report_problem')}`;

                    let currency_control = document.querySelector('.currency_control ul');
                    if (window.localStorage['currency']) {
                        let curr_selctd = currency_control.querySelector('[value="' + window.localStorage['currency'] + '"]') || currency_control.firstElementChild;
                        curr_selctd.classList.add('selected');
                        currency_control.style.left = (currency_control.getBoundingClientRect().left - curr_selctd.getBoundingClientRect().left) + 'px';
                    }

                    let default_lang = "en";
                    let lang = chrome.i18n.getUILanguage().substr(0, 2).toLowerCase();
                    let products_list = document.querySelector('#products #products_list');
                    products_list.textContent = '';
                    for (var id in this.products) {
                        let product = document.createElement('div');
                        product.className = 'product';
                        let icon = document.createElement('img');
                        icon.className = 'icon';
                        icon.setAttribute('src', this.products[id]['icon']);
                        product.appendChild(icon);
                        let text = document.createElement('div');
                        text.className = 'text';
                        let title = document.createElement('div');
                        title.className = 'title';
                        title.textContent = this.products[id]['title'][lang] || this.products[id]['title'][default_lang];
                        text.appendChild(title);
                        let description = document.createElement('div');
                        description.className = 'description';
                        description.textContent = this.products[id]['description'][lang] || this.products[id]['description'][default_lang];
                        text.appendChild(description);
                        product.appendChild(text);
                        let buy_btn = document.createElement('div');
                        buy_btn.className = 'buy_btn';
                        buy_btn.textContent = this.products[id]['price'];
                        buy_btn.setAttribute('product_id', id);
                        if (this.products[id]['buyed']) {
                            buy_btn.classList.add('buyed');
                        } else {
                            buy_btn.addEventListener('click', (e) => {
                                let product_id = e.target.getAttribute('product_id');
                                let currency = "USD";
                                if (document.querySelector('.currency_control .selected')) {
                                    currency = document.querySelector('.currency_control .selected').getAttribute('value') || "USD";
                                }
                                this.socket.emit('buy', { id: product_id, currency: currency });
                            });
                        }
                        product.appendChild(buy_btn);
                        products_list.appendChild(product);
                    }
                    break;
                default:
                    if (this.products[document.querySelector('#shop').className]) {
                        let pid = document.querySelector('#shop').className;
                        let default_lang = "en";
                        let lang = chrome.i18n.getUILanguage().substr(0, 2).toLowerCase();
                        if (document.querySelector(`#shop #${pid}`)) {
                            document.querySelector(`#shop #${pid} .title`).textContent = this.products[pid]['title'][lang] || this.products[pid]['title'][default_lang];;
                            document.querySelector(`#shop #${pid} .sub_title`).textContent = '';//`${chrome.i18n.getMessage('need_buy_option')}`;
                            document.querySelector(`#shop #${pid} .buy_btn`).textContent = `${chrome.i18n.getMessage('buy_now')} ${this.products[pid]['price']}`;
                            document.querySelector(`#shop #${pid} .icon img`).src = this.products[pid]['promo_icon'] || this.products[pid]['icon'];
                        } else {
                            game.screenPool.pop();
                            game.showShop({});
                        }
                    } else {
                        game.screenPool.pop();
                        game.showShop({});
                    }
                    break;
            }
        }
        setNightMode(on) {
            var dark_style_dom = document.getElementById('night_style');
            if (true) {
                window.store.getNightStyle((css_text) => {
                    if (true) {
                        dark_style_dom = document.createElement('link');
                        dark_style_dom.setAttribute("rel", "stylesheet");
                        dark_style_dom.setAttribute("type", "text/css");
                        dark_style_dom.href = window.URL.createObjectURL(new Blob([css_text], { type: 'text/css' }));
                        dark_style_dom.id = 'night_style';
                        document.body.appendChild(dark_style_dom);
                        this.storage['night_mode_on'] = '1';
                        chrome.browserAction.setIcon({
                            path: {
                                "16": "/icons/icon_night16.png",
                                "32": "/icons/icon_night32.png",
                                "48": "/icons/icon_night48.png",
                                "128": "/icons/icon_night128.png"
                            }
                        });
                        document.querySelector('link[sizes="16x16"]').href = "./icons/icon_night16.png"
                        document.getElementById('night_mode_checkbox').classList.add('checked');
                        document.querySelector('.tt_night_switch').textContent = chrome.i18n.getMessage('day_mode');
                        this.AftergameModuleInstance.setNightMode(on);
                    } else {
                        this.storage['night_mode_on'] = '0';
                        window.store.clearNightStyleData();
                    }
                });
            } else if (!on && dark_style_dom) {
                this.storage['night_mode_on'] = '0';
                dark_style_dom && dark_style_dom.remove();

                chrome.browserAction.setIcon({
                    path: {
                        "16": "/icons/icon16.png",
                        "48": "/icons/icon48.png",
                        "128": "/icons/icon128.png"
                    }
                });
                document.querySelector('link[sizes="16x16"]').href = "./icons/icon16.png"
                document.getElementById('night_mode_checkbox').classList.remove('checked');
                document.querySelector('.tt_night_switch').textContent = chrome.i18n.getMessage('night_mode');
                this.AftergameModuleInstance.setNightMode(on);
            }
        }
        toggleNightMode() {
            let on = !document.getElementById('night_mode_checkbox').classList.contains('checked');
            window.store.getInfo(false, false, (info) => {
                // if (on && (!info || !info.has_night_mode)) {
                //     this.showModalShop({
                //         product: 'night_mode_promo'
                //     });
                // } else {
                    this.setNightMode(on);
                // }
            });
        }
        showMultiLadders(type = 'top100' /* top100, bronze, silver, gold */) {
            if (game.currentScreen !== SCREEN.LADDERBOARD) {
                game.changeScreen(SCREEN.LADDERBOARD);
            }

            Auth.ladderInfo({ type: type }).then((table) => {
                switch (type) {
                    case 'top100':
                        document.querySelector('.ladders-view').className = 'ladders-view top100';
                        document.querySelector('.tab.tab-top100').className = "tab tab-top100 active";
                        document.querySelector('.tab.tab-bronze').className = "tab tab-bronze";
                        document.querySelector('.tab.tab-silver').className = "tab tab-silver";
                        document.querySelector('.tab.tab-gold').className = "tab tab-gold";
                        break;
                    case 'bronze':
                        document.querySelector('.ladders-view').className = 'ladders-view bronze';
                        document.querySelector('.tab.tab-top100').className = "tab tab-top100";
                        document.querySelector('.tab.tab-bronze').className = "tab tab-bronze active";
                        document.querySelector('.tab.tab-silver').className = "tab tab-silver";
                        document.querySelector('.tab.tab-gold').className = "tab tab-gold";
                        break;
                    case 'silver':
                        document.querySelector('.ladders-view').className = 'ladders-view silver';
                        document.querySelector('.tab.tab-top100').className = "tab tab-top100";
                        document.querySelector('.tab.tab-bronze').className = "tab tab-bronze";
                        document.querySelector('.tab.tab-silver').className = "tab tab-silver active";
                        document.querySelector('.tab.tab-gold').className = "tab tab-gold";
                        break;
                    case 'gold':
                        document.querySelector('.ladders-view').className = 'ladders-view gold';
                        document.querySelector('.tab.tab-top100').className = "tab tab-top100";
                        document.querySelector('.tab.tab-bronze').className = "tab tab-bronze";
                        document.querySelector('.tab.tab-silver').className = "tab tab-silver";
                        document.querySelector('.tab.tab-gold').className = "tab tab-gold active";
                        break;
                }
                let gridNode = document.querySelector('.ladders-grid');
                while (gridNode.firstChild) {
                    gridNode.removeChild(gridNode.firstChild);
                }
                for (let i = 1; i < table.length; i++) {
                    let divLadderTableRow = document.createElement('div');
                    divLadderTableRow.className = `ladders-row${table[0] && table[0].position === table[i].position ? ' self' : ''}`;
                    divLadderTableRow.setAttribute('data-profile', table[i].id);
                    // IMPORTANT: used function () {} instead of () => {} cause of `this` must be DOMElement
                    divLadderTableRow.addEventListener('click', function (e) {
                        game.showProfile(parseInt(this.dataset.profile));
                    });
                    let divPosition = document.createElement('div');
                    divPosition.className = 'ladders-col-1';
                    divPosition.textContent = table[i].position;
                    divLadderTableRow.appendChild(divPosition);
                    let divNickname = document.createElement('div');
                    divNickname.className = 'ladders-col-2';
                    divNickname.textContent = table[i].nickname;
                    divLadderTableRow.appendChild(divNickname);
                    let divRating = document.createElement('div');
                    divRating.className = 'ladders-col-3';
                    divRating.textContent = table[i].rating;
                    divLadderTableRow.appendChild(divRating);
                    gridNode.appendChild(divLadderTableRow);
                }
                table[0] && (this.rating = table[0].rating);
                let li = (this.rating < 200 ? 'newbie' : (this.rating < 600 ? 'bronze' : (this.rating < 1000 ? 'silver' : 'gold')));
                switch (li) {
                    case 'bronze':
                        this.setHint({
                            msg: chrome.i18n.getMessage('ladders_in'),
                            type: 'extended',
                            config: [{
                                node: 'span',
                                styleClass: 'sbronze',
                                text: `#${this.position}`
                            }, {
                                node: 'span',
                                styleClass: '',
                                text: chrome.i18n.getMessage('ladders_in_with', [this.rating])
                            }]
                        });
                        break;
                    case 'silver':
                        this.setHint({
                            msg: chrome.i18n.getMessage('ladders_in'),
                            type: 'extended',
                            config: [{
                                node: 'span',
                                styleClass: 'ssilver',
                                text: `#${this.position}`
                            }, {
                                node: 'span',
                                styleClass: '',
                                text: chrome.i18n.getMessage('ladders_in_with', [this.rating])
                            }]
                        });
                        break;
                    case 'gold':
                        this.setHint({
                            msg: chrome.i18n.getMessage('ladders_in'),
                            type: 'extended',
                            config: [{
                                node: 'span',
                                styleClass: 'sgold',
                                text: `#${this.position}`
                            }, {
                                node: 'span',
                                styleClass: '',
                                text: chrome.i18n.getMessage('ladders_in_with', [this.rating])
                            }]
                        });
                        break;
                    case 'newbie':
                    default:
                        break;
                }
            }).catch((error) => {
                //TODO: показать ошибку подключения к серверу 
            });
        }
        showSingleLadders() {
            this.changeScreen(Auth.logged_as ? SCREEN.SINGLE_LADDER : SCREEN.ONLY_SINGLE_LADDER);

            var createTopRow = function (rank, name, score, undos) {
                var rowDom = document.createElement('div');
                rowDom.className = "row";
                rowDom.setAttribute('rank', rank);
                var rankDom = document.createElement('div');
                rankDom.className = 'rank';
                rankDom.textContent = rank + '.';
                var nameDom = document.createElement('div');
                nameDom.className = 'name';
                nameDom.textContent = name;
                var scoreDom = document.createElement('div');
                scoreDom.className = 'score';
                scoreDom.textContent = parseInt(score);

                rowDom.appendChild(rankDom);
                rowDom.appendChild(nameDom);
                rowDom.appendChild(scoreDom);

                if (undos) {
                    rowDom.classList.add('undos');
                }

                return rowDom;
            }

            document.querySelector('.single_ladders-view').scrollTop = 0;
            var table = document.querySelector('.single_ladders-view #table');
            table.classList.remove('empty');
            table.classList.add('sc-loading');
            lbRequest({ method: 'get', top: 100, id: Auth.logged_as ? Auth.logged_as : undefined }, (res) => {
                table.classList.remove('sc-loading');
                while (table.firstChild) {
                    table.firstChild.remove();
                }
                if (Auth.logged_as) {
                    singleGame.updateLocalScore(res.myResult);
                }

                var myId = res.myResult && res.myResult.id;
                var isInTop = false;
                if (res.success && res.top && res.top.length > 0) {
                    for (var i = 0; i < res.top.length; i++) {
                        var row = res.top[i];
                        var rowDom = createTopRow(row.rank + 1, row.name, row.score, row.undos);
                        if (!isInTop && row.id && row.id == myId) {
                            isInTop = true;
                            rowDom.classList.add('self');
                        }
                        table.appendChild(rowDom);
                    }
                    if (myId && !isInTop) {
                        var rowDom = createTopRow(res.myResult.rank + 1, res.myResult.name, res.myResult.score, res.myResult.undos);
                        rowDom.classList.add('self-out');
                        table.insertBefore(rowDom, table.firstChild);
                    }
                } else {
                    table.classList.add('empty');
                }
                try {
                    let msg = res.hint.en;
                    const current_lang = chrome.i18n.getMessage("@@ui_locale").slice(0, 2);
                    if (res.hint.hasOwnProperty(current_lang)) {
                        msg = res.hint[current_lang];
                    }
                    if (res.hint.hasOwnProperty('link')) {
                        this.setHint({
                            msg: '',
                            type: 'linked',
                            config: [{
                                node: 'a',
                                href: res.hint.link,
                                text: msg
                            }]
                        })
                    }
                    else {
                        this.setHint({
                            msg: msg,
                            type: 'normal',
                            config: []
                        });
                    }
                }
                catch (e) {
                    this.setHint({
                        msg: chrome.i18n.getMessage('leaderboard'),
                        type: 'normal',
                        config: []
                    });
                }

            });
        }
        showModalShop(data) {
            this.changeModal(MODAL.SHOP);
            window.store.getInfo(true, false, (info) => {
                var store_container = document.querySelector('.store-container');
                if (!data || data.product == 'products') {
                    if (info) {
                        var store_title_text = declOfNum(info.product_elements, [
                            chrome.i18n.getMessage('store_title_0'),
                            chrome.i18n.getMessage('store_title_1'),
                            chrome.i18n.getMessage('store_title_2')
                        ]);
                        store_title_text = store_title_text.replace(/\d/, info.product_elements);
                        document.querySelector('.store-container .big-text').textContent = store_title_text;
                        document.querySelector('.store-container .small-text').textContent = chrome.i18n.getMessage(info.product_elements > 0 ? 'store_desription' : 'store_desription_zero');

                        window.store.getProducts(false, function (products) {
                            store_container.className = 'store-container products';
                            document.querySelector('.store-container .email').textContent = info.email;

                            var products_container = document.querySelector('#products-list');
                            products_container.textContent = '';
                            for (var id in products) {
                                var product_dom = document.createElement('div');
                                product_dom.className = 'product';
                                product_dom.id = id;
                                var icon = document.createElement('img');
                                icon.className = 'icon';
                                icon.src = products[id].icon;
                                var title = document.createElement('div');
                                title.className = 'title-container';
                                var title_flex = document.createElement('div');
                                title_flex.className = 'title-flex';
                                var title_content = document.createElement('div');
                                title_content.className = 'title';
                                title_content.textContent = lang in products[id].name ? products[id].name[lang] : products[id].name[default_lang];
                                title_flex.appendChild(title_content);
                                title.appendChild(title_flex);
                                var buy_btn = document.createElement('div');
                                buy_btn.className = 'buy-btn';
                                buy_btn.textContent = products[id].price;
                                if (products[id].buyed) {
                                    product_dom.classList.add('buyed');
                                }
                                else if (id === 'disable_ads' && localStorage["noads"] === '1') {
                                    product_dom.classList.add('disabled');
                                } else {
                                    product_dom.addEventListener('click', function () {
                                        window.store.buy(this.id);
                                    });
                                }
                                product_dom.appendChild(icon);
                                product_dom.appendChild(title);
                                product_dom.appendChild(buy_btn);
                                products_container.appendChild(product_dom);
                            }
                        });
                    } else {
                        this.changeModal(MODAL.NONE);
                    }
                } else if (data.product == 'night_mode_promo') {
                    store_container.className = 'store-container night_mode_promo';
                    document.querySelector('#night_mode_promo .store-btn').textContent = chrome.i18n.getMessage('to_shop');
                    window.store.getProducts(false, function (products) {
                        if (products && products['night_mode']) {
                            document.querySelector('#night_mode_promo .store-btn').textContent = chrome.i18n.getMessage('buy_now') + ' ' + products['night_mode'].price;
                        }
                    });
                } else {
                    this.changeModal(MODAL.NONE);
                }
            });
        }

        showMatchMakingPopup(mmtype /* 0 - NONE, 1 - RMM, 2 - PMM, 3 - BR */) {
            // Can by 1 or 3
            this.currentMM = mmtype;
            switch (this.currentMM) {
                case 1:
                    if (!this.mmpMainDOM.classList.contains('search'))
                        this.mmpMainDOM.classList.add('search');
                    this.mmpHintDOM.textContent = chrome.i18n.getMessage("mmpopup_hint_ratingduel");
                    break;
                case 3:
                    if (!this.mmpMainDOM.classList.contains('search'))
                        this.mmpMainDOM.classList.add('search');
                    //this.mmpHintDOM.textContent = chrome.i18n.getMessage("mmpopup_hint_battleroyal");
                    break;
            }
        }

        hideMatchMakingPopup(isStarting) {
            if (isStarting) {
                //hide banner
                this.AftergameModuleInstance.forceHide();

                //block single game
                singleGame.block();
            }

            if (this.mmpMainDOM.classList.contains('search'))
                this.mmpMainDOM.classList.remove('search');
            this.currentMM = 0;
            this.changeModal(MODAL.NONE);
        }

        cancelMatchMakingPopup() {
            switch (this.currentMM) {
                case 1:
                    this.socket.emit('search_cancel');
                    if (this.pmm_attempts_timer) {
                        this.pmm_attempts = 0;
                        clearTimeout(this.pmm_attempts_timer);
                    }
                    break;
                case 3:
                    this.socket.emit('brmm_cancel');
                    break;
            }
        }
    }

    function formatTime(seconds) {
        return `${~~(seconds / 60)}:${~~(seconds % 60) < 10 ? '0' + (~~(seconds % 60)) : ~~(seconds % 60)}`;
    }

    function showOrHideTip(showTip, tooltip, code) {
        if (showTip) {
            document.querySelector('.nickname_wrapper').className = 'nickname_wrapper nw_error';
            if (tooltip) {
                tooltip.textContent = chrome.i18n.getMessage(`invalid_nickname_${code}`);
            } else {
                log(chrome.i18n.getMessage(`invalid_nickname_${code}`));
            }
        } else {
            document.querySelector('.nickname_wrapper').className = 'nickname_wrapper';
            if (tooltip) {
                tooltip.textContent = "";
            }
        }
    }

    function createListener(validator) {
        return e => {
            const text = e.target.value;
            const valid = validator(text);
            const tooltip = e.target.nextElementSibling;
            showOrHideTip(!valid.status, tooltip, valid.code);
        };
    }
    // document.querySelector('#nickname').addEventListener('input', createListener(validateNickname));
    document.querySelector('#nickname').addEventListener('click', (e) => {
        e.stopPropagation();
    });
    document.querySelector('#nickname').addEventListener('keydown', (e) => {
        showOrHideTip(false, document.querySelector('#nickname').nextElementSibling);
    });
    function saveNickname(value, editMode) {
        let editEvent = this.editEvent;
        let result = validateNickname(value);
        let new_nickname = value;

        if (result.status) {
            if (game.socket) {
                // TODO: open Profile modal
                game.storage['new_nickname'] = new_nickname;
                game.socket.emit('nickname', {
                    nickname: new_nickname
                });
            } else {
                fetch(authServer + '/validate?nickname=' + new_nickname).then((response) => {
                    if (!response.ok) {
                        return;
                    }
                    return response.json();
                }).then((json) => {
                    if (this.editEvent != editEvent) {
                        return;
                    }

                    showOrHideTip(!json.status, document.querySelector('#nickname').nextElementSibling, json.code);

                    if (json.status) {
                        game.storage['new_nickname'] = new_nickname;
                        document.querySelector('.gear-option').classList.remove('hidden');
                        document.querySelector('.save').classList.add('hidden');
                        document.querySelector('.cancel').classList.add('hidden');

                        if (editMode) {
                            document.querySelector('#nickname').setAttribute('disabled', true);
                            document.querySelector('#nickname').classList.add('center');
                            document.querySelector('#nickname').blur();
                        }
                    }
                });
            }
        } else {
            showOrHideTip(!result.status, document.querySelector('#nickname').nextElementSibling, result.code);
            log(`${result.msg}`);
        }
    }

    function setEditMode() {
        this.editEvent = (this.editEvent || 0) + 1;

        document.querySelector('#nickname').removeAttribute('disabled');
        document.querySelector('#nickname').classList.remove('center');
        document.querySelector('#nickname').select();
        document.querySelector('#nickname').focus();
        document.querySelector('.gear-option').classList.add('hidden');
        document.querySelector('.save').classList.remove('hidden');
        document.querySelector('.cancel').classList.remove('hidden');
    }

    function cancelEditMode() {
        document.querySelector('#nickname').value = game.storage['new_nickname'] || game.nickname;
        document.querySelector('#nickname').setAttribute('disabled', true);
        document.querySelector('#nickname').classList.add('center');
        document.querySelector('#nickname').blur();
        document.querySelector('.gear-option').classList.remove('hidden');
        document.querySelector('.save').classList.add('hidden');
        document.querySelector('.cancel').classList.add('hidden');
        showOrHideTip(false, document.querySelector('#nickname').nextElementSibling, 0);
    }

    function validateNickname(str) {
        let result = {
            status: true,
            code: 0,
            msg: "OK"
        };
        str = str.trim();
        let legalChars = /^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|null|this|true|void|with|await|break|catch|class|const|false|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)(?:[\$0-9A-Z_a-z\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF])*$/;
        if (str == "") {
            result = {
                status: false,
                code: 1
            };
        } else if ((str.length < 5) || (str.length > 15)) {
            result = {
                status: false,
                code: 2
            };
        } else if (!legalChars.test(str)) {
            result = {
                status: false,
                code: 3
            };
        }
        return result;
    }

    document.addEventListener("DOMContentLoaded", (event) => {
        document.title = chrome.i18n.getMessage('appName');
        let need_localize = document.querySelectorAll("[l_content]");
        for (let i = 0, nllen = need_localize.length; i < nllen; i++) {
            let l_contents = need_localize[i].getAttribute("l_content").split(",");
            let l_attrs = need_localize[i].getAttribute("l_attr");
            l_attrs && (l_attrs = l_attrs.split(","));
            for (let k = 0, lclen = l_contents.length; k < lclen; k++) {
                let content = chrome.i18n.getMessage(l_contents[k]);
                if (l_attrs && k < l_attrs.length) {
                    need_localize[i].setAttribute(l_attrs[k], content);
                } else {
                    need_localize[i].textContent = content;
                }
            }
        }
    });
    document.querySelectorAll('.single_play, .ranked_play, .solo_play, .unranked_play').forEach((elem) => {
        elem.addEventListener('focus', (e) => {
            if (!document.querySelector('#nickname').hasAttribute('disabled')) {
                e.stopImmediatePropagation();
            }
        });
        elem.addEventListener('click', (e) => {
            if (!document.querySelector('#nickname').hasAttribute('disabled')) {
                e.stopImmediatePropagation();
            }
        });
    });

    const game = new GameManager();

    const singleGame = SingleGame(game);

    /* UI Test */

    function replaceSVGImagesByInlineSVG(callback) {
        var svg_images = document.querySelectorAll('img:not(.ignore_replace)[src$=".svg"]');
        var counter = svg_images.length;
        svg_images.forEach(function (element) {
            var imgID = element.getAttribute('id');
            var imgClass = element.getAttribute('class');
            var imgURL = element.getAttribute('src');

            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                var svg = xhr.responseXML.getElementsByTagName('svg')[0];

                imgID && svg.setAttribute('id', imgID);
                imgClass && svg.setAttribute('class', imgClass + ' replaced-svg');

                svg.removeAttribute('xmlns:a');

                if (!svg.hasAttribute('viewBox') && svg.hasAttribute('height') && svg.hasAttribute('width')) {
                    svg.setAttribute('viewBox', '0 0 ' + svg.getAttribute('height') + ' ' + svg.getAttribute('width'));
                }
                element.parentElement.replaceChild(svg, element);
                counter--;
                if (counter <= 0) {
                    callback && callback();
                }
            }
            xhr.open('GET', imgURL, true);
            xhr.send(null);
        });
    }
    replaceSVGImagesByInlineSVG(function () {

        document.querySelector('.rules_button').addEventListener('click', (e) => {
            game.changeScreen(SCREEN.GAME_RULES);
        });
        document.querySelector('.arrow-back').addEventListener('click', (e) => {
            if (game.currentScreen !== SCREEN.SHOP_INIT && game.currentScreen !== SCREEN.PROFILE_INIT) {
                game.screenPool.pop();
            }
            delete game.storage['on_reload_settings_socket']
            game.changeScreen(game.screenPool.pop());
        });
        document.querySelectorAll('.close-btn').forEach((elem) => {
            elem.addEventListener('click', (e) => {
                if (game.currentModal != MODAL.NONE) {
                    if (game.currentModal === MODAL.SHOP && game.currentScreen === SCREEN.SINGLE) {
                        singleGame.unblock();
                    }
                    game.changeModal(MODAL.NONE);
                    return;
                }
                if (game.currentScreen === SCREEN.MATCHHISTORY) {
                    game.changeScreen(game.screenPool.pop());
                } else if (game.currentScreen === SCREEN.SPEEDRUNBEST) {
                    game.changeScreen(game.screenPool.pop());
                    game.setHint({
                        msg: chrome.i18n.getMessage('tlog_try_to_win'),
                        type: 'normal'
                    });
                } else if (game.currentScreen === SCREEN.BR_SEARCH) {
                    game.socket.emit('brmm_cancel');
                    game.changeScreen(game.screenPool.pop());
                }
            });
        });
        document.querySelector('#cancel').addEventListener('click', (e) => {
            game.socket.emit('search_cancel');
            if (game.pmm_attempts_timer) {
                game.pmm_attempts = 0;
                clearTimeout(game.pmm_attempts_timer);
            }
        });
        document.querySelector('#cancel_ready').addEventListener('click', (e) => {
            game.socket.emit('ready', {
                status: false
            });
        });
        document.querySelectorAll('#signout, .store-container .signout-btn').forEach((elem) => {
            elem.addEventListener('click', (e) => {
                Auth.logout().then(() => {
                    document.location.reload();
                });
            });
        });
        document.querySelectorAll('#ladderboard, #mltpl_ladders').forEach((elem) => {
            elem.addEventListener('click', (e) => {
                if (e.currentTarget.classList.contains('selected')) {
                    return;
                }
                game.showMultiLadders('top100');
            });
        });
        document.querySelector('#single_ladders').addEventListener('click', (e) => {
            if (e.currentTarget.classList.contains('selected')) {
                return;
            }
            game.showSingleLadders();
        });
        document.querySelectorAll('#google_sign_in, #header_signin, #content_signin, #leaderboard_signin').forEach((elem) => {
            elem.addEventListener('click', (e) => {
                chrome.permissions.request({
                    permissions: isIdentityUnavailable ? [] : [
                        "identity",
                        "identity.email"
                    ],
                    origins: [
                        "*://*.apihub.info/*",
                        "*://share2048.browser-games.xyz/*"
                    ]
                }, function (granted) {
                    if (granted) {
                        Auth.login().then((ok) => {
                            if (ok) {
                                location.reload();
                            }
                        });
                    }
                });
            });
        });
        document.querySelectorAll('#stop_run').forEach((elem) => {
            elem.addEventListener('click', (e) => {
                if (game.match) {
                    if (game.match.firstMove) {
                        game.match.out_of_moves = true;
                        game.match.actuate();
                    } else {
                        game.changeScreen(SCREEN.SPEEDRUNBEST);
                    }
                }
            });
        })
        document.querySelectorAll('#best_run').forEach((elem) => {
            elem.addEventListener('click', (e) => {
                game.changeScreen(SCREEN.SPEEDRUNBEST);
            });
        });
        document.querySelector('.info_match_history').addEventListener('click', (e) => {
            game.changeScreen(SCREEN.MATCHHISTORY);
        });
        document.querySelector('.profile-option').addEventListener('click', (e) => {
            game.init_socket({ elSelectorClick: '.profile-option' }, () => {
                // TODO: open Profile modal
                game.showProfile(game.id);
            });
        });
        document.querySelector('.gear-option').addEventListener('click', (e) => {
            setEditMode();
        });
        document.querySelector('.save').addEventListener('click', (e) => {
            var value = document.querySelector('#nickname').value;
            saveNickname(value, true);
        });
        document.querySelector('.cancel').addEventListener('click', (e) => {
            cancelEditMode();
        });
        document.querySelector('.tab-bronze').addEventListener('click', (e) => {
            game.showMultiLadders('bronze');
        });
        document.querySelector('.tab-silver').addEventListener('click', (e) => {
            game.showMultiLadders('silver');
        });
        document.querySelector('.tab-gold').addEventListener('click', (e) => {
            game.showMultiLadders('gold');
        });
        document.querySelector('.tab-top100').addEventListener('click', (e) => {
            game.showMultiLadders('top100');
        });
        document.querySelector('.single_play').addEventListener('click', (e) => {
            game.changeScreen(SCREEN.SINGLE);
        });
        document.querySelector('.ranked_play').addEventListener('click', (e) => {
            game.init_socket({ elSelectorClick: '.ranked_play' }, () => {
                let result = validateNickname(document.querySelector('#nickname').value);
                if (result.status) {
                    game.nickname = document.querySelector('#nickname').value;
                    game.changeScreen(SCREEN.RMM_LOBBY);
                } else {
                    log(`${result.msg}`);
                    try {
                        showOrHideTip(true, document.querySelector('#nickname').nextElementSibling, result.code);
                    } catch (e) { }
                }
            });
        });
        document.querySelector('.solo_play').addEventListener('click', (e) => {
            game.changeScreen(SCREEN.SOLO);
        });
        document.querySelector('.unranked_play').addEventListener('click', (e) => {
            game.init_socket({ elSelectorClick: '.unranked_play' }, () => {
                let result = validateNickname(document.querySelector('#nickname').value);
                if (result.status) {
                    game.nickname = document.querySelector('#nickname').value;
                    game.changeScreen(SCREEN.PMM_LOBBY);
                } else {
                    log(`${result.msg}`);
                    try {
                        showOrHideTip(true, document.querySelector('#nickname').nextElementSibling, result.code);
                    } catch (e) { }
                }
            });
        });
        document.querySelector('.battle_royal').addEventListener('click', (e) => {
            if (game.currentMM === 3) {
                game.hideMatchMakingPopup();
            }
            else {
                game.cancelMatchMakingPopup();
            }
            game.socket.emit('brmm');
        });
        document.querySelector('.duel').addEventListener('click', (e) => {
            if (game.currentMM === 1) {
                game.hideMatchMakingPopup();
            }
            else {
                game.cancelMatchMakingPopup();
            }
            game.socket.emit('rmm');
            game.changeScreen(SCREEN.RMM_SEARCH);
            document.querySelector('.loading_text').textContent = chrome.i18n.getMessage('please_wait');
        });
        document.querySelector('.menu-button').addEventListener('click', (e) => {
            delete game.storage['on_reload_settings_socket'];
            singleGame.block();
            game.changeScreen(SCREEN.MENU);
        });
        document.querySelector('.restart_button').addEventListener('click', (e) => {
            if (game.match) {
                game.match.eraseGame();
                game.destroyMatch();
                game.createSoloMatch();
            }
        });
        document.querySelector('.host').addEventListener('click', (e) => {
            game.changeScreen(SCREEN.PMM_HOST);
            document.querySelector('#hlobby_name').focus();
        });
        document.querySelector('.join').addEventListener('click', (e) => {
            game.changeScreen(SCREEN.PMM_JOIN);
            document.querySelector('#jlobby_name').focus();
        });
        document.querySelector('.copy').addEventListener('click', (e) => {
            document.querySelector('.lobby_name_value').select();
            document.execCommand("copy");
        });
        document.querySelector('.copy_lobby').addEventListener('click', (e) => {
            document.querySelector('.lobby').select();
            document.execCommand("copy");
        });
        document.querySelector('#ready_accept').addEventListener('click', (e) => {
            if (!game.ready) {
                game.socket.emit('ready', {
                    status: true
                });
            }
        });
        document.querySelectorAll('#menu').forEach((elem) => {
            elem.addEventListener('click', (e) => {
                if (game.screenPool[game.screenPool.length - 1] === SCREEN.GAMEOVERBR) {
                    game.socket.emit('brmm_leave');
                }
                game.destroyMatch(false, function () {
                    game.changeScreen(SCREEN.MENU);
                });
            });
        });
        document.querySelectorAll('#again').forEach((elem) => {
            elem.addEventListener('click', (e) => {
                switch (game.prevMatch) {
                    case 1:
                        // Rating Duel
                        game.screenPool.pop();
                        game.socket.emit('rmm');
                        game.changeScreen(SCREEN.RMM_SEARCH);
                        document.querySelector('.loading_text').textContent = chrome.i18n.getMessage('please_wait');
                        break;
                    case 2:
                        // Private Duel Host
                        game.screenPool.pop();
                        game.socket.emit('pmm_host', {
                            matchName: document.querySelector('#hlobby_name').value
                        });
                        break;
                    case 4:
                        // Private Duel Join
                        game.screenPool.pop();
                        game.pmm_attempts = 0;
                        game.socket.emit('pmm_join', document.querySelector('#jlobby_name').value);
                        game.changeScreen(SCREEN.PMM_JOIN_LOBBY, {
                            lobby: {
                                name: document.querySelector('#jlobby_name').value
                            }
                        })
                        document.querySelector('.loading_text').textContent = chrome.i18n.getMessage('please_wait');
                        break;
                    case 3:
                        // Battle Royale
                        game.setHint({
                            msg: '',
                            type: 'normal'
                        });
                        game.screenPool.pop();
                        game.socket.emit('brmm_leave');
                        game.destroyMatch();
                        for (let i = 0; i < 10; i++) {
                            document.querySelector(`.brp_${i + 1}`).className = `brp_${i + 1}`;
                            document.querySelector(`.brp_${i + 1}`).dataset.brpid = "";
                        }
                        document.querySelector(`.br_players`).className = `br_players`;
                        game.socket.emit('brmm');
                        break;
                    case 5:
                        // Speedrun
                        game.screenPool.pop();
                        game.screenPool.pop();
                        game.changeScreen(SCREEN.SOLO);
                        break;
                    case 0:
                    default:
                        log(`again failed`);
                        game.destroyMatch();
                        game.changeScreen(SCREEN.MENU);
                        break;
                }
            });
        });
        document.querySelector('#share').addEventListener('click', (e) => {
            game.shareDialog.show(SCREEN.GAMEOVER);
        });
        document.querySelector('.league_skip').addEventListener('click', (e) => {
            game.changeScreen(game.screenPool.pop());
        });
        document.querySelector('.league_share').addEventListener('click', (e) => {
            game.shareDialog.show(SCREEN.LEAGUEUPDATE);
        });

        document.querySelector('#continue').addEventListener('click', (e) => {
            game.changeScreen(SCREEN.INGAME);
        });
        document.querySelector('#surrender').addEventListener('click', (e) => {
            game.socket.emit('surrender');
        });
        document.querySelector('#continue_br').addEventListener('click', (e) => {
            document.querySelector('.modal_surrender_br').classList.toggle('show', false);
        });
        document.querySelector('#surrender_br').addEventListener('click', (e) => {
            document.querySelector('.modal_surrender_br').classList.toggle('show', false);
            game.socket.emit('brmm_surrender');
        });
        document.querySelector('.create_game').addEventListener('click', (e) => {
            if (document.querySelector('#hlobby_name').value) {
                game.cancelMatchMakingPopup();
                game.socket.emit('pmm_host', {
                    matchName: document.querySelector('#hlobby_name').value
                });
            }
        });
        document.querySelector('.join_game').addEventListener('click', (e) => {
            if (document.querySelector('#jlobby_name').value) {
                game.cancelMatchMakingPopup();
                game.pmm_attempts = 0;
                game.socket.emit('pmm_join', document.querySelector('#jlobby_name').value);
                game.changeScreen(SCREEN.PMM_JOIN_LOBBY, {
                    lobby: {
                        name: document.querySelector('#jlobby_name').value
                    }
                })
                document.querySelector('.loading_text').textContent = chrome.i18n.getMessage('please_wait');
            }
        });
        document.querySelector('.endgame_your_name').addEventListener('click', function (e) {
            game.showProfile(parseInt(this.dataset.profile));
        });
        document.querySelector('.endgame_opponent_name').addEventListener('click', function (e) {
            game.showProfile(parseInt(this.dataset.profile));
        });
        document.querySelector('.above-game .your_name').addEventListener('click', function (e) {
            if (game.currentScreen !== SCREEN.INGAME) {
                game.showProfile(parseInt(this.dataset.profile));
            }
        });
        document.querySelector('.above-game .opponent_name').addEventListener('click', function (e) {
            if (game.currentScreen !== SCREEN.INGAME) {
                game.showProfile(parseInt(this.dataset.profile));
            }
        });
        document.onkeyup = (e) => {
            if (!game || game.AftergameModuleInstance.isActive()) {
                return false;
            }
            switch (game.currentModal) {
                case MODAL.NONE:
                    break;
                case MODAL.SHOP:
                    if (e.which === 27) {
                        // Escape
                        game.changeModal(MODAL.NONE);
                        if (game.currentScreen === SCREEN.SINGLE) {
                            singleGame.unblock();
                        }
                    }
                    return;
            }
            switch (game.currentScreen) {
                case SCREEN.SIGNIN:
                    if (e.which === 27) {
                        // Escape
                        delete game.storage['on_reload_settings_socket']
                        game.screenPool.pop()
                        game.changeScreen(game.screenPool.pop());
                    } else if (e.which === 13) {
                        // Enter
                        Auth.login().then(() => {
                            game.socket.emit('signin');
                        });
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.MENU:
                case SCREEN.MENU_LOGGED:
                    const nicknameInput = document.querySelector('#nickname');
                    if (!nicknameInput.hasAttribute('disabled')) {
                        if (e.which === 13) {
                            saveNickname(nicknameInput.value, true);
                        }
                        if (e.which === 27) {
                            cancelEditMode();
                        }
                        return
                    }
                    if (e.which === 27) {
                        // Escape
                        return false;
                    } else if (e.which === 13) {
                        // Enter
                        game.menu.focusedButton.click();
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    } else if (e.which == 38 || e.which == 40) {
                        // Arrows Up/Down
                        if (e.which == 38) game.menu.up();
                        if (e.which == 40) game.menu.down();
                    }
                    break;
                case SCREEN.GAME_RULES:
                    if (e.which === 27) {
                        // Escape
                        game.screenPool.pop()
                        game.changeScreen(game.screenPool.pop());
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.PROFILE:
                    if (e.which === 27) {
                        // Escape
                        game.screenPool.pop()
                        game.changeScreen(game.screenPool.pop());
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.PROFILE_INIT:
                    if (e.which === 27) {
                        // Escape
                        game.changeScreen(game.screenPool.pop());
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.SINGLE_LADDER:
                case SCREEN.ONLY_SINGLE_LADDER:
                case SCREEN.LADDERBOARD:
                    if (e.which === 27) {
                        // Escape
                        game.screenPool.pop()
                        game.changeScreen(game.screenPool.pop());
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.RMM_SEARCH:
                    if (e.which === 27) {
                        // Escape
                        game.socket.emit('search_cancel');
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.RMM_LOBBY:
                    if (e.which === 27) {
                        // Escape
                        game.screenPool.pop()
                        game.changeScreen(game.screenPool.pop());
                    } else if (e.which === 13) {
                        // Enter
                        game.menuRMM.focusedButton.click();
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    } else if (e.which == 38 || e.which == 40) {
                        // Arrows Up/Down
                        if (e.which == 38) game.menuRMM.up();
                        if (e.which == 40) game.menuRMM.down();
                    }
                    break;
                case SCREEN.PMM_LOBBY:
                    if (e.which === 27) {
                        // Escape
                        game.screenPool.pop()
                        game.changeScreen(game.screenPool.pop());
                    } else if (e.which === 13) {
                        // Enter
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.PMM_HOST:
                    if (e.which === 27) {
                        // Escape
                        game.screenPool.pop()
                        game.changeScreen(game.screenPool.pop());
                    } else if (e.which === 13) {
                        // Enter
                        if (document.querySelector('#hlobby_name').value) {
                            game.socket.emit('pmm_host', {
                                matchName: document.querySelector('#hlobby_name').value
                            });
                        }
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.PMM_HOST_WAIT:
                    if (e.which === 27) {
                        // Escape
                        game.socket.emit('search_cancel');
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.PMM_JOIN:
                    if (e.which === 27) {
                        // Escape
                        game.screenPool.pop()
                        game.changeScreen(game.screenPool.pop());
                    } else if (e.which === 13) {
                        // Enter
                        if (document.querySelector('#jlobby_name').value) {
                            game.pmm_attempts = 0;
                            game.socket.emit('pmm_join', document.querySelector('#jlobby_name').value);
                            game.changeScreen(SCREEN.PMM_JOIN_LOBBY, {
                                lobby: {
                                    name: document.querySelector('#jlobby_name').value
                                }
                            })
                            document.querySelector('.loading_text').textContent = chrome.i18n.getMessage('please_wait');
                        }
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.PMM_JOIN_LOBBY:
                    if (e.which === 27) {
                        // Escape
                        return false;
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.READY_CHECK:
                    if (e.which === 27) {
                        // Escape
                        game.socket.emit('ready', {
                            status: false
                        });
                    } else if (e.which === 13) {
                        // Enter
                        if (!game.ready) {
                            game.socket.emit('ready', {
                                status: true
                            });
                        }
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.READY:
                    if (e.which === 27) {
                        // Escape
                        return false;
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.READY_COUNTDOWN_RMM:
                    if (e.which === 27) {
                        // Escape
                        return false;
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.GAMEOVER:
                    if (game.shareDialog.visible) {
                        if (e.which === 27) {
                            game.shareDialog.hide();
                        }
                        if (e.which === 13) {
                            // assumed: always multiplayer mode (not solo)
                            game.shareDialog.menu.focusedButton.click();
                        }
                        if (e.which == 38 || e.which == 40) {
                            // Arrows Up/Down
                            if (e.which == 38) game.shareDialog.menu.up();
                            if (e.which == 40) game.shareDialog.menu.down();
                        }
                        return;
                    }
                    if (e.which === 27) {
                        // Escape
                        game.changeScreen(SCREEN.MENU);
                    } else if (e.which === 13) {
                        // Enter
                        if (game.currentScreen === SCREEN.GAMEOVERBR) {
                            game.setHint({
                                msg: '',
                                type: 'normal'
                            });
                            game.screenPool.pop();
                            game.socket.emit('brmm_leave');
                            game.destroyMatch();
                            for (let i = 0; i < 10; i++) {
                                document.querySelector(`.brp_${i + 1}`).className = `brp_${i + 1}`;
                                document.querySelector(`.brp_${i + 1}`).dataset.brpid = "";
                            }
                            document.querySelector(`.br_players`).className = `br_players`;
                            game.socket.emit('brmm');
                        } else {
                            if (game.screenPool.length > 2) {
                                switch (game.screenPool[game.screenPool.length - 2]) {
                                    case SCREEN.RMM_LOBBY:
                                        game.screenPool.pop();
                                        game.socket.emit('rmm');
                                        game.changeScreen(SCREEN.RMM_SEARCH);
                                        document.querySelector('.loading_text').textContent = chrome.i18n.getMessage('please_wait');
                                        break;
                                    case SCREEN.PMM_HOST:
                                        game.screenPool.pop();
                                        game.socket.emit('pmm_host', {
                                            matchName: document.querySelector('#hlobby_name').value
                                        });
                                        break;
                                    case SCREEN.PMM_JOIN:
                                        game.screenPool.pop();
                                        game.pmm_attempts = 0;
                                        game.socket.emit('pmm_join', document.querySelector('#jlobby_name').value);
                                        game.changeScreen(SCREEN.PMM_JOIN_LOBBY, {
                                            lobby: {
                                                name: document.querySelector('#jlobby_name').value
                                            }
                                        })
                                        document.querySelector('.loading_text').textContent = chrome.i18n.getMessage('please_wait');
                                        break;
                                    case SCREEN.SOLO:
                                        game.screenPool.pop();
                                        game.createSoloMatch();
                                        break;
                                    default:
                                        log(`again`);
                                        break;
                                }
                            } else {
                                if (game.screenPool[game.screenPool.length - 1] === SCREEN.GAMEOVERBR) {
                                    game.socket.emit('brmm_leave');
                                }
                                game.destroyMatch();
                                game.changeScreen(SCREEN.MENU);
                            }
                        }
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.GAMEOVERBR:
                    if (e.which === 27) {
                        // Escape
                        game.socket.emit('brmm_leave');
                        game.destroyMatch();
                        game.changeScreen(SCREEN.MENU);
                    } else if (e.which === 13) {
                        // Enter
                        game.socket.emit('brmm_leave');
                        game.destroyMatch();
                        game.screenPool.pop();
                        for (let i = 0; i < 10; i++) {
                            document.querySelector(`.brp_${i + 1}`).className = `brp_${i + 1}`;
                            document.querySelector(`.brp_${i + 1}`).dataset.brpid = "";
                        }
                        document.querySelector(`.br_players`).className = `br_players`;
                        game.socket.emit('brmm');
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.LEAGUEUPDATE:
                    if (game.shareDialog.visible) {
                        if (e.which === 27) {
                            game.shareDialog.hide();
                        }
                        if (e.which === 13) {
                            game.shareDialog.menu.focusedButton.click();
                        }
                        if (e.which == 38 || e.which == 40) {
                            // Arrows Up/Down
                            if (e.which == 38) game.shareDialog.menu.up();
                            if (e.which == 40) game.shareDialog.menu.down();
                        }
                        return;
                    }
                    if (e.which === 27) {
                        // Escape
                        game.changeScreen(game.screenPool.pop());
                    } else if (e.which === 13) {
                        // Enter
                        game.changeScreen(game.screenPool.pop());
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.INGAME:
                    if (e.which === 27) {
                        // Escape
                        game.changeScreen(SCREEN.SURRENDER);
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.BATTLEROYALE:
                    if (e.which === 27) {
                        // Escape
                        document.querySelector('.modal_surrender_br').classList.toggle('show', true);
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.BR_SEARCH:
                    if (e.which === 27) {
                        game.socket.emit('brmm_cancel');
                        game.changeScreen(game.screenPool.pop());
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.SOLO:
                    if (e.which === 27) {
                        // Escape
                        game.destroyMatch(false, function () {
                            game.changeScreen(SCREEN.MENU);
                        });
                    }
                    break;
                case SCREEN.SINGLE:
                    if (e.which === 27) {
                        // Escape
                        singleGame.block();
                        game.changeScreen(SCREEN.MENU);
                    }
                    break;
                case SCREEN.SURRENDER:
                    if (e.which === 27) {
                        // Escape
                        return false;
                    } else if (e.which === 13) {
                        // Enter
                        game.changeScreen(SCREEN.INGAME);
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.MATCHHISTORY:
                    if (e.which === 27) {
                        // Escape
                        game.changeScreen(game.screenPool.pop());
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.SPEEDRUNBEST:
                    if (e.which === 27) {
                        // Escape
                        game.changeScreen(game.screenPool.pop());
                        game.setHint({
                            msg: chrome.i18n.getMessage('tlog_try_to_win'),
                            type: 'normal'
                        });
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.SHOP:
                    if (e.which === 27) {
                        // Escape
                        game.screenPool.pop();
                        game.changeScreen(game.screenPool.pop());
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.SHOP_INIT:
                    if (e.which === 27) {
                        // Escape
                        game.changeScreen(game.screenPool.pop());
                    } else if (e.which === 13) {
                        // Enter
                        return false;
                    } else if (e.which === 9) {
                        // Tab
                        return false;
                    }
                    break;
                case SCREEN.PRELOAD:
                case SCREEN.DISCONNECTED:
                default:
                    break;
            }
        };

        document.querySelector('.endgame_messaging').addEventListener('click', (e) => {
            let _this = e.target;
            if (_this.classList.contains('smile')) {
                if (!_this.classList.contains('blocked')) {
                    let smile_id = _this.getAttribute('smile_id');
                    game.socket.emit('smile', {
                        id: smile_id
                    });
                    game.showSmile(smile_id, false);
                }
                else {
                    let smile_id = _this.getAttribute('smile_id');
                    // TODO: product id from smiles []
                    game.showShop({
                        product: game.smiles[smile_id].product_id
                    });
                }
            } else if (_this.classList.contains('review_btn') && !_this.classList.contains('used') && !_this.classList.contains('disabled')) {
                game.socket.emit('user_review', {
                    value: _this.getAttribute('value'),
                    id: game.opponent.id
                });
                _this.classList.add('used');
                if (_this.getAttribute('value') === 'like') {
                    document.querySelector('.review_btn[value="dislike"]').classList.add('disabled');
                } else {
                    document.querySelector('.review_btn[value="like"]').classList.add('disabled');
                }
            }
        });
        document.querySelector('.currency_control').addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn')) {
                return;
            }

            let par = document.querySelector('.currency_control ul');
            let curr_selctd = par.querySelector('.selected') || par.firstElementChild;
            let next_selctd;
            if (e.target.classList.contains('left_btn')) {
                if (curr_selctd == par.firstElementChild) {
                    next_selctd = par.lastElementChild;
                } else {
                    next_selctd = curr_selctd.previousElementSibling;
                }
            } else {
                if (curr_selctd == par.lastElementChild) {
                    next_selctd = par.firstElementChild;
                } else {
                    next_selctd = curr_selctd.nextElementSibling;
                }
            }
            curr_selctd.classList.remove('selected');
            next_selctd.classList.add('selected');
            window.localStorage['currency'] = next_selctd.getAttribute('value');
            par.style.left = (par.getBoundingClientRect().left - next_selctd.getBoundingClientRect().left) + 'px';
        });
        document.querySelector('#eye_btn').addEventListener('click', (e) => {

        });
        document.querySelectorAll('#shop_btn, #night_mode_promo .store-btn').forEach((el) => {
            el.addEventListener('click', (e) => {
                game.changeModal(MODAL.NONE);
                if (Auth.logged_as) {
                    game.showModalShop();
                } else {
                    game.init_socket({ elSelectorClick: '#shop_btn' }, () => {
                        if (game.currentScreen == SCREEN.SIMPLE_LOADING) {
                            game.changeScreen(game.screenPool.pop());
                        }
                        game.showModalShop();
                    });
                }
            });
        });
        document.querySelectorAll('.product_promo .buy_btn').forEach((elem) => {
            elem.addEventListener('click', (e) => {
                game.screenPool.pop();
                game.showShop({});
            });
        });
        document.querySelectorAll('.close_shop_btn').forEach((el) => {
            el.addEventListener('click', (e) => {
                game.screenPool.pop();
                game.changeScreen(game.screenPool.pop());
            });
        });
        document.querySelector('#night_mode_checkbox').addEventListener('click', (e) => {
            game.toggleNightMode();
        });
        document.querySelector('.endgame_result_table').addEventListener('click', (e) => {
            document.querySelector('.modal_gameover').classList.toggle('rt');
        });
        document.querySelector('.close-btn-br').addEventListener('click', (e) => {
            document.querySelector('.modal_gameover').classList.toggle('rt');
        });
        document.querySelector('.ebrmrt-row-1').addEventListener('click', function (e) {
            if (this.dataset.profile) {
                game.showProfile(parseInt(this.dataset.profile))
            }
        });
        document.querySelector('.ebrmrt-row-2').addEventListener('click', function (e) {
            if (this.dataset.profile) {
                game.showProfile(parseInt(this.dataset.profile))
            }
        });
        document.querySelector('.ebrmrt-row-3').addEventListener('click', function (e) {
            if (this.dataset.profile) {
                game.showProfile(parseInt(this.dataset.profile))
            }
        });
        document.querySelector('.ebrmrt-row-4').addEventListener('click', function (e) {
            if (this.dataset.profile) {
                game.showProfile(parseInt(this.dataset.profile))
            }
        });
        document.querySelector('.ebrmrt-row-5').addEventListener('click', function (e) {
            if (this.dataset.profile) {
                game.showProfile(parseInt(this.dataset.profile))
            }
        });
        document.querySelector('.ebrmrt-row-6').addEventListener('click', function (e) {
            if (this.dataset.profile) {
                game.showProfile(parseInt(this.dataset.profile))
            }
        });
        document.querySelector('.ebrmrt-row-7').addEventListener('click', function (e) {
            if (this.dataset.profile) {
                game.showProfile(parseInt(this.dataset.profile))
            }
        });
        document.querySelector('.ebrmrt-row-8').addEventListener('click', function (e) {
            if (this.dataset.profile) {
                game.showProfile(parseInt(this.dataset.profile))
            }
        });
        document.querySelector('.ebrmrt-row-9').addEventListener('click', function (e) {
            if (this.dataset.profile) {
                game.showProfile(parseInt(this.dataset.profile))
            }
        });
        document.querySelector('.ebrmrt-row-10').addEventListener('click', function (e) {
            if (this.dataset.profile) {
                game.showProfile(parseInt(this.dataset.profile))
            }
        });

        /* Dynamic MatchMaking */
        document.querySelector('#rollup_btn1').addEventListener('click', (e) => {
            game.showMatchMakingPopup(1);
            game.screenPool = [SCREEN.MENU];
            game.changeScreen(SCREEN.RMM_LOBBY);
        });
        document.querySelector('#rollup_btn2').addEventListener('click', (e) => {
            game.showMatchMakingPopup(3);
            game.screenPool = [SCREEN.MENU];
            game.changeScreen(SCREEN.RMM_LOBBY);
        });

        document.querySelector('#mm_cancel').addEventListener('click', (e) => {
            game.cancelMatchMakingPopup();
        });
    });

    function getMatrix() {
        let matrix = [[], [], [], []];
        for (let i = 0; i < 4; i++)
            for (let j = 0; j < 4; j++) {
                matrix[i][j] = 0;
                if (game.match?.grid?.cells[i][j]) {
                    matrix[i][j] = game.match.grid.cells[i][j].value;
                }
            }
        for (let i = 0; i < 4; i++)
            for (let j = i + 1; j < 4; j++) {
                let tmp = matrix[j][i];
                matrix[j][i] = matrix[i][j];
                matrix[i][j] = tmp;
            }
        return matrix;
    }

    // Bot
    function move2048(arr, direction, addRandom = true) {
        const result = [];

        // Copy the input arr to the result arr
        for (let i = 0; i < arr.length; i++) {
            result[i] = arr[i].slice();
        }

        // Perform the move
        switch (direction) {
            case 'up':
                for (let j = 0; j < result[0].length; j++) {
                    let i = 0;
                    let k = 0;
                    while (i < result.length && k < result.length) {
                        if (result[k][j] === 0) {
                            k++;
                        } else {
                            if (i !== k) {
                                result[i][j] = result[k][j];
                                result[k][j] = 0;
                            }
                            if (i > 0 && result[i - 1][j] === result[i][j]) {
                                result[i - 1][j] *= 2;
                                result[i][j] = 0;
                            } else {
                                i++;
                            }
                            k++;
                        }
                    }
                }
                break;
            case 'down':
                for (let j = 0; j < result[0].length; j++) {
                    let i = result.length - 1;
                    let k = result.length - 1;
                    while (i >= 0 && k >= 0) {
                        if (result[k][j] === 0) {
                            k--;
                        } else {
                            if (i !== k) {
                                result[i][j] = result[k][j];
                                result[k][j] = 0;
                            }
                            if (i < result.length - 1 && result[i + 1][j] === result[i][j]) {
                                result[i + 1][j] *= 2;
                                result[i][j] = 0;
                            } else {
                                i--;
                            }
                            k--;
                        }
                    }
                }
                break;
            case 'left':
                for (let i = 0; i < result.length; i++) {
                    let j = 0;
                    let k = 0;
                    while (j < result[0].length && k < result[0].length) {
                        if (result[i][k] === 0) {
                            k++;
                        } else {
                            if (j !== k) {
                                result[i][j] = result[i][k];
                                result[i][k] = 0;
                            }
                            if (j > 0 && result[i][j - 1] === result[i][j]) {
                                result[i][j - 1] *= 2;
                                result[i][j] = 0;
                            } else {
                                j++;
                            }
                            k++;
                        }
                    }
                }
                break;
            case 'right':
                for (let i = 0; i < result.length; i++) {
                    let j = result[0].length - 1;
                    let k = result[0].length - 1;
                    while (j >= 0 && k >= 0) {
                        if (result[i][k] === 0) {
                            k--;
                        } else {
                            if (j !== k) {
                                result[i][j] = result[i][k];
                                result[i][k] = 0;
                            }
                            if (j < result[0].length - 1 && result[i][j + 1] === result[i][j]) {
                                result[i][j + 1] *= 2;
                                result[i][j] = 0;
                            } else {
                                j--;
                            }
                            k--;
                        }
                    }
                }
                break;
            default:
                throw new Error('Invalid direction');
        }

        // Generate a random number and place it on the board if the board has changed
        if (!matrixEquals(arr, result) && addRandom) {
            placeRandomNumber(result);
        }

        return result;
    }

    function matrixEquals(matrix1, matrix2) {
        // Check if the matrices are the same size
        if (matrix1.length !== matrix2.length || matrix1[0].length !== matrix2[0].length) {
            return false;
        }

        // Check if the corresponding elements are the same
        for (let i = 0; i < matrix1.length; i++) {
            for (let j = 0; j < matrix1[0].length; j++) {
                if (matrix1[i][j] !== matrix2[i][j]) {
                    return false;
                }
            }
        }

        return true;
    }

    function placeRandomNumber(arr) {
        const emptyTiles = [];

        // Find all the empty tiles
        for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr[0].length; j++) {
                if (arr[i][j] === 0) {
                    emptyTiles.push([i, j]);
                }
            }
        }

        // Choose a random empty tile and place a 2 or 4 on it
        const randomIndex = Math.floor(Math.random() * emptyTiles.length);
        const [i, j] = emptyTiles[randomIndex];
        arr[i][j] = Math.random() < 0.9 ? 2 : 4;
    }

    function getMatrixScore(arr) { // I value corners
        let score = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (arr[i][j]) score += (Math.log2(arr[i][j]) - 1) * arr[i][j];
            }
        }
        return score;
    };

    function getStatusScore(arr) { // I value corners
        let diff = 0;
        let sum = 0;
        let max_tile = getMaxTile(arr);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                sum += arr[i][j];
                if (max_tile < 512) {
                    if (j == 1) diff += Math.abs(arr[i][j] - arr[i][j + 1]);
                }
                else {
                    if (j != 3) diff += Math.abs(arr[i][j] - arr[i][j + 1]);
                }
                if (i != 3) diff += arr[i][j] - arr[i + 1][j];
            }
        }
        return (sum * 4 - diff) * 2;
    };

    function getMaxTile(mat) {
        return Math.max(...mat[0], ...mat[1], ...mat[2], ...mat[3]);
    }

    const MAX_DEPTH = 3;
    let directions = ["up", "right", "down", "left"];

    const func = (arr, depth) => {
        if (depth == MAX_DEPTH) return {
            scr: getStatusScore(arr),
            dir: -1,
        };
        let dir = 0, best = -1e100;
        let max_tile = getMaxTile(arr);
        for (let i = 0; i < 4; i++) {
            if (!i) continue;
            let mat = move2048(arr, directions[i], false);
            if (matrixEquals(arr, mat)) continue;
            let emptyCount = 0, sum = 0;
            for (let j = 0; j < 4; j++)
                for (let k = 0; k < 4; k++) {
                    if (!mat[j][k]) {
                        emptyCount++;
                        mat[j][k] = 2;
                        sum += func(mat, depth + 1).scr * 0.9;
                        mat[j][k] = 4;
                        sum += func(mat, depth + 1).scr * 0.1;
                        mat[j][k] = 0;
                    }
                }
            if (emptyCount) {
                sum /= emptyCount;
            }
            let base = getMatrixScore(mat);
            if (base + sum > best) {
                best = base + sum;
                dir = i;
            }
        }
        return {
            scr: best,
            dir,
        };
    };

    let stopBot = false;

    const runBot = (mode = "single", oneTime = false) => {
        if (stopBot) return;
        let mat = mode == "single" ? singleGame.getMatrix() : getMatrix();
        const dir = func(mat, 0).dir;
        mode == "single" ? singleGame.move(dir) : game.match.move(dir);

        let ts = 70 + (Math.random() - 0.5) * 30;
        let max_tile = Math.max(...mat[0], ...mat[1], ...mat[2], ...mat[3]);
        if (max_tile < 512) ts = 40 + (Math.random() - 0.5) * 20;
        if (max_tile < 256) ts = 30 + (Math.random() - 0.7) * 20;

        let emptyCount = 0;
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (!mat[i][j]) emptyCount++;
        if (emptyCount < 4) ts = 150 + (Math.random() - 0.5) * 200;
        // // if (dir == 0) ts = 500 + Math.floor(Math.random() * 500);

        if (!oneTime) {
            setTimeout(() => {
                runBot(mode);
            }, ts);
        }
    };
    
    document.querySelector('.bot-play').addEventListener('click', (e) => {
        stopBot = false;
        runBot(game.currentScreen == SCREEN.SINGLE ? "single" : "duel");
    });

    document.querySelector('.bot-stop').addEventListener('click', (e) => {
        stopBot = true;
    });

    document.addEventListener("keydown", (event) => {
        // this.emit("onkeydown", event);
        runBot(game.currentScreen == SCREEN.SINGLE ? "single" : "duel", true);
    });

    game.setNightMode(true);
})();
