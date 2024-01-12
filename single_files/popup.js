isFF && document.body.classList.add('firefox');
var paymentSupports = true;
if (!paymentSupports) {window.store = null}

function SingleGame(mainGame) {
if (!mainGame) return;

document.addEventListener("DOMContentLoaded", function(event) {
    var need_localize = document.querySelectorAll("[l_content]");
    for (var i = 0; i < need_localize.length; i++) {
        var l_contents = need_localize[i].getAttribute("l_content").split(",");
        var l_attrs = need_localize[i].getAttribute("l_attr");
        l_attrs && (l_attrs = l_attrs.split(","));
        for (var k = 0; k < l_contents.length; k++) {
            var content = chrome.i18n.getMessage(l_contents[k]);

            if (l_attrs && k < l_attrs.length) {
                need_localize[i].setAttribute(l_attrs[k], content);
            } else {
                need_localize[i].textContent = content;
            }
        }
    }
});

Function.prototype.bind = Function.prototype.bind || function (target) {
  var self = this;
  return function (args) {
    if (!(args instanceof Array)) {
      args = [args];
    }
    self.apply(target, args);
  };
};

////alert("Bind polyfill!");


(function () {
  if (typeof window.Element === "undefined" ||
      "classList" in document.documentElement) {
    return;
  }

  var prototype = Array.prototype,
      push = prototype.push,
      splice = prototype.splice,
      join = prototype.join;

  function DOMTokenList(el) {
    this.el = el;
    // The className needs to be trimmed and split on whitespace
    // to retrieve a list of classes.
    var classes = el.className.replace(/^\s+|\s+$/g, '').split(/\s+/);
    for (var i = 0; i < classes.length; i++) {
      push.call(this, classes[i]);
    }
  }

  DOMTokenList.prototype = {
    add: function (token) {
      if (this.contains(token)) return;
      push.call(this, token);
      this.el.className = this.toString();
    },
    contains: function (token) {
      return this.el.className.indexOf(token) != -1;
    },
    item: function (index) {
      return this[index] || null;
    },
    remove: function (token) {
      if (!this.contains(token)) return;
      for (var i = 0; i < this.length; i++) {
        if (this[i] == token) break;
      }
      splice.call(this, i, 1);
      this.el.className = this.toString();
    },
    toString: function () {
      return join.call(this, ' ');
    },
    toggle: function (token) {
      if (!this.contains(token)) {
        this.add(token);
      } else {
        this.remove(token);
      }

      return this.contains(token);
    }
  };

  window.DOMTokenList = DOMTokenList;

  function defineElementGetter(obj, prop, getter) {
    if (Object.defineProperty) {
      Object.defineProperty(obj, prop, {
        get: getter
      });
    } else {
      obj.__defineGetter__(prop, getter);
    }
  }

  defineElementGetter(HTMLElement.prototype, 'classList', function () {
    return new DOMTokenList(this);
  });
})();

////alert("ClassList polyfill!");


(function () {
  var lastTime = 0;
  var vendors = ['webkit', 'moz'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
      window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function () {
        callback(currTime + timeToCall);
      },
      timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
  }
}());

////alert("Animframe polyfill!");


function KeyboardInputManager() {
  this.events = {};

  if (window.navigator.msPointerEnabled) {
    //Internet Explorer 10 style
    this.eventTouchstart    = "MSPointerDown";
    this.eventTouchmove     = "MSPointerMove";
    this.eventTouchend      = "MSPointerUp";
  } else {
    this.eventTouchstart    = "touchstart";
    this.eventTouchmove     = "touchmove";
    this.eventTouchend      = "touchend";
  }

  this.listen();
}

KeyboardInputManager.keyDownEnabled = true;
KeyboardInputManager.enableKeyDown = function (enable) {
  KeyboardInputManager.keyDownEnabled = enable;
};
KeyboardInputManager.block = function () {
  KeyboardInputManager.keyDownEnabled = false;
};
KeyboardInputManager.unblock = function () {
  KeyboardInputManager.keyDownEnabled = true;
};

KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

KeyboardInputManager.prototype.listen = function () {
  var self = this;

  var map = {
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
    65: 3  // A
  };

  // Respond to direction keys
  document.addEventListener("keydown", function (event) {
    if (!event.isTrusted) {
        return;
    }
    if (!KeyboardInputManager.keyDownEnabled) return;

    if (mainGame.AftergameModuleInstance.isActive()) {
      return;
    }
    
    var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                    event.shiftKey;
    var mapped    = map[event.which];

    if (!modifiers) {
      if (mapped !== undefined) {
        event.preventDefault();
        self.emit("move", mapped);
      }
    }

    // R key restarts the game
    if (!modifiers && event.which === 82) {
      self.restart.call(self, event);
    }
    
    // ctrl+Z - undo last step
    if ((event.ctrlKey || event.metaKey) && event.which === 90 && document.querySelector('.screen').classList.contains('single')) {
      self.undo.call(self, event);
    }

    // Enter works with "retry" window
    var m = document.querySelector(".game-message");
    if (!modifiers && event.which === 13) {
      if (m.classList.contains("game-won")) {
        self.keepPlaying.call(self, event);
      } else if (m.classList.contains("game-over")) {
        self.restart.call(self, event);
      }
    }
  });

  // Respond to button presses
  this.bindButtonPress(".retry-button", this.restart);
  this.bindButtonPress(".restart-button", this.restart);
  this.bindButtonPress(".keep-playing-button", this.keepPlaying);
  this.bindButtonPress(".single-container .best-container", this.scoreClick);
  this.bindButtonPress(".single-container .score-container", this.scoreClick);

  if (paymentSupports) {
    this.bindButtonPress(".undo-button .text", this.undo);
    this.bindButtonPress(".undo-button .count", this.store);
    this.bindButtonPress(".store-button", this.store);
  } else {
    var undo_buttons = document.querySelectorAll(".undo-button");
    for (var i = 0; i < undo_buttons.length; i++) {
      undo_buttons[i].remove();
    }
    document.querySelector(".store-button").remove();
    document.querySelector(".restart-button").classList.add('single');
  }
  
  // Respond to swipe events
  var touchStartClientX, touchStartClientY;
  var gameContainer = document.querySelector(".single-container .game-container");

  gameContainer.addEventListener(this.eventTouchstart, function (event) {
    if (!event.isTrusted) {
        return;
    }
    if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
        event.targetTouches > 1) {
      return; // Ignore if touching with more than 1 finger
    }

    if (window.navigator.msPointerEnabled) {
      touchStartClientX = event.pageX;
      touchStartClientY = event.pageY;
    } else {
      touchStartClientX = event.touches[0].clientX;
      touchStartClientY = event.touches[0].clientY;
    }

    event.preventDefault();
  });

  gameContainer.addEventListener(this.eventTouchmove, function (event) {
    event.preventDefault();
  });

  gameContainer.addEventListener(this.eventTouchend, function (event) {
    if (!event.isTrusted) {
        return;
    }
    if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
        event.targetTouches > 0) {
      return; // Ignore if still touching with one or more fingers
    }

    var touchEndClientX, touchEndClientY;

    if (window.navigator.msPointerEnabled) {
      touchEndClientX = event.pageX;
      touchEndClientY = event.pageY;
    } else {
      touchEndClientX = event.changedTouches[0].clientX;
      touchEndClientY = event.changedTouches[0].clientY;
    }

    var dx = touchEndClientX - touchStartClientX;
    var absDx = Math.abs(dx);

    var dy = touchEndClientY - touchStartClientY;
    var absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 10) {
      // (right : left) : (down : up)
      self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
    }
  });
};

