/**
 * Module responsible for all the game board logic
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of cols
 * @returns {object} Game board methods
 */
const GameBoard = function (rows=3, cols=3) {
    const board = [];
    function init() {
        // clear any existing contents so init can be called again (reset)
        board.length = 0;
        for (let r = 0; r < rows; r++) {
            board[r] = [];
            for (let c = 0; c < cols; c++) {
                board[r].push(Cell());
            }
        }
    }


    // This will be the method of getting the entire board that our
    // UI will eventually need to render. 
    function getBoard() {
        return board;
    }

    // printing the board to the console for testing purposes
    function printBoard() {
        const boardState = board.map(row => 
            row.map(cell => cell.getValue() === null ? '-' : cell.getValue())
        );
        console.log(boardState);
    }


    init();

    function reset() {
        init();
    }

    return {
        getBoard,
        reset,
        printBoard,
    };
};

/**
 * Module responsible creating game board cells
 * ie cell factory
 * @returns {object} Cell methods
 */
const Cell = function() {
  let value = null;

  const addToken = (playerToken) => {
    value = playerToken;
  }

  const getValue = () => value;

  return {
    addToken,
    getValue,
  }
}

const Player = (name, token, score = 0, isComputer = false)  => {
  return {name, token, score, isComputer};
}


/**
 * Module responsible for the game play logic through accessing
 * the game board
 * @returns {object} Game control methods
 */
