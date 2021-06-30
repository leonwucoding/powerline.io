import { Server } from "socket.io";
import { Game } from "./game";
// import { makeid } from "./utils";
const io = new Server({ cors:{
	origin: "*",
	methods:["GET", "POST"]
} });
io.listen(3000);

const game = new Game(io);

game.startGameInterval();