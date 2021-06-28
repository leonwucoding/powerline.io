const BG_COLOR = "#231f20";
const SNAKE_COLOR = "#c2c2c2";
const FOOD_COLOR = "#e66916";

const socket = io("http://localhost:3000");

socket.on("init", (msg) => {
    console.log(msg);
});
socket.on("gameState", (gameState) => {
    requestAnimationFrame(() => paintGame(gameState));
});
socket.on("gameOver", () => {
    alert("You Lost")
});

const gameScreen = document.getElementById('gameScreen');

let canvas, ctx;

function init() {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    document.addEventListener("keydown", (e) => {
        // console.log(`code:${e.code}`);
        // console.log(`key:${e.key}`);
        switch(e.code){
            case "ArrowLeft":
            case "ArrowRight":
            case "ArrowDown":
            case "ArrowUp":
                socket.emit("turn", e.code.replace("Arrow", ""));
                break;
            default:
                break;
        }
    })
}

init();

function paintGame(state) {
    ctx.fillStyle = BG_COLOR;
    canvas.width = canvas.height = 600;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const food = state.food;
    const gridsize = state.gridsize;
    const size = canvas.width / gridsize;

    ctx.fillStyle = FOOD_COLOR;
    ctx.fillRect(food.x * size, food.y * size, size, size);
    paintPlayer(state.player, size, SNAKE_COLOR);
}

function paintPlayer(playerState, size, color) {
    ctx.fillStyle = color;
    const snake = playerState.snake;

    for (let cell of snake) {
        ctx.fillRect(cell.x * size, cell.y * size, size, size);
    }
}
