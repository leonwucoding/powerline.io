import { Server, Socket } from "socket.io";
import { FRAME_RATE, GRID_SIZE } from "./constants";
import { Food, GameState, Player, UserInput } from "./models";
export class Game {
	state: GameState;
	io: Server;
	clients: {[key: string]: Socket};
	constructor(io: Server) {
		this.state = {
			players: {},
			foods: [{pos: {x: 1, y: 1}, bornTime: Date.now()}],
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
			delete this.clients[client.id];
			// const player = this.state.players[client.id];
			// this.removePlayer(player);
		});
		client.on("turn", (data: UserInput) => {
			this.handlePlayerInput(client, data);
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
	handlePlayerInput = (client: Socket, data: UserInput) => {
		// console.log(`${client.id} turn ${direction}`);
		// const clientNumber = (client as any).number;
		const player = this.state.players[data.playerName];
		if(!player) return; //player dead
		switch(data.direction) {
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
		console.log(`addPlayer ${client.id} ${playerName}.`);
		if(!this.state.players[playerName]){
			const colorPicked = this._colors.splice(0,1)[0];
			const newPlayer: Player = {
				id: client.id,
				name: playerName,
				heading: { x: 10, y: 10 },
				vel: { x:1, y:0 },
				snake: [{ x: 10, y: 10 }],
				color: colorPicked,
			};
			this.state.players[playerName] = newPlayer;
		}
		this.clients[client.id] = client;
	}
	removePlayer(player: Player) {
		console.log(`remove player ${player.name}`);
		// const player = this.state.players[player.id];
		this._colors.push(player.color);
		delete this.state.players[player.name];
		// delete this.clients[player.id];
	}
	generateFood (): void {
		const newFood: Food = {pos: {
			x: Math.floor(Math.random() * GRID_SIZE),
			y: Math.floor(Math.random() * GRID_SIZE),
		}, bornTime: Date.now()};
		for( const [id, player] of Object.entries(this.state.players) ) {
			for(const cell of player.snake) {
				if(cell.x === newFood.pos.x && cell.y === newFood.pos.y) {
					return this.generateFood();
				}
			}
		}
		for(const food of this.state.foods) {
			if(food.pos.x === newFood.pos.x && food.pos.y === newFood.pos.y) {
				return this.generateFood();
			}
		}
		this.state.foods.push(newFood);
	}
	checkHitBoundry(player: Player): boolean {
		// console.log("checkHitBoundry");
		if(player.heading.x < 0 || player.heading.x > GRID_SIZE-1 || player.heading.y < 0 || player.heading.y > GRID_SIZE-1) {
			return true;
		}
		return false;
	}
	checkHitFood(player: Player) {
		for(let i=0;i<this.state.foods.length; i++){
			const food = this.state.foods[i];
			// if(food.pos.x === player.heading.x && food.pos.y === player.heading.y) {
			if(Math.abs(food.pos.x - player.heading.x)<=1 && Math.abs(food.pos.y - player.heading.y)<=1) {
				console.log("hit food");
				player.snake.push({ ...player.heading });
				player.heading.x += player.vel.x;
				player.heading.y += player.vel.y;
				this.state.foods.splice(i,1);
			}
		}
	}
	checkHitOtherPlayer(player: Player){
		for(const[name, other] of Object.entries(this.state.players)) {
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

		for(let i=0; i<player.snake.length;i++){
			const cell = player.snake[i];
			let hasFoodHere = false;
			for(let f of this.state.foods){
				if(f.pos.x==cell.x && f.pos.y==cell.y) hasFoodHere = true;
			}
			if(!hasFoodHere){
				this.state.foods.push({pos: {x: cell.x, y: cell.y}, bornTime: Date.now()});
			}
		}
	}
	GameLoop () {
		// console.log("gameloop")
		for( const [name, player] of Object.entries(this.state.players) ) {

			player.heading.x += player.vel.x;
			player.heading.y += player.vel.y;

			if(this.checkHitBoundry(player) || this.checkHitOtherPlayer(player)){
				const sock = this.clients[player.id];
				if(sock) {
					sock.emit("die");
				}
				this.convertToFoods(player);
				this.removePlayer(player);
			}
			this.checkHitFood(player);
			player.snake.push({ ...player.heading });
			player.snake.shift();
		}
		//remove food born more than 30 sec
		const now = Date.now();
		for(let i=0;i<this.state.foods.length; i++){
			const food = this.state.foods[i];
			if(now - food.bornTime>30 * 1000){
				this.state.foods.splice(i,1);
			}
		}
		if(this.state.foods.length<10){
			this.generateFood();
		}
		this.io.emit("gameState", this.state);
		//todo check hit each other
	}
}