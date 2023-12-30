# Interactive SVG Renderer

## Overview

This project is an interactive SVG renderer implemented using WebGL. It allows users to load SVG files, view and manipulate the graphics in real-time, and perform operations like zooming, dragging, and drawing additional points. The rendering is achieved through WebGL, providing a dynamic and responsive visualization of SVG content.

## Features

- **SVG File Loading:** Users can choose an SVG file using the file input element. The application reads and parses the SVG file, extracting line elements to render.

- **Interactive Rendering:** The graphics respond to user interactions, such as mouse clicks, drags, and zooms. The application dynamically updates the rendering based on these interactions.

- **Zooming:** Users can zoom in and out of the SVG graphics using the mouse wheel. The application enforces clamping to maintain a reasonable zoom level.

- **Dragging:** The user can drag the rendered graphics, providing a way to explore different parts of the SVG content.

- **Drawing Points:** Right-clicking on the canvas allows users to draw additional points on the graphics. These points are rendered with default colors.

- **Resetting:** Pressing the 'r' key resets the graphics to their initial state, clearing any drawn points and transformations.

## Usage

1. Open the HTML file in a web browser that supports WebGL.
2. Use the file input to choose an SVG file.
3. Interact with the graphics using the mouse:
   - Left-click and drag to pan.
   - Scroll the mouse wheel to zoom in and out.
   - Right-click to draw additional points.
4. Press the 'r' key to reset the graphics.
