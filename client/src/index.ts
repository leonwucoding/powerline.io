import { io, Socket } from "socket.io-client";
import { GameState, Player } from "../../server/src/models";
const BG_COLOR = "#231f20";
const FOOD_COLOR = "#e66916";

const initialScreen = document.getElementById("initialScreen") as HTMLDivElement;
const gameScreen = document.getElementById("gameScreen") as HTMLDivElement;
const playerNameInput = document.getElementById("playerNameInput") as HTMLInputElement;
const joinGameBtn = document.getElementById("joinGameButton") as HTMLButtonElement;
// const newGameBtn = document.getElementById("newGameButton");
// const gameCodeDisplay = document.getElementById("gameCode");
// const gameCodeInput = document.getElementById("gameCodeInput");

joinGameBtn.addEventListener("click",()=>{
    // const code = gameCodeInput.value;
    playerName = playerNameInput.value;
    socket.emit("joinGame", playerName);
    console.log(`joinGame ${socket.id} ${playerName}`);
    init();
});
const socket = io("http://192.168.1.161:3000");
// let die: boolean = false;
socket.on("gameState", (gameState) => {
    if(!gameActive) return;
    console.log(gameState);
    requestAnimationFrame(() => paintGame(gameState));
});
socket.on("die",()=>{
    console.log("die");
    gameActive = false;
    if(confirm("You are dead, restart?")){
        socket.emit("joinGame", playerName);
        gameActive = true;
    }else{
        socket.close();
    }
});

// function reset() {
//     // playerNumber = null;
//     // gameCodeInput.value = "";
//     // gameCodeDisplay.innerText = "";
//     initialScreen.style.display ="block";
//     gameScreen.style.display = "none";
//     playerNameInput.value = "";
//     gameActive = false;
// }

let canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D;
let playerName;
let gameActive = false;
function init() {

    initialScreen.style.display = "none";
    gameScreen.style.display = "block";
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = canvas.getContext("2d");

    document.addEventListener("keydown", (e) => {
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

function paintGame(state: GameState) {
    ctx.fillStyle = BG_COLOR;
    canvas.width = canvas.height = 600;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // const food = state.food;
    const gridsize = state.gridsize;
    const size = canvas.width / gridsize;

    ctx.fillStyle = FOOD_COLOR;
    for(let food of state.foods){
        ctx.fillRect(food.x * size, food.y * size, size, size);
    }
    for( const [key, player] of Object.entries(state.players) ) {
        paintPlayer(player, size);
    }
}

function paintPlayer(playerState: Player, size) {
    ctx.fillStyle = playerState.color;
    const snake = playerState.snake;
    for (let cell of snake) {
        console.log(cell);
        ctx.fillRect(cell.x * size, cell.y * size, size, size);
    }
    ctx.fillStyle = "white";
    ctx.font = "16px verdana";
    ctx.fillText(playerState.name, playerState.heading.x * size, playerState.heading.y * size - 8);
}
