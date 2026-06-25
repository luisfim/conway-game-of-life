const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playPauseButton = document.getElementById("playPauseButton");
const stepButton = document.getElementById("stepButton");
const randomButton = document.getElementById("randomButton");
const clearButton = document.getElementById("clearButton");
const gridToggleButton = document.getElementById("gridToggleButton");
const speedSlider = document.getElementById("speedSlider");
const gridSizeSelect = document.getElementById("gridSizeSelect");

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

updateStats();
drawGrid();
requestAnimationFrame(gameLoop);
