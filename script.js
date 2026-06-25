const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playPauseButton = document.getElementById("playPauseButton");
const stepButton = document.getElementById("stepButton");
const randomButton = document.getElementById("randomButton");
const clearButton = document.getElementById("clearButton");
const gridToggleButton = document.getElementById("gridToggleButton");
const speedSlider = document.getElementById("speedSlider");
const gridSizeSelect = document.getElementById("gridSizeSelect");
const patternSelect = document.getElementById("patternSelect");
const placePatternButton = document.getElementById("placePatternButton");

const generationText = document.getElementById("generationText");
const populationText = document.getElementById("populationText");

// Grid size for the first version.
// Later we can increase this to 250, 500, or 1000.
let gridSize = 100;
let cols = gridSize;
let rows = gridSize;
let cellSize = canvas.width / cols;

let currentGrid = new Uint8Array(cols * rows);
let nextGrid = new Uint8Array(cols * rows);

const patterns = {
  glider: [
    [1, 0],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ],

  blinker: [
    [0, 0],
    [1, 0],
    [2, 0],
  ],

  pulsar: [
    [2, 0], [3, 0], [4, 0], [8, 0], [9, 0], [10, 0],
    [0, 2], [5, 2], [7, 2], [12, 2],
    [0, 3], [5, 3], [7, 3], [12, 3],
    [0, 4], [5, 4], [7, 4], [12, 4],
    [2, 5], [3, 5], [4, 5], [8, 5], [9, 5], [10, 5],

    [2, 7], [3, 7], [4, 7], [8, 7], [9, 7], [10, 7],
    [0, 8], [5, 8], [7, 8], [12, 8],
    [0, 9], [5, 9], [7, 9], [12, 9],
    [0, 10], [5, 10], [7, 10], [12, 10],
    [2, 12], [3, 12], [4, 12], [8, 12], [9, 12], [10, 12],
  ],

  gosper: [
    [24, 0],
    [22, 1], [24, 1],
    [12, 2], [13, 2], [20, 2], [21, 2], [34, 2], [35, 2],
    [11, 3], [15, 3], [20, 3], [21, 3], [34, 3], [35, 3],
    [0, 4], [1, 4], [10, 4], [16, 4], [20, 4], [21, 4],
    [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5], [22, 5], [24, 5],
    [10, 6], [16, 6], [24, 6],
    [11, 7], [15, 7],
    [12, 8], [13, 8],
  ],
};

let isRunning = false;
let showGrid = false;
let isDrawing = false;
let drawMode = 1;
let generation = 0;
let lastUpdateTime = 0;

function getIndex(x, y) {
  return y * cols + x;
}

function countNeighbors(x, y) {
  let count = 0;

  for (let offsetY = -1; offsetY <= 1; offsetY++) {
    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      if (offsetX === 0 && offsetY === 0) {
        continue;
      }

      const neighborX = x + offsetX;
      const neighborY = y + offsetY;

      if (
        neighborX >= 0 &&
        neighborX < cols &&
        neighborY >= 0 &&
        neighborY < rows
      ) {
        const neighborIndex = getIndex(neighborX, neighborY);
        count += currentGrid[neighborIndex];
      }
    }
  }

  return count;
}

function updateSimulation() {
  let population = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const index = getIndex(x, y);
      const isAlive = currentGrid[index] === 1;
      const neighbors = countNeighbors(x, y);

      if (isAlive && (neighbors === 2 || neighbors === 3)) {
        nextGrid[index] = 1;
      } else if (!isAlive && neighbors === 3) {
        nextGrid[index] = 1;
      } else {
        nextGrid[index] = 0;
      }

      population += nextGrid[index];
    }
  }

  const temp = currentGrid;
  currentGrid = nextGrid;
  nextGrid = temp;

  generation++;
  updateStats(population);
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const index = getIndex(x, y);

      if (currentGrid[index] === 1) {
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  if (showGrid) {
    drawGridLines();
  }
}

