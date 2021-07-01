import { Server, Socket } from "socket.io";
import { FRAME_RATE, GRID_SIZE } from "./constants";
import { GameState, Player } from "./models";
export class Game {
	state: GameState;
	io: Server;
	clients: {[key: string]: Socket};
	constructor(io: Server) {
		this.state = {
			players: {},
			foods: [{x: 7,y: 7},{x: 10,y: 10}],
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
			// this.io.emit("gameState", this.state);
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
	_colors = ["#ffe6f7", "#bf73ff", "#36badf","#08c96b","#f0dbb7","#beff11"];
	addPlayer(client: Socket, playerName: string) {
		console.log(`addPlaye ${client.id} ${playerName}.`);
		const colorPicked = this._colors.splice(0,1)[0];
		const newPlayer: Player = {
			id: client.id,
			name: playerName,
			heading: { x: 10, y: 10 },
			vel: { x:1, y:0 },
			snake: [{ x: 10, y: 10 }],
			// socket: client,
			color: colorPicked,
		};
		this.clients[client.id] = client;
		this.state.players[client.id] = newPlayer;
	}
	removePlayer(client: Socket) {
		console.log(`remove player ${client.id}`);
		const player = this.state.players[client.id];
		this._colors.push(player.color);
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
		this.state.foods.push(food);
	}
	checkHitBoundry(player: Player): boolean {
		// console.log("checkHitBoundry");
		if(player.heading.x < 0 || player.heading.x > GRID_SIZE-1 || player.heading.y < 0 || player.heading.y > GRID_SIZE-1) {
			return true;
		}
		return false;
	}
	checkHitFood(player: Player) {
		for(let i=0;i<this.state.foods.length-1; i++){
			const food = this.state.foods[i];
			if(food.x === player.heading.x && food.y === player.heading.y) {
				player.snake.push({ ...player.heading });
				player.heading.x += player.vel.x;
				player.heading.y += player.vel.y;
				this.state.foods.splice(i,1);
				this.randomFood();
			}
		}
	}
	checkHitOtherPlayer(player: Player){
		for(const[id, other] of Object.entries(this.state.players)) {
			// if(id==player.id) continue;
			for(let cell of other.snake) {
				if(player.heading.x==cell.x && player.heading.y==cell.y) {
					return true;
				}
			}
		}
		return false;
	}
	convertToFoods(player: Player){
		for(let i=0; i<player.snake.length-1;i++){
			const cell = player.snake[i];
			this.state.foods.push({x: cell.x+2*i, y: cell.y});
		}
	}
	GameLoop () {
		// console.log("gameloop")
		for( const [id, player] of Object.entries(this.state.players) ) {

			player.heading.x += player.vel.x;
			player.heading.y += player.vel.y;

			if(this.checkHitBoundry(player) || this.checkHitOtherPlayer(player)){
				const sock = this.clients[id];
				if(sock) {
					sock.emit("die");
				}else {
					console.log(`${id} keys=${Object.keys(this.clients)}`);
				}
				this.convertToFoods(player);
				delete this.state.players[id];
			}
			this.checkHitFood(player);
			player.snake.push({ ...player.heading });
			player.snake.shift();
		}

		this.io.emit("gameState", this.state);
		//todo check hit each other
	}
}