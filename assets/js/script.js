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
        printBoard,
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
            token: 1,
          },
          {
            name: playerTwoName,
            token: 2,
          }
      ];
      let currentPlayerIndex = 0;
      let isGameOver = false;


      // For testing purposes, print the current player
      function printCurrentPlayer() {
          console.log(`Current Player: ${getCurrentPlayer().name}`);
      }

      // Initialize the game state for the first time in the console
      function init() {
          gameBoard.printBoard();
          printCurrentPlayer();
      }

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

          // input validation: ensure integers and within bounds
          if (typeof row !== 'number' || typeof col !== 'number' || !Number.isInteger(row) || !Number.isInteger(col)) {
              console.log('Invalid input: row and col must be integers.');
              return;
          }

          if (row < 0 || row >= board.length || col < 0 || col >= board[row].length) {
              console.log('Invalid move: out of bounds.');
              return;
          }

          const cell = board[row][col];
          if (cell.getValue() === null) {
              cell.addToken(getCurrentPlayer().token);
              gameBoard.printBoard();

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
                  console.log(`${getCurrentPlayer().name} wins!`);
                  isGameOver = true;
                  return;
              }

              // Check for draw
              const isDraw = board.every(row => 
                  row.every(cell => cell.getValue() !== null)
              );

              if (isDraw) {
                  console.log("It's a draw!");
                  isGameOver = true;
                  return;
              }


              switchPlayer();
              printCurrentPlayer();
              
          } else {
              console.log("Cell already occupied! Choose another cell.");
          }
      }

      
      function reset() {
          gameBoard.reset();
          currentPlayerIndex = 0;
          isGameOver = false;
          console.log('Game reset.');
          gameBoard.printBoard();
          printCurrentPlayer();
      }

      init();
      return {
          playTurn,
          getCurrentPlayer,
          getIsGameOver,
          switchPlayer,
          printCurrentPlayer,
          reset,
      };
};

const game = GameController("Alice", "Bob");
