import { Server, Socket } from "socket.io";
import { createGameState, GameLoop } from "./game";
import { FRAME_RATE } from "./constants";
const io = new Server({cors:{
	origin: "*",
	methods:["GET","POST"]
}});
io.on("connection", (client: Socket)=>{
	const state = createGameState();
	client.on("turn", (direction: "Right" | "Left" | "Down" | "Up") => {
		switch(direction){
			case "Right":
				if(state.player.vel.y != 0){
					state.player.vel = {x: 1, y: 0};
				}
				break; 
			case "Left":
				if(state.player.vel.y != 0){
					state.player.vel = {x: -1, y: 0};
				}
				break; 
			case "Up":
				if(state.player.vel.x != 0){
					state.player.vel = {x: 0, y: -1};
				}
				break; 
			case "Down":
				if(state.player.vel.x != 0){
					state.player.vel = {x: 0, y: 1};
				}
				break; 
		}
	});
	startGameInterval(client, state);
	// client.emit("init",{data: "a new player joined"});
});

function startGameInterval(client: Socket, state: any){
	const intervalId = setInterval(()=>{
		const winner = GameLoop(state);
		if(!winner){
			client.emit("gameState", state);
		}else{
			client.emit("gameOver");
			clearInterval(intervalId);
		}
	}, 1000/FRAME_RATE);
}

io.listen(3000);