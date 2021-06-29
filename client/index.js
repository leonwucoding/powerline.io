const BG_COLOR = "#231f20";
const SNAKE_COLOR = "#c2c2c2";
const FOOD_COLOR = "#e66916";

const initialScreen = document.getElementById("initialScreen");
const gameScreen = document.getElementById("gameScreen");
const newGameBtn = document.getElementById("newGameButton");
const joinGameBtn = document.getElementById("joinGameButton");
const gameCodeDisplay = document.getElementById("gameCode");
const gameCodeInput = document.getElementById("gameCodeInput");
newGameBtn.addEventListener("click",()=>{
    socket.emit("newGame");
    init();
});
joinGameBtn.addEventListener("click",()=>{
    const code = gameCodeInput.value;
    socket.emit("joinGame",code);
    init();
});
const socket = io("http://192.168.1.161:3000");
// socket.on("gameCode",(code)=>{
//     gameCodeDisplay.innerText = code;
// });
socket.on("unknownGame",()=>{
    reset();
    alert("unknown game code!")
});
socket.on("tooManyPlayers",()=>{
    reset();
    alert("too many players!")
});
socket.on("init", (data) => {
    // console.log(msg);
    playerNumber = data.playerNumber;
    gameCodeDisplay.innerText = data.gameCode;
});
socket.on("gameState", (gameState) => {
    if(!gameActive) return;
    requestAnimationFrame(() => paintGame(gameState));
});
socket.on("gameOver", (winner) => {
    if(!gameActive) return;
    if(playerNumber==winner){
        alert("You win!");
    }else{
        alert("You lose!");
    }
    gameActive = false;
});
function reset() {
    playerNumber = null;
    gameCodeInput.value = "";
    gameCodeDisplay.innerText = "";
    initialScreen.style.display = "block";
    gameScreen.style.display = "none";
}
// const gameScreen = document.getElementById('gameScreen');

let canvas, ctx;
let playerNumber;
let gameActive = false;
function init() {
    initialScreen.style.display = "none";
    gameScreen.style.display = "block";
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    document.addEventListener("keydown", (e) => {
        // console.log(`code:${e.code}`);
        // console.log(`key:${e.key}`);
        let direction;
        switch(e.code){
            case "KeyW":
                direction = "Up";
                break;
            case "KeyA":
                direction = "Left";
                break;
            case "KeyS":
                direction = "Down";
                break;
            case "KeyD":
                direction = "Right";
                break;
            case "ArrowLeft":
            case "ArrowRight":
            case "ArrowDown":
            case "ArrowUp":
                direction = e.code.replace("Arrow", "");
                break;
            default:
                return;
        }
        socket.emit("turn", direction);
    })
    gameActive = true;
}

function paintGame(state) {
    ctx.fillStyle = BG_COLOR;
    canvas.width = canvas.height = 600;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const food = state.food;
    const gridsize = state.gridsize;
    const size = canvas.width / gridsize;

    ctx.fillStyle = FOOD_COLOR;
    ctx.fillRect(food.x * size, food.y * size, size, size);
    paintPlayer(state.players[0], size, SNAKE_COLOR);
    paintPlayer(state.players[1], size, 'red');
}

function paintPlayer(playerState, size, color) {
    ctx.fillStyle = color;
    const snake = playerState.snake;

    for (let cell of snake) {
        ctx.fillRect(cell.x * size, cell.y * size, size, size);
    }
}
