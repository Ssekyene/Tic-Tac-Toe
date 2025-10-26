const GameBoard = function (rows=3, cols=3) {
    const board = [];
    function init() {
        for (let r = 0; r < rows; r++) {
            const row = [];
            for (let c = 0; c < cols; c++) {
                row.push(null);
            }
            board.push(row);
        }
    }


    // This will be the method of getting the entire board that our
    // UI will eventually need to render. 
    function getBoard() {
        return board;
    }


    function setCell(row, col, value) {
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
            board[row][col] = value;
        }
    }

    function printBoard() {
        console.log(board);
    }


    init();
    return {
        getBoard,
        setCell,
        printBoard
    };
};

const GameController = function () {
    const gameBoard = GameBoard();
    gameBoard.printBoard();
}

const game = GameController();