KeyboardInputManager.prototype.restart = function (event) {
  if (!event.isTrusted) {
    return;
  }
  event.preventDefault();
  this.emit("restart");
};

KeyboardInputManager.prototype.undo = function (event) {
  if (!event.isTrusted || !paymentSupports) {
    return;
  }
  event.preventDefault();
  this.emit("undo");
};

KeyboardInputManager.prototype.store = function (event) {
  if (!event.isTrusted || !paymentSupports) {
    return;
  }
  event.preventDefault();
  this.emit("store");
};

KeyboardInputManager.prototype.keepPlaying = function (event) {
  if (!event.isTrusted) {
    return;
  }
  event.preventDefault();
  this.emit("keepPlaying");
};

KeyboardInputManager.prototype.scoreClick = function (event) {
  if (!event.isTrusted) {
    return;
  }
  event.preventDefault();
  this.emit("scoreClick");
};

KeyboardInputManager.prototype.bindButtonPress = function (selector, fn) {
  var buttons = document.querySelectorAll(selector);
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", fn.bind(this));
    buttons[i].addEventListener(this.eventTouchend, fn.bind(this));
  }
};


function HTMLActuator() {
  this.tileContainer    = document.querySelector(".single-container .tile-container");
  this.scoreContainer   = document.querySelector(".single-container .score-container");
  this.bestContainer    = document.querySelector(".single-container .best-container");
  this.messageContainer = document.querySelector(".single-container .game-message");

  this.score = 0;
  
  this.store = window.store ? window.store : null;
}

