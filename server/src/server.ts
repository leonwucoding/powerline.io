import { Server, Socket } from "socket.io";
import { GameLoop, GameState, initGame } from "./game";
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
		console.log(`new game ${roomName}`);
		client.join(roomName);
		console.log(io.sockets.adapter.rooms);
		(client as any).number = 1;
		client.emit("init", {playerNumber: 1, gameCode: roomName});
		// console.log(`going to init roomName = ${roomName}`);
	});
	client.on("joinGame",function (gameCode) {
		console.log("-----------joinGame----------");
		const room = io.sockets.adapter.rooms.get(gameCode);
		// console.log(`joinGame ${gameCode}`);
		// console.log(io.sockets.adapter.rooms);
		// console.log(room);
		let allUsers;
		if(room) {
			allUsers = room;
		}
		let numClients = 0;
		if(allUsers) {
			// console.log(allUsers.size);
			numClients = allUsers.size; //Object.keys(allUsers).length;
			// console.log(`numClients=${numClients}`);
		}
		if(numClients===0) {
			client.emit("unknownGame");
			return;
		}else if(numClients>1) {
			client.emit("tooManyPlayers");
			return;
		}
		clientRooms[client.id] = gameCode;
		client.join(gameCode);
		(client as any).number = 2;
		client.emit("init", {playerNumber: 2, gameCode: gameCode});
		startGameInterval(gameCode);
	});
	client.on("turn", (direction: "Right" | "Left" | "Down" | "Up") => {
		const roomName = clientRooms[client.id];
		console.log(`${client.id} turn ${direction}`);
		if(!roomName || !state[roomName].active) {
			console.log("game is not active.");
			return;
		}
		const clientNumber = (client as any).number;
		const player = (state[roomName] as GameState).players[clientNumber - 1];
		console.log(`clientNumber=${clientNumber}`);
		console.log(player);
		switch(direction) {
		case "Right":
			if(player.vel.y != 0) {
				player.vel = {x: 1, y: 0};
			}
			break; 
		case "Left":
			if(player.vel.y != 0) {
				player.vel = {x: -1, y: 0};
			}
			break; 
		case "Up":
			if(player.vel.x != 0) {
				player.vel = {x: 0, y: -1};
			}
			break; 
		case "Down":
			if(player.vel.x != 0) {
				player.vel = {x: 0, y: 1};
			}
			break; 
		}
	});
	// startGameInterval(client, state);
	// client.emit("init",{data: "a new player joined"});
});
function emitGameState (roomName:string, state: GameState|undefined|null) {
	console.log("emitGameState");
	io.sockets.in(roomName).emit("gameState", state);
}
function emitGameOver (roomName: string, winner: number) {
	io.sockets.in(roomName).emit("gameOver", winner);
}
function startGameInterval (roomName: string) {
	console.log("startGameInterval");
	state[roomName].active = true;
	const intervalId = setInterval(()=>{
		const winner = GameLoop(state[roomName]);
		console.log(`winner=${winner}`);
		if(!winner) {
			emitGameState(roomName, state[roomName]);
			// client.emit("gameState", state);
		}else{
			emitGameOver(roomName, winner);
			delete state[roomName];
			clearInterval(intervalId);
		}
	}, 1000/FRAME_RATE);
}

io.listen(3000);