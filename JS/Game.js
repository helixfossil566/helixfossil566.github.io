// get canvas 2D context object
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const canvasDims = { width: 600, height: 900 };

const GLOBALS = {
  score: 0,
  run: true,
  falling: false,
  fall: setInterval(() => {
    if (GLOBALS.start && GLOBALS.run) {
      let a = Math.random(),
        b = Math.random(),
        c = Math.random();
      GLOBALS.falling = true;
      if (a > 0.5 && b > 0.5 && c > 0.5) b = 0;
      if (a > 0.5) GLOBALS.barriers?.one.fall();
      if (b > 0.5) GLOBALS.barriers?.two.fall();
      if (c > 0.5) GLOBALS.barriers?.three.fall();
    }
  }, 3000),
  barriers: {
    one: null,
    two: null,
    three: null
  },
  speed: 4,
  start: false,
  char: {
    x: undefined,
    y: undefined,
    width: undefined,
    height: undefined,
    rotation: -90,
    xOffset: 0,
    direction: undefined
  },
  events: {
    start: [],
    fallen: [],
    death: []
  },
  addEventListener: function (e, c) {
    this.events[e].push(c);
  },
  removeEventListener: function (e) {
    delete this.events[e];
  },
  dispatchEvent: function (e) {
    if (this.events[e]) {
      for (let i of this.events[e]) {
        i();
      }
    }
  }
};

let CHARS;

canvas.addEventListener("click", () => {
  if (!GLOBALS.start) {
    GLOBALS.start = true;
    GLOBALS.dispatchEvent("start");
  }

  if (!GLOBALS.run) {
    // reset game state
    GLOBALS.char.rotation = -90;
    GLOBALS.char.x = undefined;
    GLOBALS.char.y = undefined;
    GLOBALS.char.xOffset = 0;
    GLOBALS.score = 0;
    GLOBALS.direction = undefined;
    GLOBALS.run = true;
  }
});

function init() {
  canvas.width = canvasDims.width;
  canvas.height = canvasDims.height;

  let dims = {
    width: window.innerWidth,
    height: (canvasDims.height / canvasDims.width) * window.innerWidth
  };

  canvas.style.aspectRatio = canvasDims.width / canvasDims.height;

  if (window.innerHeight > dims.height) {
    canvas.style.width = "100%";
    canvas.style.height = "initial";
    canvas.style.top = `calc(50% - ${dims.height + "px"}/2)`;
  } else {
    canvas.style.height = "100%";
    canvas.style.width = "initial";
    canvas.style.top = "initial";
  }

  let { char } = GLOBALS;

  setInterval(() => {
    if (char.direction === "left") {
      if (char.xOffset - 0.7 > -canvas.width / 2) char.xOffset -= 0.7;
      if (char.rotation - 0.2 > -135) char.rotation -= 0.2;
    } else if (char.direction === "right") {
      if (char.xOffset + 0.7 < canvas.width / 2) char.xOffset += 0.7;
      if (char.rotation + 0.2 < -45) char.rotation += 0.2;
    }
  }, 10);

  function left() {
    let i = 30;
    let int = setInterval(() => {
      char.xOffset -= i;
      if (char.rotation - i / 2 > -110) char.rotation -= i / 2;
      i--;
      if (i === 0) clearInterval(int);
    }, 40);
  }

  function right() {
    let i = 30;
    let int = setInterval(() => {
      char.xOffset += i;
      if (char.rotation + i / 2 < -70) char.rotation += i / 2;
      i--;
      if (i === 0) clearInterval(int);
    }, 40);
  }

  addEventListener("keydown", (e) => {
    if (e.keyCode === 37) {
      char.direction = "left";
      left();
    } else if (e.keyCode === 39) {
      char.direction = "right";
      right();
    }
  });

  addEventListener("touchstart", (e) => {
    if (GLOBALS.start) {
      if (e.touches[0].pageX < innerWidth / 2) {
        char.direction = "left";
        left();
      } else {
        char.direction = "right";
        right();
      }
    }
  });
}

class Car {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    GLOBALS.char.width = height;
    GLOBALS.char.height = width;
    this.img = new Image();
    this.img.src =
      "https://www.pngkey.com/png/full/38-388367_28-collection-of-top-view-of-a-car.png";
  }
  render() {
    if (GLOBALS.run) {
      let { x, y, img, width, height } = this;

      const { char } = GLOBALS;
      x += char.xOffset;
      char.x = x;
      char.y = y;

      ctx.lineWidth = 2;
      ctx.translate(x, y);
      ctx.rotate(char.rotation * 0.0174533);
      ctx.translate(-x, -y);
      ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
      ctx.resetTransform();
    }
  }
}

CHARS = [];
CHARS.push(new Car(canvasDims.width / 2, 740, 190, 90));