HTMLActuator.prototype.actuate = function (grid, metadata, lboard) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell, metadata.tileAnimating);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        if (metadata.showBanner) {
          try {mainGame.AftergameModuleInstance.showPopup();} catch(e) {}
        }
        
        Leaderboard.bestLBScore(function(lboard_score) {
          if (metadata.score > lboard_score) {
            lboard.showSuggestion(metadata.scoreObj, false, function(state) {
              if (state !== 'bestscore') {
                metadata.tileAnimating = false;
                self.actuate(grid, metadata, lboard);
              } else {
                self.message(false, metadata.score);
              }
            });
          } else {
            self.message(false, metadata.score); // You lose
          }
        });
      } else if (metadata.won) {
        self.message(true, metadata.score); // You win!
      }
      
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function (lboard) {
  this.clearMessage();
  lboard.hide(true);

};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile, animating) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = animating && tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  inner.textContent = tile.value;

  if (animating) {
    if (tile.previousPosition) {
      // Make sure that the tile gets rendered in the previous position first
      window.requestAnimationFrame(function () {
        classes[2] = self.positionClass({ x: tile.x, y: tile.y });
        self.applyClasses(wrapper, classes); // Update the position
      });
    } else if (tile.mergedFrom) {
      classes.push("tile-merged");
      this.applyClasses(wrapper, classes);

      // Render the tiles that merged
      tile.mergedFrom.forEach(function (merged) {
        self.addTile(merged, animating);
      });
    } else {
      classes.push("tile-new");
      this.applyClasses(wrapper, classes);
      wrapper.addEventListener('animationend', function() {
          this.classList.remove("tile-new");
      });
    }
  } else {
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;
  this.fitText(this.scoreContainer);

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
  this.fitText(this.bestContainer);
};

HTMLActuator.prototype.fitText = function (el) {
  if (!el.max_font_size) {
    el.max_font_size = parseFloat(window.getComputedStyle(el, null).getPropertyValue('font-size'));
  }
  el.style.fontSize = Math.min((el.clientWidth * 0.8 / (el.textContent.length)) * 1.8, el.max_font_size) + 'px';
};

HTMLActuator.prototype.updateUndoButton = function(canUndo) {
  this.store && this.store.updateUndoButton(canUndo);
}

HTMLActuator.prototype.showStore = function() {
  if (this.store) {
    if (Auth.logged_as) {
      KeyboardInputManager.block();
      mainGame.showModalShop();
    } else {
      mainGame.init_socket({elSelectorClick: '.single_play'}, () => {
        mainGame.changeScreen(SCREEN.SINGLE);
        KeyboardInputManager.block();
        mainGame.showModalShop();
      });
    }
  }
}

