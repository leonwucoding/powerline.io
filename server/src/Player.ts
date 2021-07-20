import { Socket } from "socket.io";
import { GRID_SIZE,BG_COLOR,FOOD_COLOR } from "./constants";
import { Game } from "./game";
import { Food, GameState, IPlayerState, Position, positionEqual } from "./models";
const colors = ["#ffe6f7", "#bf73ff", "#36badf","#08c96b","#f0dbb7","#beff11"];
const colorDefault = "purple";
function ColorsAreClose(color1: string, color2: string, threshold = 50)
{
	const r1 = parseInt(color1.replace("#","").substring(0,2),16)
	const g1 = parseInt(color1.replace("#","").substring(2,4),16)
    const b1 = parseInt(color1.replace("#","").substring(4,6),16)
	const r2 = parseInt(color2.replace("#","").substring(0,2),16)
	const g2 = parseInt(color2.replace("#","").substring(2,4),16)
    const b2 = parseInt(color2.replace("#","").substring(4,6),16)

    return ((r1 - r2) * (r1 - r2) + (b1 - b2) * (b1 - b2) + (g1 - g2) * (g1 - g2)) <= threshold * threshold;
}
export class Player {
	id: string;
    renderState: IPlayerState;
    heading: Position;
	hasInput: boolean;
    velocity: Position;
	socket?: Socket;
    // get id(){
    //     return this.id;
    // }
    get name(){
        return this.renderState.name;
    }
    get snake(){
        return this.renderState.snake;
    }
	randomColor():string{
		const random_num = Math.random() * 255 * 255 * 255;
		const color =  "#" + Math.floor(random_num).toString(16);
		for(let p of this.game.players){
			if(p.id == this.id) continue;
			if(ColorsAreClose(color, p.renderState.color)){
				return this.randomColor();
			}

		}
		if(ColorsAreClose(color,BG_COLOR) || ColorsAreClose(color,FOOD_COLOR)){
			return this.randomColor();
		}else{
			return color;
		}
	}
	game: Game;
	randomPosition(){
		return { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
	}
    constructor(game: Game, socket?: Socket, playerName?: string){
		this.game = game;
		this.socket = socket;
        this.heading = this.randomPosition();
		this.hasInput = false;
        this.velocity = { x:1, y:0 };
		const name = this.randomName();
		this.id = socket ? socket.id : name;
		this.renderState = {
            name: playerName || name ,
            snake: [Object.assign({}, this.heading)],
            color: this.randomColor(),
        };
    }
	handleInput = (direction: string) => {
		if(this.hasInput) return;
		switch(direction) {
		case "Right":
			if(this.velocity.y != 0) {
				this.velocity = { x: 1, y: 0 };
			}
			break; 
		case "Left":
			if(this.velocity.y != 0) {
				this.velocity = { x: -1, y: 0 };
			}
			break; 
		case "Up":
			if(this.velocity.x != 0) {
				this.velocity = { x: 0, y: -1 };
			}
			break; 
		case "Down":
			if(this.velocity.x != 0) {
				this.velocity = { x: 0, y: 1 };
			}
			break; 
		}
	}
    notifyRender(gameState: GameState){
        this.socket && this.socket.emit("gameState", gameState);
    }
    notifyDead(){
        this.socket && this.socket.emit("die");
    }
	noTurnSteps: number = 0;
    move(){
		if(positionEqual(this.heading, this.snake[this.snake.length - 1])){
			console.log("just ate food, skip this move");
		}else{
			this.snake.push({ ...this.heading });
			this.renderState.snake.shift();
		}
        this.heading.x += this.velocity.x;
        this.heading.y += this.velocity.y;
        this.hasInput = false;
		console.log("move--snake");
		console.log(this.snake);
		console.log("move--heading");
		console.log(this.heading);
		if(!this.socket){
			//it's a robot
			if(this.noTurnSteps < 5){
				this.noTurnSteps++;
			}else{
				//random direction
				const i = Math.floor(Math.random() * 4);
				const directs = ["Left","Right","Up","Down"];
				console.log(`random direction: ${directs[i]}`);
				this.handleInput(directs[i]);
			}
		}
    }
	randomName(): string{
		//97
		//65
		let word = this.randomLetter(true);
		for (let i = 0; i < 1 + Math.random() * 10; i++) {
			word += this.randomLetter();
		}
		return word;
	}
	randomLetter(isCapital?: boolean): string{
		return String.fromCharCode((isCapital ? 65 : 97) + Math.floor(Math.random() * 26));
	}
    checkHitBoundry(): boolean {
		if(this.heading.x < 0 || this.heading.x > GRID_SIZE - 1 || this.heading.y < 0 || this.heading.y > GRID_SIZE - 1) {
			return true;
		}
		return false;
	}
    checkHitFoods(foods: Food[]) {
		let i = 0;
		while(i < foods.length){
			const food = foods[i];
			if(this.canEatFood(food)) {
				// console.log("hit food");
				this.snake.push({ ...this.heading });
				// this.heading.x += this.velocity.x;
				// this.heading.y += this.velocity.y;
				console.log("eat food");
				console.log(this.snake);
				foods.splice(i,1);
				return;
			}else{
				i++;
			}
		}
	}
    checkHitPlayer(player: Player){
		for(let cell of player.snake) {
            if(positionEqual(this.heading, cell)) {
                return true;
            }
        }
		return false;
	}
    convertToFoods(existingFoods: Food[]){
        const result: Food[] = [];
		for(let i = 0; i < this.renderState.snake.length;i++){
			const cell = this.renderState.snake[i];
			let hasFoodHere = false;
			for(let f of existingFoods){
				if(f.pos.x == cell.x && f.pos.y == cell.y) hasFoodHere = true;
			}
			if(!hasFoodHere){
				result.push({pos: {x: cell.x, y: cell.y}, bornTime: Date.now()});
			}
		}
        return result;
	}
    canEatFood(food: Food){
		if(Math.abs(food.pos.x - this.heading.x) <= 1 && Math.abs(food.pos.y - this.heading.y) <= 1) {
			return true;
		}
		return false;
	}
}