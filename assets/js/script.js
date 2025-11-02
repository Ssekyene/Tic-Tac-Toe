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

    // will be used to print the board in the console for
    // testing purposes
    function printBoard() {
      
    }


    init();

    function reset() {
        init();
    }

    return {
        getBoard,
        reset,
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
  const player1 = Player('Player1', 'X');
  const player2 = Player('Player2', 'O');

  const players = [player1, player2];
  // const players = [
  //     { 
  //       token: 'X',
  //       score: 0,
  //     },
  //     {
  //       token: 'O',
  //       score: 0,
  //     }
  // ];
  let currentPlayerIndex = 0;
  let isGameOver = false;
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

  function getIsGameOver() {
      return isGameOver;
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

  function resetScores() {
    players.forEach((player) => {player.score = 0});
  }

  function computerMove() {
    const board = gameBoard.getBoard();
    // get empty cell positions
    const emptyPositions = [];
    board.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        if (cell.getValue === null) {
          emptyPositions.push([rIdx, cIdx]);
        }
      });
    });
   console.log(emptyPositions);
  }


  function playRound(row, col) {
      if (isGameOver) {
          console.log("Game is over. Start a new round to play again.");
          return;
      }
      const board = gameBoard.getBoard();
      const cell = board[row][col];

      if (cell.getValue() === null) {
          cell.addToken(getCurrentPlayer().token);

          // game logic to check for win/draw
          const winningCombinations = [
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

          const currentToken = getCurrentPlayer().token;
          let hasWon = winningCombinations.some(combination => 
              combination.every(([r, c]) => board[r][c].getValue() === currentToken)
          );

          if (hasWon) {
              isGameOver = true;
              updateCurrentPlayerScore();
              return;
          }

          // Check for draw
          isDraw = board.every(row => 
              row.every(cell => cell.getValue() !== null)
          );

          if (isDraw) {
              isGameOver = true;
              return;
          }

          switchPlayer();

          if (getCurrentPlayer().isComputer) {
            computerMove();
          }

      } else {
          console.log("Cell already occupied! Choose another cell.");
      }
  }

  
  function resetBoard() {
      gameBoard.reset();
      isGameOver = false;
      isDraw = false;
  }

  return {
      playRound,
      setPlayerNames,
      getPlayers,
      getCurrentPlayer,
      getIsGameOver,
      getIsDraw,
      switchPlayer,
      resetBoard,
      resetScores,
      getBoard : gameBoard.getBoard,
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
  const playerModeDiv = document.querySelector('.player-mode');
  const playerSettingsDiv = document.querySelector('.player-settings');
  const startBtn = document.querySelector('.start-btn');
  const backBtn = document.querySelector('.back-btn');
  const quitBtn = document.querySelector('button.quit');
  const welcomeScreen = document.querySelector('.welcome-screen');
  const playScreen = document.querySelector('.play-screen');
  const resModal = document.querySelector('.result-modal');
  

  function init() {
    addEventListeners();
  }

  function getPlayerNames () {
    const xInput = document.querySelector("#player-x-input");
    const oInput = document.querySelector("#player-o-input");
    game.setPlayerNames(xInput.value, oInput.value);
    // clear input fields
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
    boardDiv.addEventListener('click', handleCellClick);
  }
  
  // register all event handlers
  function addEventListeners() {
    resetBtn.addEventListener('click', resetBoard);
    swapFirstPlayerBtn.addEventListener('click', swapFirstPlayer);
    quitBtn.addEventListener('click', quitGame);
    freindPlayersBtn.addEventListener('click', openPlayerSettings);
    startBtn.addEventListener('click', startGame);
    backBtn.addEventListener('click', openPlayerMode);
    resModal.querySelector('.close').addEventListener('click', closeResultModal);
  }

  // add click listeners to the cells
  function handleCellClick(event) {
    const target = event.target;
    if (target.classList.contains('cell')) {
      const row = parseInt(target.dataset.row, 10);
      const col = parseInt(target.dataset.col, 10);
      game.playRound(row, col);
      updatePlayScreen();
      if (game.getIsGameOver()) {
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
    changeDisplays(playScreen, welcomeScreen);
    changeDisplays(playerSettingsDiv, playerModeDiv);
  }

  function quitGame(event) {
    game.resetBoard();
    game.resetScores();
    displayPlayerModeDiv();
  }

  function changeDisplays(fromDisplay, toDisplay) {
    fromDisplay.classList.add('hidden')
    toDisplay.classList.remove('hidden');
  }

  function openPlayerSettings(event) {
    changeDisplays(playerModeDiv, playerSettingsDiv);
  }

  function startGame(event) {
    getPlayerNames();
    changeDisplays(welcomeScreen, playScreen);
    displayPlayerNames();
    updatePlayScreen();
  }

  function openPlayerMode(event) {
    changeDisplays(playerSettingsDiv, playerModeDiv);
  } 

  function closeResultModal(event) {
    resModal.close()
  }

  init();

}

screenController();