HTMLActuator.prototype.message = function (won, score) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? chrome.i18n.getMessage("victory") : chrome.i18n.getMessage("game_over");

  this.messageContainer.classList.add(type);

  if (type == 'game-over' && score == 0)
  {
    this.messageContainer.classList.add('hide-undos');
  }

  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
  this.messageContainer.classList.remove("hide-undos");
};


function Grid(size, previousState) {
  this.size = size;
  this.cells = previousState ? this.fromState(previousState) : this.empty();
}

// Build a grid of the specified size
Grid.prototype.empty = function () {
  var cells = [];

  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(null);
    }
  }

  return cells;
};

Grid.prototype.fromState = function (state) {
  var cells = [];

  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      var tile = state[x][y];
      row.push(tile ? new Tile(tile.position, tile.value, tile) : null);
    }
  }

  return cells;
};

// Find the first available random position
Grid.prototype.randomAvailableCell = function () {
  var cells = this.availableCells();

  if (cells.length) {
    return cells[Math.floor(Math.random() * cells.length)];
  }
};

Grid.prototype.availableCells = function () {
  var cells = [];

  this.eachCell(function (x, y, tile) {
    if (!tile) {
      cells.push({ x: x, y: y });
    }
  });

  return cells;
};

// Call callback for every cell
Grid.prototype.eachCell = function (callback) {
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      callback(x, y, this.cells[x][y]);
    }
  }
};

// Check if there are any cells available
Grid.prototype.cellsAvailable = function () {
  return !!this.availableCells().length;
};

// Check if the specified cell is taken
Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  } else {
    return null;
  }
};

