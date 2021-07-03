export interface Player {
	id: string;
	name: string;
	heading: Position;
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
    foods: Food[];
    gridsize: number;
}
export interface Position {
    x: number;
    y: number;
}
export interface Food {
    pos: Position;
    bornTime: number;
}
export interface UserInput {
    playerName: string; 
    direction: "Right" | "Left" | "Down" | "Up"
}