# Conway's Game of Life

A browser-based recreation of **Conway's Game of Life** using HTML, CSS, JavaScript, and the Canvas API.

The project started as a clean implementation of the classic cellular automaton and is intended to become the foundation for a future game built around evolving grid-based systems.

## Live Demo
Link: https://luisfim.github.io/conway-game-of-life/index.html

## Preview
![Conway's Game of Life preview](preview.jpeg)

## How It Works

The simulation uses a two-dimensional grid of cells.

Each cell can be either:

alive
dead

Every generation, each cell checks its eight neighboring cells and follows Conway's four classic rules:

A live cell with fewer than two live neighbors dies.
A live cell with two or three live neighbors survives.
A live cell with more than three live neighbors dies.
A dead cell with exactly three live neighbors becomes alive.

The project uses two arrays:

one for the current generation
one for the next generation

After calculating the next state, the arrays are swapped.

Technologies Used
HTML
CSS
JavaScript
Canvas API
GitHub Pages
Project Goals