// Inserts a tile at its position
Grid.prototype.insertTile = function (tile) {
  this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (tile) {
  this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function (position) {
  return position.x >= 0 && position.x < this.size &&
         position.y >= 0 && position.y < this.size;
};

Grid.prototype.serialize = function () {
  var cellState = [];

  for (var x = 0; x < this.size; x++) {
    var row = cellState[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
    }
  }

  return {
    size: this.size,
    cells: cellState
  };
};


function Tile(position, value, prop = {}) {
  this.x                = position.x;
  this.y                = position.y;
  this.value            = value || 2;

  this.previousPosition = prop.previousPosition || null;
  this.mergedFrom       = prop.mergedFrom || null; // Tracks tiles that merged together
  this.last             = prop.last;
}

Tile.prototype.savePosition = function () {
  this.previousPosition = { x: this.x, y: this.y };
};

Tile.prototype.updatePosition = function (position) {
  this.x = position.x;
  this.y = position.y;
};

Tile.prototype.serialize = function () {
  return {
    position: {
      x: this.x,
      y: this.y
    },
    value: this.value,
    previousPosition: this.previousPosition,
    mergedFrom: this.mergedFrom,
    last: this.last
  };
};

function LocalStorageManager() {
  this.bestScoreKey     = "bestScore";
  this.gameStateKey     = "gameState";
  this.gameStatesStackKey     = "gameStatesStack";

  //alert("Testing localStorage");
  //var supported = this.localStorageSupported();
  ////alert("localStorage is " + supported);
  this.storage = window.ABStorage;// supported ? window.localStorage : window.fakeStorage;
  this.sStorage = window.SyncStorage;
  this.lsStorage = window.LocalBgStorage;
  this.gameStatesStack = [];
  this.stackSize = {
    local: 100,
    sync: 10
  };
  this.retrieveGameStatesStack();
}

LocalStorageManager.prototype.localStorageSupported = function () {
  var testKey = "test";
  var storage = window.localStorage;

  try {
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

// Best score getters/setters
LocalStorageManager.prototype.getBestScore = function (callback) {
//  return this.storage.getItem(this.bestScoreKey) || 0;
  this.sStorage.getItem(this.bestScoreKey, function(val) {
    if (!val) {
      val = this.storage.getItem(this.bestScoreKey) || 0;
      this.sStorage.setItem(this.bestScoreKey, val, function() {
          callback(val);
      }.bind(this));
    } else {
      callback(val);
    }
  }.bind(this));
};

LocalStorageManager.prototype.setLbObject = function (myResult, callback) {
  this.sStorage.setItem('lbInfo', {
      bestScoreObj: myResult
    }, callback);
};

LocalStorageManager.prototype.setBestScore = function (score, callback) {
//  this.storage.setItem(this.bestScoreKey, score);
  this.sStorage.setItem(this.bestScoreKey, score, callback);
};

// Game state getters/setters and clearing
LocalStorageManager.prototype.getGameState = function (callback) {
  this.sStorage.getItem(this.gameStateKey, function(val) {
    if (!val) {
      try {
        var oldValue = this.storage.getItem(this.gameStateKey);
        val = oldValue && JSON.parse(oldValue);
      } catch(e) {}
      this.storage.removeItem(this.gameStateKey);
      this.sStorage.setItem(this.gameStateKey, val, function() {
          callback(val);
      }.bind(this));
    } else {
      callback(val);
    }
  }.bind(this));
};

LocalStorageManager.prototype.setGameState = function (gameState, callback) {
  this.sStorage.setItem(this.gameStateKey, gameState, callback);
};

LocalStorageManager.prototype.retrieveGameStatesStack = function (callback) {
  var self = this;
  self.lsStorage.getItem(self.gameStatesStackKey, function(local_stack = []) {
    self.sStorage.getItem(self.gameStatesStackKey, function(synched_stack = []) {
      if (local_stack.length && synched_stack.length && JSON.stringify(local_stack[local_stack.length - 1]) == JSON.stringify(synched_stack[synched_stack.length - 1])) {
        self.gameStatesStack = local_stack;
      } else {
        self.gameStatesStack = synched_stack;
      }
      callback && callback();
    });
  }, false);
};
LocalStorageManager.prototype.pushGameStatesStack = function (gameState, callback) {
  this.gameStatesStack.push(gameState);
  this.saveGameStatesStack(callback);
};
LocalStorageManager.prototype.saveGameStatesStack = function (callback) {
  var self = this;
  if (this.gameStatesStack.length > this.stackSize.local) {
    this.gameStatesStack.splice(0, this.gameStatesStack.length - this.stackSize.local);
  }
  
  this.lsStorage.setItem(this.gameStatesStackKey, this.gameStatesStack, function() {
    var sync_part = self.gameStatesStack.length > self.stackSize.sync ? self.gameStatesStack.slice(self.gameStatesStack.length - self.stackSize.sync) : self.gameStatesStack;
    self.sStorage.setItem(self.gameStatesStackKey, sync_part, callback);
  }, false);
};

LocalStorageManager.prototype.getPrevGameState = function (callback) {
  if (this.gameStatesStack.length == 0) {
    this.retrieveGameStatesStack(function() {
      var state = this.gameStatesStack.pop();
      this.saveGameStatesStack();
      callback(state);
    }.bind(this));
  } else {
    var state = this.gameStatesStack.pop();
    this.saveGameStatesStack();
    callback(state);
  }
};

LocalStorageManager.prototype.hasSavedState = function (gameState) {
  return this.gameStatesStack.length > 0;
};

LocalStorageManager.prototype.clearGameState = function (callback) {
  this.gameStatesStack = [];
  
  this.lsStorage.removeItem(this.gameStatesStackKey, function() {
    this.sStorage.removeItem(this.gameStateKey, function() {
      this.sStorage.removeItem(this.gameStatesStackKey, callback);
    }.bind(this));
  }.bind(this));
};

LocalStorageManager.prototype.isItFirstLaunch = function () {
    var launched = this.storage.getItem("launched");
    if (launched)
    {
        return false;
    }
    else
    {
        this.storage.setItem("launched", "1");
        return true;
    }
};


function SingleGameManager(size, InputManager, Actuator, StorageManager) {
  this.size           = size; // Size of the grid
  //alert("Making InputManager");
  this.inputManager   = new InputManager;
  //alert("StorageManager");
  this.storageManager = new StorageManager;
  this.store          =  window.store ? window.store : null;
  //alert("Actuator");
  this.actuator       = new Actuator();
  this.leaderboard = new Leaderboard.init(KeyboardInputManager, this.inputManager, mainGame);
  this.startTiles     = 2;
  //alert("Binding Events");
  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("clearTable", this.clearTable.bind(this));
  this.inputManager.on("undo", this.undo.bind(this));
  this.inputManager.on("store", this.showStore.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
  this.inputManager.on("scoreClick", (function() {
    this.leaderboard.showTop();
  }).bind(this));

  //alert("GM starting");
  this.storageManager.retrieveGameStatesStack(function() {
    this.setup();
  }.bind(this));
  
  //alert("GM started");
}

SingleGameManager.prototype.clearMessage = function () {
  this.actuator.clearMessage();
  this.leaderboard.hide(true);
}

SingleGameManager.prototype.createEmptyTable = function () {
  this.grid        = new Grid(this.size);
  this.score       = 0;
  this.over        = false;
  this.won         = false;
  this.keepPlaying = false;
  this.aftergameInited = false;
  this.steps       = 0;
  this.undos       = 0;
  this.direction = undefined;
}

SingleGameManager.prototype.clearTable = function () {
  this.storageManager.clearGameState(function(){
    this.createEmptyTable();
    this.over = true;
    this.actuator.updateUndoButton(false);
  }.bind(this));
};

// Restart the game

SingleGameManager.prototype.actualRestart = function () {
  this.storageManager.clearGameState(function() {
      this.actuator.continueGame(this.leaderboard); // Clear the game won/lost message
      this.setup();
  }.bind(this));
}

SingleGameManager.prototype.restart = function () {
  if (!this.aftergameInited) {
    this.aftergameInited = true;
    this.storageManager.setGameState(this.serialize());
    try {mainGame.AftergameModuleInstance.showPopup(() => {
      this.actualRestart();
    });} catch(e) {}
  }
  else {
    this.actualRestart();
  }
};


SingleGameManager.prototype.checkCanUndo = function (need_load, callback) {
  if (!paymentSupports) {
    callback && callback(false);
    return;
  }
    
  var self = this;

  self.store.getInfo(need_load, false, function(info) {
    var result_can_undo = self.gameStateAvailableUndo() && info && info.product_elements > 0;
    self.actuator.updateUndoButton(result_can_undo);
    callback && callback(result_can_undo, info);
  });
};

// returns true if step can be undo theoretically
SingleGameManager.prototype.gameStateAvailableUndo = function () {
  return this.direction !== undefined && this.storageManager.hasSavedState();
};

// show store
SingleGameManager.prototype.showStore = function () {
	this.actuator.showStore();
};
// undo last move
SingleGameManager.prototype.undo = function () {
  if (this.undo_in_progress) {
    return;
  }
  
  var self = this;
  self.undo_in_progress = true;
  
  this.checkCanUndo(true, function(can_undo, info) {
    if (!can_undo) {
      if (!info || info.product_elements <= 0) {
        self.actuator.showStore();
      }
      self.undo_in_progress = false;
      return;
    }

    self.actuator.updateUndoButton(false);
    self.store.useUndo(function(success) {
      if (!success) {
        self.undo_in_progress = false;
        return;
      }
      self.undos++;
      self.storageManager.getPrevGameState(function(game_state) {
        if (game_state) {
          self.grid = new Grid(game_state.grid.size, game_state.grid.cells);
          var cell, tile;

          self.won = false;
          self.direction = game_state.direction;
          self.score = game_state.score;
          self.steps = game_state.steps;
          var vector     = self.getVector(self.direction);
          var traversals = self.buildTraversals(vector, true);
          var moved      = false;

          // Traverse the grid in the right direction and move tiles
          traversals.x.forEach(function (x) {
            traversals.y.forEach(function (y) {
              cell = { x: x, y: y };
              tile = self.grid.cellContent(cell);

              if (tile) {
                if (tile.last) {
                  self.grid.removeTile(tile);
                  moved = true;
                } else if (tile.mergedFrom) {
                  self.score -= tile.value;

                  var mergedFrom1 = new Tile(tile.mergedFrom[0].previousPosition, tile.value / 2);
                  var mergedFrom2 = new Tile(tile.mergedFrom[1].previousPosition, tile.value / 2);

                  mergedFrom1.previousPosition = cell;
                  mergedFrom2.previousPosition = cell;

                  self.grid.removeTile(tile);
                  self.grid.insertTile(mergedFrom1);
                  self.grid.insertTile(mergedFrom2);
                  moved = true;
                } else if (tile.previousPosition && !self.positionsEqual(cell, tile.previousPosition)) {
                  self.moveTile(tile, tile.previousPosition);
                  tile.previousPosition = cell;
                  moved = true;
                }
              }
            });
          });

          if (moved) {
              self.over = !self.movesAvailable();
              Number.isInteger(self.steps) && self.steps--;
              self.checkCanUndo()
              self.actuate();
              self.actuator.continueGame(self.leaderboard);
          }
        }
        self.undo_in_progress = false;
      });
    });
  });
    
};

// Keep playing after winning (allows going over 2048)
SingleGameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continueGame(this.leaderboard); // Clear the game won/lost message
};

// Return true if the game is lost, or has won and the user hasn't kept playing
SingleGameManager.prototype.isGameTerminated = function () {
  if (this.over || (this.won && !this.keepPlaying)) {
    return true;
  } else {
    return false;
  }
};

// Set up the game
SingleGameManager.prototype.setup = function () {
    this.storageManager.getGameState(function(previousState) {
        //////<div id="start-lesson"></div>
      // Reload the game from a previous game if present
      var animating = true;
      if (previousState) {
        this.grid        = new Grid(previousState.grid.size,
                                    previousState.grid.cells); // Reload grid
        this.score       = previousState.score;
        this.over        = previousState.over;
        this.won         = previousState.won;
        this.keepPlaying = previousState.keepPlaying;
        this.direction   = previousState.direction;
        this.aftergameInited = previousState.aftergameInited;
        this.steps       = Number.isInteger(previousState.steps) ? previousState.steps : null;
        this.undos       = Number.isInteger(previousState.undos) ? previousState.undos : 0;
        animating = false;
      } else {
        this.createEmptyTable();
        
        // Add the initial tiles
        this.addStartTiles();
      }
      
      var lesson = document.getElementById("start-lesson");
      if (this.storageManager.isItFirstLaunch())
      {
        function removeLesson() {
          lesson.remove();
          document.removeEventListener("keydown", removeLesson);
        }
        lesson.style.display = 'block';
        lesson.addEventListener("click", removeLesson);
        document.addEventListener("keydown", removeLesson);
      }
      else 
      {
        lesson && lesson.remove();
      }

      this.checkCanUndo(true);
      this.actuate(animating);

    }.bind(this));
};

// Set up the initial tiles to start the game with
SingleGameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
SingleGameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    var tile = new Tile(this.grid.randomAvailableCell(), value);

    this.grid.insertTile(tile);
    return tile;
  }
};

// Sends the updated grid to the actuator
SingleGameManager.prototype.actuate = function (tileAnimating = true) {
  this.storageManager.getBestScore(function(best_score) {
    if (best_score < this.score) {
      best_score = this.score;
      this.storageManager.setBestScore(best_score);
    }

    let showBanner = false;
    if (this.over && !this.aftergameInited) {
      this.aftergameInited = true;
      showBanner = true;
    }

    this.storageManager.setGameState(this.serialize());

    this.actuator.actuate(this.grid, {
      score: this.score,
      scoreObj: {
          score: this.score,
          steps: this.steps,
          undos: this.undos,
          board: this.grid.serialize()
      },
      over: this.over,
      won: this.won,
      showBanner: showBanner,
      bestScore: best_score,
      terminated: this.isGameTerminated(),
      hasPrevStep: this.storageManager.hasSavedState(),
      tileAnimating: tileAnimating
    }, this.leaderboard);
  }.bind(this));
};

// Represent the current game as an object
SingleGameManager.prototype.serialize = function () {
  return {
    grid: this.grid.serialize(),
    score: this.score,
    over: this.over,
    won: this.won,
    aftergameInited: this.aftergameInited,
    keepPlaying: this.keepPlaying,
    steps: this.steps,
    undos: this.undos,
    direction: this.direction
  };
};

// Save all tile positions and remove merger info
SingleGameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
      delete tile.last;
    }
  });
};

