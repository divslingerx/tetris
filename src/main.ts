import { Vector2d } from "./types";
import "./styles/index.css";

const CANVAS_WIDTH = 240;
const CANVAS_HEIGHT = 400;
const SCALE_FACTOR = 20;
const PIECES = ["T", "O", "J", "I", "Z", "J"];

const createCanvas = () => {
  let canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "canvas";
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    document.body.appendChild(canvas);
  }
  return canvas;
};
const getContext = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("2d context not found");
  }
  context.scale(SCALE_FACTOR, SCALE_FACTOR);
  return context;
};

const canvas = createCanvas();
const context = getContext(canvas);

context.scale(20, 20);

const randomPiece = () =>
  createPiece(PIECES[(PIECES.length * Math.random()) | 0]);

const arenaSweep = () => {
  let rowCount = 1;

  outer: for (let y = arena.length - 1; y > 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;

    player.score += rowCount * 10;
    rowCount *= 2;
  }
};

const drawBackground = (color: string) => {
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
};

const clearScreen = () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
};

type Matrix = number[][];
const createMatrix = (width: number, height: number) => {
  const matrix = [];
  while (height--) {
    matrix.push(new Array(width).fill(0));
  }
  return matrix;
};

const drawMatrix = (matrix: Matrix, offset: Vector2d) => {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = pallet[value] as string;
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
};

const collide = (arena: Matrix, player: Player) => {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        console.log("true");
        return true;
      }
    }
  }
  console.log("false");
  return false;
};

const merge = (arena: Matrix, player: Player) => {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
};

const playerDrop = () => {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
  }
  dropCounter = 0;
};

const createPiece = (type: string): Matrix => {
  switch (type) {
    case "T":
      return [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ];
      break;
    case "O":
      return [
        [2, 2],
        [2, 2],
      ];
      break;
    case "L":
      return [
        [0, 3, 0],
        [0, 3, 3],
        [0, 3, 0],
      ];
      break;
    case "J":
      return [
        [0, 4, 0],
        [0, 4, 0],
        [4, 4, 0],
      ];
      break;
    case "I":
      return [
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
      ];
      break;
    case "S":
      return [
        [0, 6, 6],
        [0, 6, 0],
        [6, 6, 0],
      ];
      break;
    case "Z":
      return [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
      ];
      break;
    default:
      throw new Error("Invalid piece type");
  }
};

const pallet = [
  null,
  "#FF0D72",
  "#0Dc2FF",
  "#0DFF72",
  "#F538FF",
  "#FF8E0D",
  "#FFE138",
  "#3877FF",
];

const arena = createMatrix(12, 20);

interface Player {
  pos: Vector2d;
  matrix: Matrix;
  score: number;
}
const player: Player = {
  pos: { x: 5, y: 5 },
  matrix: randomPiece(),
  score: 0,
};

const playerMove = (dir: number) => {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
};

const gameOver = () => {
  arena.forEach((row) => row.fill(0));
  player.score = 0;
  updateScore();
};

const playerReset = () => {
  const pieces = ["T", "O", "J", "I", "Z", "J"];
  player.matrix = createPiece(pieces[(pieces.length * Math.random()) | 0]);
  player.pos.y = 0;
  player.pos.x =
    ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);
  if (collide(arena, player)) {
    gameOver();
  }
};
const rotate = (matrix: Matrix, dir: number) => {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach((row) => row.reverse());
  } else {
    matrix.reverse();
  }
};
const playerRotate = (dir: number) => {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
};

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;
const update = (time = 0) => {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
    dropCounter = 0;
  }

  draw();
  requestAnimationFrame(update);
};

const updateScore = () => {
  let score = document.getElementById("score");
  if (!score) {
    score = document.createElement("div");
    score.id = "score";
    document.body.appendChild(score);
  }

  score.innerText = player.score.toString();
};

const draw = () => {
  clearScreen();
  drawBackground("#000");
  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
};

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    playerMove(-1);
  } else if (e.key === "ArrowRight") {
    playerMove(1);
  } else if (e.key === "q" || e.key === "Q") {
    playerRotate(-1);
  } else if (e.key === "w" || e.key === "W") {
    playerRotate(-1);
  } else if (e.key === "ArrowDown") {
    playerDrop();
  }
});

playerReset();
updateScore();
update();
