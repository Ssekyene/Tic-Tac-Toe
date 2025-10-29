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


    init();

    function reset() {
        init();
    }

    return {
        getBoard,
        reset,
    };
};


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

const GameController = function () {
  const gameBoard = GameBoard();
  const players = [
      { 
        token: 'X',
      },
      {
        token: 'O',
      }
  ];
  let currentPlayerIndex = 0;
  let isGameOver = false;
  let isDraw = false;

  function setPlayerNames(playerOneName, playerTwoName) {
      players[0].name = playerOneName || "Player1";
      players[1].name = playerTwoName || "Player2";
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


  function playTurn(row, col) {
      if (isGameOver) {
          console.log("Game is over. Start a new game to play again.");
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
      } else {
          console.log("Cell already occupied! Choose another cell.");
      }
  }

  
  function reset() {
      gameBoard.reset();
      currentPlayerIndex = 0;
      isGameOver = false;
      isDraw = false;
  }

  return {
      playTurn,
      setPlayerNames,
      getPlayers,
      getCurrentPlayer,
      getIsGameOver,
      getIsDraw,
      switchPlayer,
      reset,
      getBoard : gameBoard.getBoard,
  };
};

const screenController = function () {
  const game = GameController();
  const playerTurnDiv = document.querySelector('.turn');
  const boardDiv = document.querySelector('.board');
  const restartButton = document.querySelector('#restart');


  function init() {
    setPlayerNames();
    updatePlayScreen();
    addEventListeners();
  }

  function setPlayerNames() {
    const playerOneName = prompt("Enter Player One's name (X): ");
    const playerTwoName = prompt("Enter Player Two's name (O): ");
    game.setPlayerNames(playerOneName, playerTwoName);
    window.document.querySelector("#player-x").dataset.playerName = game.getPlayers()[0].name;
    window.document.querySelector("#player-o").dataset.playerName = game.getPlayers()[1].name;
  }

  function renderBoard(board) {
     board.forEach((row, rIndex) => {
      row.forEach((cell, cIndex) => {
        const cellButton = document.createElement('button');
        cellButton.classList.add('cell');
        // set data attributes to identify the cell's position
        // when playTurn is called
        cellButton.dataset.row = rIndex;
        cellButton.dataset.col = cIndex;
        const cellValue = cell.getValue();
        cellButton.textContent = cellValue === null ? '' : cellValue;
        boardDiv.appendChild(cellButton);
      });
    });
  }

  function updatePlayScreen() {
    // Clear the board
    boardDiv.innerHTML = '';
    // get the newest version of the board and player turn
    const board = game.getBoard();
    const currentPlayer = game.getCurrentPlayer();

    // display the current player's turn
    playerTurnDiv.textContent = `${currentPlayer.name}'s turn`;

    // render the updated board
    renderBoard(board);
    boardDiv.addEventListener('click', handleCellClick);
  }
  
  function addEventListeners() {
    restartButton.addEventListener('click', handleRestartClick);
  }

  // add click listeners to the cells
  function handleCellClick(event) {
    const target = event.target;
    if (target.classList.contains('cell')) {
      const row = parseInt(target.dataset.row, 10);
      const col = parseInt(target.dataset.col, 10);
      game.playTurn(row, col);
      updatePlayScreen();
      if (game.getIsGameOver()) {
        boardDiv.removeEventListener('click', handleCellClick);
        if (game.getIsDraw()) {
          playerTurnDiv.textContent = `Game Over---It's a draw!`;
        } else {
          playerTurnDiv.textContent = `Game Over---${game.getCurrentPlayer().name} wins!`;
        }
      } 
    }
  }

  function handleRestartClick(event) {
    game.reset();
    updatePlayScreen();
  }

  init();

}

screenController();