// Move a tile and its representation
SingleGameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
SingleGameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2: down, 3: left
  var self = this;
  self.direction = direction;

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;

          // The mighty 2048 tile
          if (merged.value === 2048) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  if (moved) {
    Number.isInteger(this.steps) && this.steps++;
    this.addRandomTile().last = true;

    if (!this.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.storageManager.pushGameStatesStack(this.serialize());
    this.actuate();
    this.checkCanUndo();
  }
};

// Get the vector representing the chosen direction
SingleGameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // Up
    1: { x: 1,  y: 0 },  // Right
    2: { x: 0,  y: 1 },  // Down
    3: { x: -1, y: 0 }   // Left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
SingleGameManager.prototype.buildTraversals = function (vector, undo) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === (undo ? -1 : 1)) traversals.x = traversals.x.reverse();
  if (vector.y === (undo ? -1 : 1)) traversals.y = traversals.y.reverse();

  return traversals;
};

SingleGameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

SingleGameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
SingleGameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.grid.cellContent(cell);

          if (other && other.value === tile.value) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

SingleGameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};

const updateLocalScore = function (myResult) {
  myResult = myResult ? myResult : {
    score: 0
  };
  const storageManager = new LocalStorageManager;
  storageManager.setLbObject(myResult);
  storageManager.getBestScore(function(best_score) {
    if (myResult.score > best_score)
    {
      storageManager.setBestScore(myResult.score);
    }
  }.bind(this));
};