const GameController = function () {
  const gameBoard = GameBoard();
  const players = [Player('Player1', 'X'), Player('Player2', 'O')];
  let currentPlayerIndex = 0;
  let isRoundOver = false;
  let isDraw = false;

  function setPlayerNames(player1Name, player2Name) {
    // parse for both when both player names are provided
    if (player1Name && player2Name) {
      // append a number on the player names if they are the same
      if (player1Name === player2Name) {
        players[0].name = player1Name + '1';
        players[1].name = player2Name + '2';
      } else {
        players[0].name = player1Name;
        players[1].name = player2Name;
      }
    } else if(player1Name || player2Name) {
      // only set the provided player name from its default
      if (player1Name) {
        players[0].name = player1Name;
      } else {
        players[1].name = player2Name;
      }
    } else {
      // do nothing
    }
  }

  function getPlayers() {
    return players;
  }

  function getisRoundOver() {
      return isRoundOver;
  }

  function getIsDraw() {
      return isDraw;
  }

  function switchPlayer() {
      currentPlayerIndex = 1 - currentPlayerIndex;
  }

  function getCurrentPlayer() {
      return players[currentPlayerIndex];
  }

  function updateCurrentPlayerScore() {
      players[currentPlayerIndex].score += 1;
  }

  function resetPlayers() {
    players.forEach((player) => {
      player.score = 0;
      player.isComputer = false;
    });
  }

  function juniorComputerMoves(emptyPositions) {
    // generate a random index for empty position 2D arr ie [[r0,c0], [r0,c2], ...]
    const randPos = Math.floor(Math.random() * emptyPositions.length);
    return emptyPositions[randPos]; // row and col 
  }


  // Senior computer: tries to win or block, otherwise random
  function seniorComputerMoves(board, emptyPositions, computerToken, humanToken) {
    // 1. Try winning move
    for (const [r, c] of emptyPositions) {
      board[r][c].temp = computerToken;
      if (checkTempWin(board, computerToken)) {
        board[r][c].temp = null;
        return [r, c];
      }
      board[r][c].temp = null;
    }

    // 2. Block human win
    for (const [r, c] of emptyPositions) {
      board[r][c].temp = humanToken;
      if (checkTempWin(board, humanToken)) {
        board[r][c].temp = null;
        return [r, c];
      }
      board[r][c].temp = null;
    }

    // 3. Otherwise pick random
    return juniorComputerMoves(emptyPositions);
    }

  // Helper: simulate win check on temporary values
  function checkTempWin(board, token) {
    return WINNING_COMBO.some(combo =>
      combo.every(([r, c]) => board[r][c].temp === token || board[r][c].getValue() === token)
    );
  }

  let compPlayerLevel = "junior"; // default

  // Helper: keeps computer level state through closure
  function getCompPlayerLevel() {
    return compPlayerLevel;
  }

  // returns an object for computer difficulty configurations
  function computer() {
    return {
      level: getCompPlayerLevel(),
      play: computerMove,
      setJunior() {compPlayerLevel = "junior"},
      setSenior() {compPlayerLevel = "senior"}
    }
  }

  // timer id used to allow cancelling a scheduled computer move
  let _computerTimeoutId = null;

  // Schedule the computer move with a human-like delay and optional jitter.
  // Returns the delay in ms used (useful for UI indicators).
  function scheduleComputerMove() {
    // ensure any previous scheduled move is cleared
    if (_computerTimeoutId) {
      clearTimeout(_computerTimeoutId);
      _computerTimeoutId = null;
    }

    const level = getCompPlayerLevel();
    const base = level === 'senior' ? 700 : 420; // ms
    const jitter = Math.floor(Math.random() * 480); // up to ~480ms random
    const delay = base + jitter;

    _computerTimeoutId = setTimeout(() => {
      _computerTimeoutId = null;
      // perform the move
      computerMove();
      // notify the app that the computer finished its move so UI can update
      try {
        document.dispatchEvent(new CustomEvent('computer:move-complete'));
      } catch (e) {
        // ignore if dispatching fails in some environment
      }
    }, delay);

    return delay;
  }

  function cancelScheduledComputerMove() {
    if (_computerTimeoutId) {
      clearTimeout(_computerTimeoutId);
      _computerTimeoutId = null;
    }
  }

  function computerMove() {
    const board = gameBoard.getBoard();
    // get a 2D array of empty cell positions eg [[0,0],[1,1],[2,2]]
    const emptyPositions = [];
    board.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        if (cell.getValue() === null) {
          emptyPositions.push([rIdx, cIdx]);
        }
      });
    });

    let row, col;

    if (computer().level === "senior") {
      const computerToken = getCurrentPlayer().token;
      const humanToken = computerToken === "X" ? "O" : "X";
      [row, col] = seniorComputerMoves(board, emptyPositions, computerToken, humanToken);
    } else {
      [row, col] = juniorComputerMoves(emptyPositions);
    }

    playRound(row, col);    
  }

  // game logic to check for win/draw
  const WINNING_COMBO = [
      // Rows
      [[0,0], [0,1], [0,2]],
      [[1,0], [1,1], [1,2]],
      [[2,0], [2,1], [2,2]],
      // Columns
      [[0,0], [1,0], [2,0]],
      [[0,1], [1,1], [2,1]],
      [[0,2], [1,2], [2,2]],
      // Diagonals
      [[0,0], [1,1], [2,2]],
      [[0,2], [1,1], [2,0]],
  ];


  function playRound(row, col) {
      if (isRoundOver) {
          console.log("Game is over. Start a new round to play again.");
          return;
      }
      const board = gameBoard.getBoard();
      const cell = board[row][col];

      if (cell.getValue() === null) {
          cell.addToken(getCurrentPlayer().token);

          const currentToken = getCurrentPlayer().token;

          let hasWon = WINNING_COMBO.some(combination => 
              combination.every(([r, c]) => board[r][c].getValue() === currentToken)
          );

          if (hasWon) {
              isRoundOver = true;
              updateCurrentPlayerScore();
              return;
          }

          // Check for draw
          isDraw = board.every(row => 
              row.every(cell => cell.getValue() !== null)
          );

          if (isDraw) {
              isRoundOver = true;
              return;
          }

          switchPlayer();

          // Do not run the computer move synchronously here. Screen controller
          // will detect when it's the computer's turn and call
          // `scheduleComputerMove()` so we can show a 'thinking' UI.

      } else {
          console.log("Cell already occupied! Choose another cell.");
      }
  }

  
  function resetBoard() {
      gameBoard.reset();
      isRoundOver = false;
      isDraw = false;
  }

  return {
      playRound,
      setPlayerNames,
      getPlayers,
      getCurrentPlayer,
      getisRoundOver,
      getIsDraw,
      switchPlayer,
      resetBoard,
      resetPlayers,
      computer,
      scheduleComputerMove,
      cancelScheduledComputerMove,
      getBoard : gameBoard.getBoard,
      printBoard : gameBoard.printBoard,
  };
};

/**
 * Module which provides an interface between the
 * DOM elements and the GameController (game logic)
 */
