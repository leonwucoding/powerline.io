import { Server, Socket } from "socket.io";
import { createGameState, GameLoop, GameState, initGame } from "./game";
import { FRAME_RATE } from "./constants";
import { makeid } from "./utils";
const io = new Server({cors:{
	origin: "*",
	methods:["GET", "POST"]
}});
const state: {[key: string]: GameState} = {};
const clientRooms: {[key: string]: string} = {};
io.on("connection", (client: Socket)=>{
	// const state = createGameState();
	client.on("newGame", function () {
		const roomName = makeid(5);
		clientRooms[client.id] = roomName;
		state[roomName] =  initGame();
		client.join(roomName);
		const pc = client as any;
		pc.number = 1;
		client.emit("init", 1);
	});
	client.on("joinGame",function (gameCode) {
		const room = io.sockets.adapter.rooms.get(gameCode);

		// startGameInterval(client,);
	});
	client.on("turn", (direction: "Right" | "Left" | "Down" | "Up") => {
		switch(direction) {
		case "Right":
			if(state.player.vel.y != 0) {
				state.player.vel = {x: 1, y: 0};
			}
			break; 
		case "Left":
			if(state.player.vel.y != 0) {
				state.player.vel = {x: -1, y: 0};
			}
			break; 
		case "Up":
			if(state.player.vel.x != 0) {
				state.player.vel = {x: 0, y: -1};
			}
			break; 
		case "Down":
			if(state.player.vel.x != 0) {
				state.player.vel = {x: 0, y: 1};
			}
			break; 
		}
	});
	startGameInterval(client, state);
	// client.emit("init",{data: "a new player joined"});
});

function startGameInterval (client: Socket, state: GameState) {
	const intervalId = setInterval(()=>{
		const winner = GameLoop(state);
		if(!winner) {
			client.emit("gameState", state);
		}else{
			client.emit("gameOver");
			clearInterval(intervalId);
		}
	}, 1000/FRAME_RATE);
}

io.listen(3000);