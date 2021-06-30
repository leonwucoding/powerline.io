import { Server, Socket } from "socket.io";
import { FRAME_RATE, GRID_SIZE } from "./constants";
export interface Player {
	// id: string;
	name: string;
	pos: Position;
	vel: {
		x: number;
		y: number;
	},
	snake: Position[];
	// socket: Socket;
	color: string;
}
export interface GameState {
    players: {[Key: string]: Player};
    food: Position;
    gridsize: number;
}
export interface Position {
    x: number;
    y: number;
}

export class Game {
	state: GameState;
	io: Server;
	clients: {[key: string]: Socket};
	constructor(io: Server) {
		this.state = {
			players: {},
			food: {
				x: 7,
				y: 7
			},
			gridsize: GRID_SIZE
		};
		this.io = io;
		this.clients = {};
		io.on("connection", this.handleOnConnect);
	}
	handleOnConnect = (client: Socket) => {
		// this.addPlayer(client);
		client.on("joinGame", (playerName)=>{
			this.addPlayer(client, playerName);
		});
		client.on("disconnection",()=>{
			console.log(`${client.id} disconnect`);
			this.removePlayer(client);
		});
		client.on("turn", (direction: "Right" | "Left" | "Down" | "Up") => {
			this.handlePlayerInput(client, direction);
		});
	}
	
	startGameInterval () {
		console.log("startGameInterval");
		const intervalId = setInterval(() => {
			this.GameLoop();
			// console.log(this.io.sockets);
			this.io.emit("gameState", this.state);
			// this.io.emit("gameState", this.state);
		}, 1000 / FRAME_RATE);
	}
	handlePlayerInput = (client: Socket, direction: "Right" | "Left" | "Down" | "Up") => {
		console.log(`${client.id} turn ${direction}`);
		// const clientNumber = (client as any).number;
		const player = this.state.players[client.id];
		if(!player) return; //player dead
		switch(direction) {
		case "Right":
			if(player.vel.y != 0) {
				player.vel = { x: 1, y: 0 };
			}
			break; 
		case "Left":
			if(player.vel.y != 0) {
				player.vel = { x: -1, y: 0 };
			}
			break; 
		case "Up":
			if(player.vel.x != 0) {
				player.vel = { x: 0, y: -1 };
			}
			break; 
		case "Down":
			if(player.vel.x != 0) {
				player.vel = { x: 0, y: 1 };
			}
			break; 
		}
	}
	_colors = ["red", "blue", "green", "yellow"];
	addPlayer(client: Socket, playerName: string) {
		const colorPicked = this._colors.splice(0,1)[0];
		const newPlayer: Player = {
			// id: client.id,
			name: playerName,
			pos: { x: 10, y: 10 },
			vel: { x:1, y:0 },
			snake: [{ x: 10, y: 10 }],
			// socket: client,
			color: colorPicked,
		};
		this.clients[client.id] = client;
		this.state.players[client.id] = newPlayer;
	}
	removePlayer(client: Socket) {
		delete this.state.players[client.id];
		delete this.clients[client.id];
	}
	initGame (): GameState {
		this.state.players = {};
		this.randomFood();
		return this.state;
	}
	randomFood (): void {
		console.log("RandomFood");
		const food = {
			x: Math.floor(Math.random() * GRID_SIZE),
			y: Math.floor(Math.random() * GRID_SIZE),
		};
		for( const [id, player] of Object.entries(this.state.players) ) {
			for(const cell of player.snake) {
				if(cell.x === food.x && cell.y === food.y) {
					return this.randomFood();
				}
			}
		}
		// for(const cell of this.state.players[1].snake) {
		// 	if(cell.x === food.x && cell.y === food.y) {
		// 		return this.randomFood();
		// 	}
		// }
		this.state.food = food;
	}
	checkHitBoundry(player: Player){
		console.log("checkHitBoundry");
		if(player.pos.x < 0 || player.pos.x > GRID_SIZE || player.pos.y < 0 || player.pos.y > GRID_SIZE) {
			return true;
		}
	}
	checkHitFood(player: Player) {
		if(this.state.food.x === player.pos.x && this.state.food.y === player.pos.y) {
			player.snake.push({ ...player.pos });
			player.pos.x += player.vel.x;
			player.pos.y += player.vel.y;
			this.randomFood();
		}
	}
	GameLoop () {
		// console.log("gameloop")
		for( const [id, player] of Object.entries(this.state.players) ) {
			if(this.checkHitBoundry(player)){
				const sock = this.clients[id];
				if(sock) {
					sock.emit("die");
				}else {
					console.log(`${id} keys=${Object.keys(this.clients)}`);
				}
				delete this.state.players[id];
				// delete this.clients[id];
			}
			this.checkHitFood(player);

			player.pos.x += player.vel.x;
			player.pos.y += player.vel.y;
			player.snake.push({ ...player.pos });
			player.snake.shift();
		}
		//todo check hit each other
	}
}