const getUserScoreAndUpdateLocal = function() {
    const email = Auth.logged_as;
    if (email) {
        lbRequest({method: 'get', top: 0, id: email}, function(res) {
          updateLocalScore(res.myResult);
        });
    }
}

var singleGameManager = false;
chrome.runtime.sendMessage({opening: true});


return {
  show: function() {
    if (!singleGameManager) {
      window.requestAnimationFrame(function () {
        singleGameManager = new SingleGameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
      });
    } else {
      KeyboardInputManager.unblock();
      singleGameManager.clearMessage();
      singleGameManager.actuate(false);
    }
  },
  block: KeyboardInputManager.block,
  unblock: KeyboardInputManager.unblock,
  checkCanUndo: function() {
    singleGameManager && singleGameManager.checkCanUndo();
  },
  getLocalScore: function() {
    return new Promise((resolve, reject) => {
        Leaderboard.bestLBScore(lbscore => {
          resolve(lbscore);
        });
    });
  },
  getUserScoreAndUpdateLocal: getUserScoreAndUpdateLocal,
  updateLocalScore: updateLocalScore,
  move: function(dir) {
    singleGameManager.move(dir);
  },
  getMatrix: function() {
    let matrix = [[], [], [], []];
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        matrix[i][j] = 0;
        if (singleGameManager?.grid?.cells[i][j]) {
          matrix[i][j] = singleGameManager.grid.cells[i][j].value;
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
}

};