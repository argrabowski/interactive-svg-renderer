// input variables
let doc;
let gl;
let canvas;
let input;
let down = false;
let moving = false;

// matrix variables
let points = [];
let colors = [];
let drawn = 0;
let projMat;
let modMat;
let vertPos;
let vertCol;

// color variables
let red;
let green;
let blue;

// projection variables
let lProj = -1;
let rProj = 1;
let bProj = -1;
let tProj = 1;
let svgWidth = 1;
let svgHeight = 1;
let aspectRatio = 1;
let vportWidth;
let vportHeight;

// model variables
let dragX = 0;
let dragY = 0;
let offX = 0;
let offY = 0;
let tranX = 0;
let tranY = 0;
let zoomX = 0;
let zoomY = 0;
let zoomMult = 1;

// main function
function main() {
  // retrieve document elements
  canvas = document.getElementById("webgl");
  input = document.getElementById("chooseFile");

  // get the rendering context for WebGL
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  // initialize shaders
  program = initShaders(gl, "vshader", "fshader");
  gl.useProgram(program);

  // initialize projection
  init();

  // initialize model matrix
  let scaleMat = scalem(zoomMult, zoomMult, 1.0);
  let tranMat = translate(dragX + zoomX, dragY + zoomY, 0.0);
  modMat = mult(scaleMat, tranMat);

  // set up event listeners
  input.addEventListener("change", chooseFile);
  document.addEventListener("keypress", reset);
  canvas.addEventListener("wheel", zoom);

  // event listeners for mouse events
  canvas.addEventListener("mousedown", (event) => {
    // set down and moving
    down = true;
    moving = false;

    // get mouse coordinates
    let mouse = position(canvas, event);
    offX = mouse.x;
    offY = mouse.y;
  });
  canvas.addEventListener("mousemove", drag);
  canvas.addEventListener("mouseup", (event) => {
    // set to down and set translation
    down = false;
    tranX = dragX + zoomX;
    tranY = dragY + zoomY;
  });
  canvas.addEventListener("contextmenu", draw);
}

// read and parse chosen file function
function chooseFile(event) {
  clear();
  let file = event.target.files[0];
  let fileStr;

  // initialize file reader and check if svg file
  let reader = new FileReader();
  try {
    if (!file.name.includes(".svg")) {
      alert("Must be an svg file!");
      gl.clear(gl.COLOR_BUFFER_BIT);
      input.value = "";
      return;
    }
  } catch {
    console.log("Request canceled");
    return;
  }

  // read text from file and reader successful
  reader.readAsText(file);
  reader.onload = function () {
    // set raw file string
    fileStr = reader.result;

    // initialize DOM parser and parse XML document
    let parser = new DOMParser();
    doc = parser.parseFromString(fileStr, "image/svg+xml");

    // check for error node
    const errorNode = doc.querySelector("parsererror");
    if (errorNode) {
      console.log(errorNode);
    }

    // add points and colors from svg
    svg(doc);
  };

  // reader failed
  reader.onerror = function () {
    console.log(reader.error);
  };
}

// get svg points and colors function
function svg(doc) {
  // reset points and get line elements
  points = [];
  colors = [];
  let lines = doc.getElementsByTagName("line");
  for (let i = 0; i < lines.length; i++) {
    // get position attributes
    let x1 = parseFloat(lines[i].getAttribute("x1"));
    let y1 = parseFloat(lines[i].getAttribute("y1"));
    let x2 = parseFloat(lines[i].getAttribute("x2"));
    let y2 = parseFloat(lines[i].getAttribute("y2"));

    // add line to points list
    points.push(vec4(x1, y1, 0.0, 1.0));
    points.push(vec4(x2, y2, 0.0, 1.0));

    // get stroke attribute and convert rgb
    let stroke = lines[i].getAttribute("stroke");
    if (stroke) {
      // parse hex strings and convert to correct scale
      let strArr = stroke.substring(1).match(/.{2}/g);
      red = parseInt(strArr[0], 16) / 255.0;
      green = parseInt(strArr[1], 16) / 255.0;
      blue = parseInt(strArr[2], 16) / 255.0;
    } else {
      red = 0.0;
      green = 0.0;
      blue = 0.0;
    }

    // add colors to color list
    colors.push(vec4(red, green, blue, 1.0));
    colors.push(vec4(red, green, blue, 1.0));
  }

  // clear and draw svg file
  gl.clear(gl.COLOR_BUFFER_BIT);
  init();
  render();
}

// keypress event function
function reset(event) {
  let key = event.key;
  switch (key) {
    case "r":
      // initialize and render
      clear();
      render();
  }
}