class Road {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.stripOffset = 0;
    this.animation = setInterval(() => {
      if (this.stripOffset < 900) {
        this.stripOffset += GLOBALS.speed;
      } else {
        this.stripOffset = 0;
      }
    }, 0);
  }
  render() {
    if (GLOBALS.run) {
      const { x, y, stripOffset } = this;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, canvas.width / 3, canvas.height);
      for (let i = -900; i < 10; i++) {
        ctx.strokeRect(
          x + canvas.width / 3 / 2 - 3,
          i * 180 + stripOffset,
          6,
          90
        );
      }
    }
  }
}

GLOBALS.addEventListener("fallen", () => {
  GLOBALS.score++;
});

class Barrier {
  constructor(x) {
    this.img = new Image();
    this.x = x;
    this.y = -this.height;
    this.width = 200;
    this.height = 100;
    this.img.src = "https://static.thenounproject.com/png/2127890-200.png";
    this.collisions = {
      character: "x < cx+cw && x+width > cx && y < cy+ch && y+height > cy",
      walls:
        "GLOBALS.char.x+GLOBALS.char.width/2 < 0 || GLOBALS.char.x-GLOBALS.char.width/2 > canvasDims.width"
    };
  }

  fall() {
    this.y = -this.height;
    let int = setInterval(() => {
      this.y += GLOBALS.speed;
      if (this.y > canvasDims.height) {
        clearInterval(int);
        if (GLOBALS.falling && GLOBALS.run) GLOBALS.dispatchEvent("fallen");
        GLOBALS.falling = false;
      }
    }, 0);
  }

  render() {
    if (GLOBALS.run) {
      let { img, width, height, x, y } = this;
      let { char } = GLOBALS,
        cx = char.x - char.width / 2,
        cy = char.y - char.height / 2,
        cw = char.width,
        ch = char.height;
      if (eval(this.collisions.character) || eval(this.collisions.walls)) {
        GLOBALS.dispatchEvent("death");
      }
      ctx.drawImage(img, x, y, width, height);
    }
  }
}

class Start {
  constructor() {
    this.visible = true;
    this.opacity = 1;
    this.animation = setInterval(() => {
      if (this.visible) {
        this.visible = false;
      } else {
        this.visible = true;
      }
    }, 500);

    GLOBALS.addEventListener("start", () => {
      let int = setInterval(() => {
        if (this.opacity - 0.01 > 0) {
          this.opacity -= 0.01;
        } else {
          clearInterval(int);
          PROPS.pop();
          GLOBALS.removeEventListener("start");
        }
      });
    });
  }
  render() {
    ctx.beginPath();
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.font = "120px Readex Pro";
    ctx.textBaseline = "bottom";
    ctx.textAlign = "center";
    ctx.fillText("DRIFT", 300, 180);
    ctx.font = "25px Readex Pro";
    if (this.visible) ctx.fillText("TAP SCREEN TO START", 300, 220);
    ctx.fill();
    ctx.restore();
  }
}

class Score {
  constructor() {}
  render() {
    if (GLOBALS.run) {
      ctx.font = "120px Readex Pro";
      ctx.textBaseline = "bottom";
      ctx.textAlign = "center";
      if (GLOBALS.score > 0) ctx.fillText(GLOBALS.score, 300, 180);
      ctx.fill();
    } else {
      ctx.font = "120px Readex Pro";
      ctx.textBaseline = "bottom";
      ctx.textAlign = "center";
      ctx.fillText("WASTED", 300, 180);
      ctx.font = "25px Readex Pro";
      ctx.fillText("SCORE: " + GLOBALS.score, 300, 220);
      ctx.fillText("TAP SCREEN TO RESTART", 300, 280);
    }
  }
}

const PROPS = [];
PROPS.push(
  new Road(0, 0),
  new Road(canvasDims.width / 3, 0),
  new Road((canvasDims.width / 3) * 2, 0)
);
GLOBALS.barriers.one = new Barrier(0);
GLOBALS.barriers.two = new Barrier(canvasDims.width / 3);
GLOBALS.barriers.three = new Barrier((canvasDims.width / 3) * 2);
PROPS.push(GLOBALS.barriers.one, GLOBALS.barriers.two, GLOBALS.barriers.three);
PROPS.push(new Score());
PROPS.push(new Start());

GLOBALS.addEventListener("death", () => {
  GLOBALS.run = false;
});

//background elements
function renderBackground() {}

// function for rendering prop objects in PROPS

function renderProps() {
  for (let i of PROPS) i.render();
}

// function for rendering character objects in CHARS
function renderCharacters() {
  for (let i of CHARS) i.render();
}

// function for rendering onscreen controls
function renderControls() {}

// main function to be run for rendering frames
function startFrames() {
  // erase entire canvas
  if (GLOBALS.run) ctx.clearRect(0, 0, canvas.width, canvas.height);

  // render each type of entity in order, relative to layers
  renderBackground();
  renderProps();
  renderCharacters();
  renderControls();

  // rerun function (call next frame)
  window.requestAnimationFrame(startFrames);
}

init(); // initialize game settings
startFrames(); // start running frames


Resources