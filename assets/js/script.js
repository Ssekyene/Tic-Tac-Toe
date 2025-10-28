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


const GameController = function (
  playerOneName = "Player One",
  playerTwoName = "Player Two"
  ) {
      const gameBoard = GameBoard();
      const players = [
          { 
            name: playerOneName,
            token: 'X',
          },
          {
            name: playerTwoName,
            token: 'O',
          }
      ];
      let currentPlayerIndex = 0;
      let isGameOver = false;

      function getIsGameOver() {
          return isGameOver;
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
              const isDraw = board.every(row => 
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
      }

      return {
          playTurn,
          getCurrentPlayer,
          getIsGameOver,
          switchPlayer,
          reset,
          getBoard : gameBoard.getBoard,
      };
};

const screenController = function () {
  const game = GameController("Alice", "Bob");
  const playerTurnDiv = document.querySelector('.turn');
  const boardDiv = document.querySelector('.board');
  const restartButton = document.querySelector('.restart');


  function init() {
    updatePlayScreen();
    addEventListeners();
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
    }
  }

  function handleRestartClick(event) {
    game.reset();
    updatePlayScreen();
  }

  init();

}

screenController();