// wheel event function
function zoom(event) {
  // get mouse coordinates
  let mouse = position(canvas, event);

  // storage variables to enforce clamping
  let storeX = zoomX;
  let storeY = zoomY;

  // increment or decrement multiplier if zoom in or out
  if (event.deltaY > 0) {
    zoomMult -= 0.1;
    zoomX += (0.1 * mouse.x + 0.1 * tranX) / zoomMult;
    zoomY += (0.1 * mouse.y + 0.1 * tranY) / zoomMult;
  } else {
    zoomMult += 0.1;
    zoomX -= (0.1 * mouse.x + 0.1 * tranX) / zoomMult;
    zoomY -= (0.1 * mouse.y + 0.1 * tranY) / zoomMult;
  }

  // enforce zoom clamping
  if (zoomMult > 10) {
    zoomMult = 10;
    zoomX = storeX;
    zoomY = storeY;
  } else if (zoomMult < 0.1) {
    zoomMult = 0.1;
    zoomX = storeX;
    zoomY = storeY;
  }

  // check if variables are out of bounds
  if (zoomX > 100 || zoomY > 100) {
    zoomX = storeX;
    zoomY = storeY;
  }

  // render function
  render();
}

// mousemove event function
function drag(event) {
  // check if down and set to moving
  if (!down) return;
  moving = true;

  // get mouse coordinates
  let mouse = position(canvas, event);

  // increment drag and set offset
  dragX += mouse.x - offX;
  dragY += mouse.y - offY;
  offX = mouse.x;
  offY = mouse.y;

  // render function
  render();
}

// contextmenu event function
function draw(event) {
  // disable context menu
  event.preventDefault();

  // get mouse coordinates
  let mouse = position(canvas, event);

  // add point and default color to points list
  points.push(vec4(mouse.x, mouse.y, 0.0, 1.0));
  colors.push(vec4(0.0, 0.0, 0.0, 1.0));
  drawn += 1;

  // render function
  render();
}

// clear transformations function
function clear() {
  // clear drawn points their colors
  for (let i = 0; i < drawn; i++) {
    points.pop();
    colors.pop();
  }

  // clear transformation variables
  drawn = 0;
  dragX = 0;
  dragY = 0;
  zoomX = 0;
  zoomY = 0;
  offX = 0;
  offY = 0;
  zoomMult = 1;
}

// get mouse position function
function position(canvas, event) {
  let rect = canvas.getBoundingClientRect();
  return {
    // calculation accounts for model and projection transformations
    x: ((2 / vportWidth) * (event.clientX - rect.left - (canvas.width - vportWidth)) - 1) / (2 / (rProj - lProj)) / zoomMult - tranX + (rProj + lProj) / (2 * zoomMult),
    y: -(((2 / vportHeight) * (event.clientY - rect.top - (canvas.height - vportHeight)) - 1) / (2 / (tProj - bProj)) / zoomMult + tranY - (tProj + bProj) / (2 * zoomMult)),
  };
}

// initialize projection function
function init() {
  // get svg element and viewBox attribute
  let viewBox;
  if (doc) {
    let svg = doc.getElementsByTagName("svg");
    viewBox = svg[0].getAttribute("viewBox");
  }

  // get projection matrix
  if (viewBox) {
    // parse viewBox to floats and set up boundaries
    let view = viewBox.split(" ").map((i) => parseFloat(i));
    lProj = view[0];
    rProj = view[0] + view[2];
    bProj = view[1] + view[3];
    tProj = view[1];

    // set svg width and height
    svgWidth = view[2];
    svgHeight = view[3];
  } else {
    lProj = -1;
    rProj = 1;
    bProj = -1;
    tProj = 1;

    // set svg width and height
    svgWidth = 1;
    svgHeight = 1;
  }
  projMat = ortho(lProj, rProj, bProj, tProj, -1, 1);

  // apply projection matrix
  let projMatLoc = gl.getUniformLocation(program, "projMat");
  gl.uniformMatrix4fv(projMatLoc, false, flatten(projMat));

  // get aspect ratio
  aspectRatio = svgWidth / svgHeight;

  // set up viewport
  if (svgWidth > svgHeight) {
    vportWidth = canvas.width;
    vportHeight = canvas.width / aspectRatio;
  } else if (svgWidth < svgHeight) {
    vportWidth = canvas.height * aspectRatio;
    vportHeight = canvas.height;
  } else {
    vportWidth = canvas.width;
    vportHeight = canvas.height;
  }
  // account for x-axis offset
  gl.viewport(canvas.width - vportWidth, 0, vportWidth, vportHeight);
}

// render svg function
function render() {
  // get model matrix
  scaleMat = scalem(zoomMult, zoomMult, 1.0);
  tranMat = translate(dragX + zoomX, dragY + zoomY, 0.0);
  modMat = mult(scaleMat, tranMat);

  // apply model matrix
  let modMatLoc = gl.getUniformLocation(program, "modMat");
  gl.uniformMatrix4fv(modMatLoc, false, flatten(modMat));

  // store vertex data in buffer
  let pointsBuff = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuff);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  // connect and enable data
  vertPos = gl.getAttribLocation(program, "vertPos");
  gl.enableVertexAttribArray(vertPos);
  gl.vertexAttribPointer(vertPos, 4, gl.FLOAT, false, 0, 0);

  // store color data in buffer
  let colBuff = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colBuff);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  // connect and enable data
  let vertCol = gl.getAttribLocation(program, "vertCol");
  gl.enableVertexAttribArray(vertCol);
  gl.vertexAttribPointer(vertCol, 4, gl.FLOAT, false, 0, 0);

  // clear and draw lines to screen
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.LINES, 0, points.length);
  gl.drawArrays(gl.POINTS, 0, points.length);
}