const screenController = function () {
  const game = GameController();
  // cache DOM elements
  const boardDiv = document.querySelector('.board');
  const resetBtn = document.querySelector('#restart');
  const swapFirstPlayerBtn = document.querySelector('#swap');
  const freindPlayersBtn = document.querySelector('#friend-players');
  const soloPlayerBtn = document.querySelector('#solo-player');
  const playerModeDiv = document.querySelector('.player-mode');
  const playerSettingsDiv = document.querySelector('.player-settings');
  const startBtn = document.querySelector('.start-btn');
  const backBtn = document.querySelector('.back-btn');
  const quitBtn = document.querySelector('button.quit');
  const welcomeScreen = document.querySelector('.welcome-screen');
  const playScreen = document.querySelector('.play-screen');
  const resModal = document.querySelector('.result-modal');
  const soloPlayerSettings = document.querySelector('#solo-player-settings');
  const friendPlayerSettings = document.querySelector('#friend-player-settings');
  const computerLevelSelect = document.querySelector('#computer-level');
  const xTokenBtn = document.querySelector('#x-token');
  const oTokenBtn = document.querySelector('#o-token');
  const playerNameInput = document.querySelector('#player-name-input');
  const xInput = document.querySelector("#player-x-input");
  const oInput = document.querySelector("#player-o-input");
  

  function init() {
    addEventListeners();
  }

  function getPlayerNames () {
    let xName, oName;
    const players = game.getPlayers();
    // for human vs computer
    if (players[0].isComputer || players[1].isComputer) {
      const humanName = playerNameInput.value || 'Human';
      if (players[0].isComputer) {
        xName = 'Bot';
        oName = humanName;
      } else {
        xName = humanName;
        oName = 'Bot';
      }
      // set computer player level
      const level = computerLevelSelect.value;
      if (level == 'junior') {
        game.computer().setJunior();
      } else if (level == 'senior') {
        game.computer().setSenior();
      }
    
    } else {
      xName = xInput.value;
      oName = oInput.value;
    }
    
    game.setPlayerNames(xName, oName);
    
  }
  
  function clearInputFields () {
    playerNameInput.value = '';
    xInput.value = '';
    oInput.value = '';
  }

  function displayPlayerNames () {
    document.querySelector("#player-x").dataset.playerName = game.getPlayers()[0].name;
    document.querySelector("#player-o").dataset.playerName = game.getPlayers()[1].name;
  }

  function renderBoard(board) {
     board.forEach((row, rIndex) => {
      row.forEach((cell, cIndex) => {
        const cellButton = document.createElement('button');
        cellButton.classList.add('cell');
        // set data attributes to identify the cell's position
        // when playRound is called
        cellButton.dataset.row = rIndex;
        cellButton.dataset.col = cIndex;
        const cellValue = cell.getValue();
        cellButton.textContent = cellValue === null ? '' : cellValue;
        // apply respective player token colors
        if(cellValue) {
          if(cellValue === 'X') {
            cellButton.classList.add('x-color');
          } else {
            cellButton.classList.add('o-color');
          }
        }
        boardDiv.appendChild(cellButton);
      });
    });
  }

  function updatePlayScreen() {
    // remove any thinking indicator (we'll re-add below if needed)
    boardDiv.classList.remove('thinking');
    // update scores
    document.querySelector('.x-score').textContent = game.getPlayers()[0].score;
    document.querySelector('.o-score').textContent = game.getPlayers()[1].score;
    // Clear the board
    boardDiv.innerHTML = '';
    // get the newest version of the board and player turn
    const board = game.getBoard();
    const currentPlayer = game.getCurrentPlayer();

    // display the current player's turn
    const currentPlayerSpan = document.querySelector('.current-player');

    // abbreviate current player names for the small space in the turn indicator
    let abbName;
    if (currentPlayer.name === "Player1" || currentPlayer.name === "Player2") {
      const firstChar = currentPlayer.name.charAt(0);
      const lastChar = currentPlayer.name.slice(-1);
      abbName = firstChar.concat(lastChar); // eg. "P1", "P2"
    } else {
      abbName = currentPlayer.name.length <= 3 ? currentPlayer.name : currentPlayer.name.slice(0,3);
    }
    currentPlayerSpan.dataset.currentPlayer = abbName;

    // toggle turn indicator
    currentPlayerSpan.style.setProperty('--offset', currentPlayer.name === game.getPlayers()[0].name ? '0px' : 'calc(100% - 42px)');
    currentPlayerSpan.style.setProperty('--switch-bg', currentPlayer.name === game.getPlayers()[0].name ? 'var(--x-color)' : 'var(--o-color)');

    // render the updated board
    renderBoard(board);

    // make sure clicks are not registered multiple times
    boardDiv.removeEventListener('click', handleCellClick);

    // If it's the computer's turn, show thinking indicator and schedule the move.
    if (currentPlayer.isComputer && !game.getisRoundOver()) {
      boardDiv.classList.add('thinking');
      // disable human clicking while computer thinks
      // schedule the computer move and let the 'computer:move-complete' event
      // notify the UI when it finishes.
      game.scheduleComputerMove();
    } else if (!currentPlayer.isComputer) {
      // allow human clicks
      boardDiv.addEventListener('click', handleCellClick);
    }
  }
  
  // register all event handlers
  function addEventListeners() {
    resetBtn.addEventListener('click', resetBoard);
    swapFirstPlayerBtn.addEventListener('click', swapFirstPlayer);
    quitBtn.addEventListener('click', quitGame);
    freindPlayersBtn.addEventListener('click', openFriendPlayerSettings);
    soloPlayerBtn.addEventListener('click', openSoloPlayerSettings);
    startBtn.addEventListener('click', startGame);
    backBtn.addEventListener('click', openPlayerMode);
    resModal.querySelector('.close').addEventListener('click', closeResultModal);
    // listen for computer move completion so UI can update and show results if needed
    document.addEventListener('computer:move-complete', proceedAfterComputerMove);
    xTokenBtn.addEventListener('click', selectToken);
    oTokenBtn.addEventListener('click', selectToken);
  }

  function proceedAfterComputerMove(event) {
    updatePlayScreen();
    examineRound();
  }

  function selectToken(event) {
    if (event.target.dataset.token === 'x') {
      xTokenBtn.classList.add('btn-selected');
      oTokenBtn.classList.remove('btn-selected');

      game.getPlayers()[0].isComputer = false; // x player === human
      game.getPlayers()[1].isComputer = true; // o player === computer
    } else {
      xTokenBtn.classList.remove('btn-selected');
      oTokenBtn.classList.add('btn-selected');

      game.getPlayers()[0].isComputer = true; // x player === computer
      game.getPlayers()[1].isComputer = false; // o player === human
    }
  } 

  // add click listeners to the cells
  function handleCellClick(event) {
    const target = event.target;
    if (target.classList.contains('cell')) {
      const row = parseInt(target.dataset.row, 10);
      const col = parseInt(target.dataset.col, 10);
      game.playRound(row, col);
      updatePlayScreen();
      examineRound();
    }
  }

  function examineRound() {
    if (game.getisRoundOver()) {
        boardDiv.removeEventListener('click', handleCellClick);
        resModal.showModal();
        const resultDiv = resModal.querySelector('.results');
        if (game.getIsDraw()) {
          resultDiv.textContent = "It's a draw!";
        } else {
          resultDiv.textContent = `${game.getCurrentPlayer().name} wins!`
        }
      } 
  }

  function resetBoard(event) {
    game.resetBoard();
    updatePlayScreen();
  }
  
  function swapFirstPlayer(event) {
    game.resetBoard();
    game.switchPlayer();
    updatePlayScreen();
  }

  function displayPlayerModeDiv() {
    toggleDisplays(playScreen, welcomeScreen);
    toggleDisplays(playerSettingsDiv, playerModeDiv);
  }

  function quitGame(event) {
    game.resetBoard();
    game.resetPlayers();
    displayPlayerModeDiv();
  }

  function toggleDisplays(fromDisplay, toDisplay) {
    fromDisplay.classList.add('hidden')
    toDisplay.classList.remove('hidden');
  }

  function openFriendPlayerSettings(event) {
    toggleDisplays(playerModeDiv, playerSettingsDiv);
    toggleDisplays(soloPlayerSettings, friendPlayerSettings);
  }

  function openSoloPlayerSettings(event) {
    toggleDisplays(playerModeDiv, playerSettingsDiv);
    toggleDisplays(friendPlayerSettings, soloPlayerSettings);
    // set the second player to be a computer by default
    game.getPlayers()[1].isComputer = true;
  }

  function startGame(event) {
    getPlayerNames();
    clearInputFields();
    toggleDisplays(welcomeScreen, playScreen);
    displayPlayerNames();
    updatePlayScreen();
  }

  function openPlayerMode(event) {
    // clear input fields on navigation
    // to player mode display
    clearInputFields();
    toggleDisplays(playerSettingsDiv, playerModeDiv);

  } 

  function closeResultModal(event) {
    resModal.close()
  }

  init();

}

screenController();