function drawGridLines() {
  // If the cells are too small, drawing every line makes the canvas look gray.
  // So for large grids, we draw only major grid lines.
  let lineStep = 1;

  if (cellSize < 2) {
    lineStep = 50;
  } else if (cellSize < 4) {
    lineStep = 10;
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 1;

  ctx.beginPath();

  for (let x = 0; x <= cols; x += lineStep) {
    const pixelX = Math.floor(x * cellSize) + 0.5;
    ctx.moveTo(pixelX, 0);
    ctx.lineTo(pixelX, canvas.height);
  }

  for (let y = 0; y <= rows; y += lineStep) {
    const pixelY = Math.floor(y * cellSize) + 0.5;
    ctx.moveTo(0, pixelY);
    ctx.lineTo(canvas.width, pixelY);
  }

  ctx.stroke();
}

function updateStats(population = null) {
  if (population === null) {
    population = 0;

    for (let i = 0; i < currentGrid.length; i++) {
      population += currentGrid[i];
    }
  }

  generationText.textContent = generation;
  populationText.textContent = population;
}

function randomizeGrid() {
  for (let i = 0; i < currentGrid.length; i++) {
    currentGrid[i] = Math.random() > 0.8 ? 1 : 0;
  }

  generation = 0;
  updateStats();
  drawGrid();
}

function clearGrid() {
  currentGrid.fill(0);
  nextGrid.fill(0);

  generation = 0;
  isRunning = false;

  playPauseButton.textContent = "Play";

  updateStats();
  drawGrid();
}

function getCellFromMouse(event) {
  const rect = canvas.getBoundingClientRect();

  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const x = Math.floor(mouseX / cellSize);
  const y = Math.floor(mouseY / cellSize);

  if (x < 0 || x >= cols || y < 0 || y >= rows) {
    return null;
  }

  return { x, y };
}

function setCellFromMouse(event) {
  const cell = getCellFromMouse(event);

  if (cell === null) {
    return;
  }

  const index = getIndex(cell.x, cell.y);
  currentGrid[index] = drawMode;

  updateStats();
  drawGrid();
}

function gameLoop(timestamp) {
  const speed = Number(speedSlider.value);
  const updateInterval = 1000 / speed;

  if (isRunning && timestamp - lastUpdateTime > updateInterval) {
    updateSimulation();
    drawGrid();
    lastUpdateTime = timestamp;
  }

  requestAnimationFrame(gameLoop);
}

function resizeGrid(newSize) {
  gridSize = newSize;
  cols = gridSize;
  rows = gridSize;
  cellSize = canvas.width / cols;

  currentGrid = new Uint8Array(cols * rows);
  nextGrid = new Uint8Array(cols * rows);

  generation = 0;
  isRunning = false;
  playPauseButton.textContent = "Play";

  updateStats();
  drawGrid();
}

function placePattern(patternName) {
  const pattern = patterns[patternName];

  if (!pattern) {
    return;
  }

  let maxX = 0;
  let maxY = 0;

  for (const [x, y] of pattern) {
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  const startX = Math.floor(cols / 2 - maxX / 2);
  const startY = Math.floor(rows / 2 - maxY / 2);

  for (const [x, y] of pattern) {
    const gridX = startX + x;
    const gridY = startY + y;

    if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
      const index = getIndex(gridX, gridY);
      currentGrid[index] = 1;
    }
  }

  updateStats();
  drawGrid();
}

playPauseButton.addEventListener("click", () => {
  isRunning = !isRunning;
  playPauseButton.textContent = isRunning ? "Pause" : "Play";
});

stepButton.addEventListener("click", () => {
  updateSimulation();
  drawGrid();
});

randomButton.addEventListener("click", randomizeGrid);
clearButton.addEventListener("click", clearGrid);

placePatternButton.addEventListener("click", () => {
  placePattern(patternSelect.value);
});

gridSizeSelect.addEventListener("change", () => {
  const newSize = Number(gridSizeSelect.value);
  resizeGrid(newSize);
});

gridToggleButton.addEventListener("click", () => {
  showGrid = !showGrid;
  gridToggleButton.textContent = showGrid ? "Grid: On" : "Grid: Off";
  drawGrid();
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

canvas.addEventListener("mousedown", (event) => {
  isDrawing = true;

  if (event.button === 2) {
    drawMode = 0; // right click removes cells
  } else {
    drawMode = 1; // left click adds cells
  }

  setCellFromMouse(event);
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing) {
    return;
  }

  setCellFromMouse(event);
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

updateStats();
drawGrid();
requestAnimationFrame(gameLoop);
