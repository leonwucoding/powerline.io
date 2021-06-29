import { GRID_SIZE } from "./constants";
export interface GameState {
	active: boolean;
    players: {
        pos: Position;
        vel: {
            x: number;
            y: number;
        },
        snake: Position[];
    }[],
    food: Position;
    gridsize: number;
}
export interface Position {
    x: number;
    y: number;
}
export function initGame (): GameState {
	const state = createGameState();
	randomFood(state);
	return state;
}
export function createGameState (): GameState {
	return {
		active: false,
		players: [{
			pos: {
				x: 3,
				y: 10
			},
			vel: {
				x: 1,
				y: 0
			},
			snake: [{
				x: 1,
				y: 10
			}, {
				x: 2,
				y: 10
			}, {
				x: 3,
				y: 10
			}],
		},{
			pos: {
				x: 7,
				y: 7
			},
			vel: {
				x: 1,
				y: 0
			},
			snake: [{
				x: 5,
				y: 7
			}, {
				x: 6,
				y: 7
			}, {
				x: 7,
				y: 7
			}],
		}],
		food: {
			x: 7,
			y: 7
		},
		gridsize: GRID_SIZE
	};
}

export function GameLoop (state: GameState):number {
	if(!state) {
		return 0;
	}
	const playerOne = state.players[0];
	const playerTwo = state.players[1];
	playerOne.pos.x +=playerOne.vel.x;
	playerOne.pos.y +=playerOne.vel.y;

	playerTwo.pos.x +=playerTwo.vel.x;
	playerTwo.pos.y +=playerTwo.vel.y;

	if(playerOne.pos.x<0 || playerOne.pos.x>GRID_SIZE || playerOne.pos.y<0 || playerOne.pos.y>GRID_SIZE) {
		return 2;
	}
	if(playerTwo.pos.x<0 || playerTwo.pos.x>GRID_SIZE || playerTwo.pos.y<0 || playerTwo.pos.y>GRID_SIZE) {
		return 1;
	}
	if(state.food.x===playerOne.pos.x && state.food.y===playerOne.pos.y) {
		playerOne.snake.push({...playerOne.pos});
		playerOne.pos.x +=playerOne.vel.x;
		playerOne.pos.y +=playerOne.vel.y;
		randomFood(state);
	}
	if(state.food.x===playerTwo.pos.x && state.food.y===playerTwo.pos.y) {
		playerTwo.snake.push({...playerTwo.pos});
		playerTwo.pos.x +=playerTwo.vel.x;
		playerTwo.pos.y +=playerTwo.vel.y;
		randomFood(state);
	}
	//check player1 touch player2
	for(const cell of playerTwo.snake) {
		if(playerOne.pos.x == cell.x && playerOne.pos.y == cell.y) {
			return 2;
		}
	}
	for(const cell of playerOne.snake) {
		if(playerTwo.pos.x == cell.x && playerTwo.pos.y == cell.y) {
			return 1;
		}
	}
	
	if (playerOne.vel.x || playerOne.vel.y) {
		for(const cell of playerOne.snake) {
			if(cell.x === playerOne.pos.x && cell.y === playerOne.pos.y) {
				return 2;
			}
		}
		playerOne.snake.push({...playerOne.pos});
		playerOne.snake.shift();
	}

	if (playerTwo.vel.x || playerTwo.vel.y) {
		for(const cell of playerTwo.snake) {
			if(cell.x === playerTwo.pos.x && cell.y === playerTwo.pos.y) {
				return 1;
			}
		}
		playerTwo.snake.push({...playerTwo.pos});
		playerTwo.snake.shift();
	}

	return 0;
}

function randomFood (state: GameState): void {
	const food = {
		x: Math.floor(Math.random() * GRID_SIZE),
		y: Math.floor(Math.random() * GRID_SIZE),
	};

	for(const cell of state.players[0].snake) {
		if(cell.x === food.x && cell.y === food.y) {
			return randomFood(state);
		}
	}
	for(const cell of state.players[1].snake) {
		if(cell.x === food.x && cell.y === food.y) {
			return randomFood(state);
		}
	}
	state.food = food;
}