import { GRID_SIZE } from "./constants";
export interface GameState {
    player: {
        pos: Position;
        vel: {
            x: number;
            y: number;
        },
        snake: Position[];
    },
    food: Position;
    gridsize: number;
}
export interface Position {
    x: number;
    y: number;
}
export function createGameState(): GameState {
    return {
        player: {
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
        },
        food: {
            x: 7,
            y: 7
        },
        gridsize: GRID_SIZE
    }
}

export function GameLoop(state: GameState){
    if(!state) {
        return;
    }
    const playerOne = state.player;
    playerOne.pos.x +=playerOne.vel.x;
    playerOne.pos.y +=playerOne.vel.y;

    if(playerOne.pos.x<0 || playerOne.pos.x>GRID_SIZE || playerOne.pos.y<0 || playerOne.pos.y>GRID_SIZE){
        return 2
    }
    if(state.food.x===playerOne.pos.x && state.food.y===playerOne.pos.y){
        playerOne.snake.push({...playerOne.pos});
        playerOne.pos.x +=playerOne.vel.x;
        playerOne.pos.y +=playerOne.vel.y;
        randomFood(state);
    }

    if (playerOne.vel.x || playerOne.vel.y){
        for(let cell of playerOne.snake){
            if(cell.x === playerOne.pos.x && cell.y === playerOne.pos.y){
                return 2;
            }
        }

        playerOne.snake.push({...playerOne.pos});
        playerOne.snake.shift();
    }

    return false;
}

function randomFood(state: GameState): void {
    let food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
    }

    for(let cell of state.player.snake){
        if(cell.x === food.x && cell.y === food.y){
            return randomFood(state);
        }
    }

    state.food = food
}