const GameBoard = function (rows=3, cols=3) {
    const board = [];
    function init() {
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
    return {
        getBoard,
        printBoard
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

      // For testing purposes, print the current player
      function printCurrentPlayer() {
          console.log(`Current Player: ${getCurrentPlayer().name}`);
      }

      // Initialize the game state for the first time in the console
      function init() {
          gameBoard.printBoard();
          printCurrentPlayer();
      }

      function switchPlayer() {
          currentPlayerIndex = 1 - currentPlayerIndex;
      }

      function getCurrentPlayer() {
          return players[currentPlayerIndex];
      }

      function playTurn(row, col) {
          const board = gameBoard.getBoard();
          const cell = board[row][col];
          if (cell.getValue() === null) {
              cell.addToken(getCurrentPlayer().token);
              gameBoard.printBoard();
              switchPlayer();
              printCurrentPlayer();
              
          } else {
              console.log("Cell already occupied! Choose another cell.");
          }
      }

      init();
      return {
          playTurn,
          getCurrentPlayer,
          switchPlayer,
          printCurrentPlayer,
      };
};

const game = GameController("Alice", "Bob");
