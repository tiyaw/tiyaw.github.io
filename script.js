/* ============================== Config ============================== */
const config = {
  sentences: [
`Hi, I’m Tiya Wagh, a graphic design generalist. branding, ui/ux, and Emerging Tech are the worlds I play in as a designer.

My journey began with a love for indian artforms. I could spend hours getting lost in intricate lines, vibrant colors, and patterns that are telling stories from centuries ago. That’s where I was first fascinated by storytelling through visuals.

That spark grew when I joined Graphic Design at NID, Ahmedabad. Suddenly, research wasn’t just research, it was detective work. Every project became about asking the right questions, digging deep, and then turning all that curiosity into something with more purpose, meaning, and impact.

But I’ve never been one to stay in one lane. My explorer side nudged me into creative coding, AR/VR, and generative AI. Training models, tinkering with workflows, or bending tech to tell stories all felt like opening new doors to what design could be.

Outside the screen, I swapped design hats for leadership ones, from being an Intercollege Coordinator to a Campus Director for the UN Millennium Fellowship, where I worked on projects tied to the UN Sustainable Development Goals. Turns out, collaboration and purpose can be just as exciting as color palettes.

Then came my exchange semester at RISD, USA, where my world stretched globally. Classrooms, critiques, and conferences, whether it was Harvard XR or Senscape, all became playgrounds for pushing my skills in emerging tech.

Together, NID and RISD shaped my belief that design is a bridge between craft and code, play and purpose, people and possibility. And if there’s one thing about me, it’s that I love adapting because good design doesn’t just sit still; it grows with the context it lives in.`
  ],
  keywords: [
    "graphic design", "branding", "ui/ux",
    "indian artforms", "creative coding",
    "UN Millennium Fellowship"
  ],
  keywordLinks: {
    "graphic design": "https://www.linkedin.com/in/tiyawagh/",
    "branding": "https://www.figma.com/deck/OBua9hNavWCXq5AG7t8fPD/BRANDING-MARKETING-PORTFOLIO?node-id=2007-165&viewport=217%2C251%2C0.07&t=kuEpKFXDALXvAJO8-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1",
    "ui/ux": "https://www.figma.com/deck/nsVcGOgg7yR6TH6dTasCGa/UI-UX-PORTFOLIO-FINAL?node-id=1-5637&viewport=-1233%2C-730%2C0.52&t=qKcs5v3cRcBXueq9-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1",
    "indian artforms": "https://www.figma.com/deck/J25xsvCD2cvrG6JdKbHBVk/INDIAN-ARTFORMS-WORK?node-id=2007-13&p=f&viewport=294%2C305%2C0.05&t=zG84NUo5sC4ikO1l-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1",
    "creative coding": "https://tiyaw.github.io/print-digital/",
    "UN Millennium Fellowship": "https://www.millenniumfellows.org/fellow/2024/nid/tiya-ajay-wagh"
  },
  letterSpacing: 14,
  wordSpacing: 25,
  fadeSpeed: 1.5,
  gravity: 0.5,
  fallDelay: 700,
};

/* ========================== Globals / Matter ======================== */
let trail = [];
let fallingWords = [];
let pendingFalls = [];

const { Engine, Bodies, Composite, Mouse, MouseConstraint, Runner, Body } = Matter;
let engine, world;
let ground = null, leftWall = null, rightWall = null;
let mouseConstraint = null;

// Top-edge collider for the SVG logo
let logoTopEdgeBody = null;
let logoEdgeDims = null;
const EDGE_THICKNESS = 8;

// Text helpers
let fullText;
let charIndex = 0;
let lastPlacedX = -100, lastPlacedY = -100;

// Background color cycling
const backgroundColors = ['#0d001a', '#1a000d', '#001a0d', '#001a1a', '#1a0d00'];
const textColors = ['#ffff00', '#00ffff', '#ff00ff', '#ff8800', '#00aaff'];
let colorIndex = 0;
let lastColorChangeTime = 0;
const colorChangeInterval = 7000;
let fromColor, toColor, fromTextColor, toTextColor;
let transitionProgress = 1.0;
const transitionDuration = 2000;

// Bounce / scroll toggling
const SUPPORT_THRESHOLD = 2;
const BOUNCE_WINDOW_MS = 180;
const BOUNCE_UPWARD_FORCE = 0.003;
const BOUNCE_NEAR_DIST = 60;

// Scroll animation metrics (precomputed to avoid layout reads per frame)
const scrollAnim = {
  distance: 1000,
  startScale: 1.0,
  endScale: 0.55,
  reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
  centerDeltaY: 0
};

// Throttle for syncing the DOM->physics collider
let lastEdgeSync = 0;
const EDGE_SYNC_MS = 33;

let rafId = null;
let supportsOn = true;
let bounceTimer = null;

let navBar;

let keywordMap;
let hasMouseMoved = false; // ADDED: Flag to track initial mouse movement

/* =============================== Classes =========================== */
class WordParticle {
  constructor(word, body) {
    this.word = word;
    this.body = body;
    this.isHovered = false;
  }
  isClicked(mx, my) {
    return Matter.Vertices.contains(this.body.vertices, { x: mx, y: my });
  }
  isNear(mx, my, padding = 20) {
    const b = this.body.bounds;
    return (mx > b.min.x - padding && mx < b.max.x + padding &&
            my > b.min.y - padding && my < b.max.y + padding);
  }
  display() {
    push();
    let currentTextColor;
    if (this.isHovered) {
      currentTextColor = color(255, 255, 255);
    } else if (transitionProgress < 1.0) {
      currentTextColor = lerpColor(fromTextColor, toTextColor, easeInOutCubic(Math.min(transitionProgress, 1.0)));
    } else {
      currentTextColor = color(textColors[colorIndex]);
    }
    fill(currentTextColor);
    noStroke();
    textSize(28);
    textAlign(CENTER, CENTER);
    textFont('Archivo');
    translate(this.body.position.x, this.body.position.y);
    rotate(this.body.angle);
    text(this.word, 0, 0);
    pop();
  }
}

class FadingLetter {
  constructor(x, y, char, angle, id) { this.x = x; this.y = y; this.char = char; this.angle = angle; this.alpha = 255; this.id = id; }
  update() { this.alpha -= config.fadeSpeed; }
  display() {
    push(); noStroke();
    let c = (transitionProgress < 1.0)
      ? lerpColor(fromTextColor, toTextColor, easeInOutCubic(Math.min(transitionProgress, 1.0)))
      : color(textColors[colorIndex]);
    c.setAlpha(this.alpha); fill(c);
    textSize(28); textAlign(CENTER, CENTER); textFont('Archivo');
    translate(this.x, this.y); rotate(this.angle);
    text(this.char, 0, 0);
    pop();
  }
  isFinished() { return this.alpha <= 0; }
}

/* =============================== p5 ================================ */
function setup() {
  createCanvas(windowWidth, windowHeight);
  navBar = document.querySelector('.top-nav');

  fullText = config.sentences.join("").replace(/\s+/g, ' ');

  engine = Engine.create();
  world = engine.world;
  engine.world.gravity.y = config.gravity;

  createWalls();
  ensureSupports();

  const p5Canvas = document.querySelector('canvas');
  const mouse = Mouse.create(p5Canvas);
  mouse.pixelRatio = pixelDensity();
  
  mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
  });
  Composite.add(world, mouseConstraint);

  mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
  mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel); 

  Runner.run(engine);

  keywordMap = new Map();
  config.keywords.forEach(keyword => {
    let startIndex = fullText.indexOf(keyword);
    while (startIndex !== -1) {
      const endIndex = startIndex + keyword.length - 1;
      keywordMap.set(endIndex, { word: keyword, start: startIndex });
      startIndex = fullText.indexOf(keyword, startIndex + 1);
    }
  });

  fromColor = color(backgroundColors[colorIndex]);
  toColor = color(backgroundColors[colorIndex]);
  fromTextColor = color(textColors[colorIndex]);
  toTextColor = color(textColors[colorIndex]);
  lastColorChangeTime = millis();

  computeLayoutMetrics();
  initScrollAnimation();
  requestAnimationFrame(updateScrollAnimation);
}

function draw() {
  if (millis() - lastColorChangeTime > colorChangeInterval) {
    const prev = colorIndex;
    colorIndex = (colorIndex + 1) % backgroundColors.length;
    fromColor = color(backgroundColors[prev]); toColor = color(backgroundColors[colorIndex]);
    fromTextColor = color(textColors[prev]); toTextColor = color(textColors[colorIndex]);
    transitionProgress = 0.0; lastColorChangeTime = millis();
  }
  if (transitionProgress < 1.0) {
    transitionProgress += (Math.max(0, deltaTime) / transitionDuration);
    const currentColor = lerpColor(fromColor, toColor, easeInOutCubic(Math.min(transitionProgress, 1.0)));
    background(currentColor);
  } else {
    background(backgroundColors[colorIndex]);
  }

  handleMouseMovement();

  for (let i = pendingFalls.length - 1; i >= 0; i--) {
    const pending = pendingFalls[i];
    if (millis() - pending.startTime > config.fallDelay) {
      textSize(28); textFont('Archivo');
      const wordWidth = textWidth(pending.word);
      const wordPadding = 10;
      const body = Bodies.rectangle(pending.x, pending.y, wordWidth + wordPadding, 28, {
        friction: 0.5, restitution: 0.2, angle: random(-0.1, 0.1)
      });
      Composite.add(world, body);
      fallingWords.push(new WordParticle(pending.word, body));
      trail.forEach(l => { if (l.id >= pending.startId && l.id <= pending.endId) l.alpha = 0; });
      pendingFalls.splice(i, 1);
    }
  }

  for (let i = trail.length - 1; i >= 0; i--) {
    const l = trail[i];
    l.update(); l.display();
    if (l.isFinished()) trail.splice(i, 1);
  }

  for (const word of fallingWords) word.display();

  for (const w of fallingWords) w.isHovered = false;
  for (let i = fallingWords.length - 1; i >= 0; i--) {
    const w = fallingWords[i];
    if (w.isClicked(mouseX, mouseY)) {
      w.isHovered = true;
      break;
    }
  }

  if (supportsOn) {
    const now = performance.now();
    if (now - lastEdgeSync >= EDGE_SYNC_MS) {
      syncLogoTopEdgeToDOM();
      lastEdgeSync = now;
    }
  }
}

/* ============================ Physics ============================== */
function createWalls() {
  const wallOptions = { isStatic: true, restitution: 0.2, friction: 0.5 };
  const wallThickness = 50;

  ground = Bodies.rectangle(width / 2, height + wallThickness / 2 - 5, width * 2, wallThickness, wallOptions);
  leftWall  = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, wallOptions);
  rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, wallOptions);
  Composite.add(world, [ground, leftWall, rightWall]);
}

function createLogoTopEdgeBody() {
  if (logoTopEdgeBody) {
    Composite.remove(world, logoTopEdgeBody);
    logoTopEdgeBody = null;
    logoEdgeDims = null;
  }
  const logoImg = document.querySelector('.namelogo-svg');
  if (!logoImg) return;

  const rect = logoImg.getBoundingClientRect();
  const targetW = rect.width;
  const targetH = EDGE_THICKNESS;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top - targetH / 2;

  logoTopEdgeBody = Bodies.rectangle(centerX, centerY, targetW, targetH, {
    isStatic: true,
    restitution: 0.2,
    friction: 0.8
  });
  Composite.add(world, logoTopEdgeBody);
  logoEdgeDims = { w: targetW, h: targetH };
}

function syncLogoTopEdgeToDOM() {
  if (!logoTopEdgeBody) return;
  const logoImg = document.querySelector('.namelogo-svg');
  if (!logoImg) return;

  const rect = logoImg.getBoundingClientRect();
  const targetW = rect.width;
  const targetH = EDGE_THICKNESS;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top - targetH / 2;

  if (logoEdgeDims) {
    const sx = targetW / logoEdgeDims.w;
    const sy = targetH / logoEdgeDims.h;
    if (sx !== 1 || sy !== 1) {
      Body.scale(logoTopEdgeBody, sx, sy);
      logoEdgeDims = { w: targetW, h: targetH };
    }
  } else {
    logoEdgeDims = { w: targetW, h: targetH };
  }
  Body.setPosition(logoTopEdgeBody, { x: centerX, y: centerY });
}

/* =========================== Cursor/Text =========================== */
function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function handleMouseMovement() {
  if (!hasMouseMoved) return; // MODIFIED: Stop function if mouse hasn't moved yet
  
  if (navBar && navBar.classList.contains('is-visible')) {
    const navRect = navBar.getBoundingClientRect();
    if (mouseX >= navRect.left && mouseX <= navRect.right && mouseY >= navRect.top && mouseY <= navRect.bottom) {
      return; // Stop drawing the trail if inside the navbar
    }
  }

  if (supportsOn) {
    const logoImg = document.querySelector('.namelogo-svg');
    if (logoImg) {
      const rect = logoImg.getBoundingClientRect();
      if (mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom) {
        return;
      }
    }
  }

    const footerRect = document.querySelector('.footer').getBoundingClientRect();
    if (mouseX >= footerRect.left && mouseX <= footerRect.right && mouseY >= footerRect.top && mouseY <= footerRect.bottom) {
      return; // Stop drawing the trail if inside the footer
    }

  for (let i = fallingWords.length - 1; i >= 0; i--) {
    if (fallingWords[i].isNear(mouseX, mouseY, 20)) return;
  }

  while (dist(mouseX, mouseY, lastPlacedX, lastPlacedY) >
         (fullText[charIndex] === " " ? config.wordSpacing : config.letterSpacing)) {

    const isSpace = fullText[charIndex] === " ";
    const step = isSpace ? config.wordSpacing : config.letterSpacing;

    const angle = atan2(mouseY - lastPlacedY, mouseX - lastPlacedX);
    const newX = lastPlacedX + cos(angle) * step;
    const newY = lastPlacedY + sin(angle) * step;

    const char = fullText[charIndex];
    if (!isSpace) trail.push(new FadingLetter(newX, newY, char, angle, charIndex));

    if (keywordMap.has(charIndex)) {
      const { word, start } = keywordMap.get(charIndex);
      const wordLetters = trail.filter(l => l.id >= start && l.id <= charIndex);
      if (wordLetters.length > 0) {
        const avgX = wordLetters.reduce((s, l) => s + l.x, 0) / wordLetters.length;
        const avgY = wordLetters.reduce((s, l) => s + l.y, 0) / wordLetters.length;
        pendingFalls.push({ word, x: avgX, y: avgY, startTime: millis(), startId: start, endId: charIndex });
      }
    }

    lastPlacedX = newX;
    lastPlacedY = newY;
    charIndex = (charIndex + 1) % fullText.length;
  }
}

// ADDED: New function to handle the first mouse movement
function mouseMoved() {
  if (!hasMouseMoved) {
    // On the very first mouse move, sync the trail's starting
    // position to the current cursor position.
    lastPlacedX = mouseX;
    lastPlacedY = mouseY;
    hasMouseMoved = true;
  }
}

function mousePressed() {
  for (let i = fallingWords.length - 1; i >= 0; i--) {
    const word = fallingWords[i];
    if (word.isClicked(mouseX, mouseY)) {
      const url = config.keywordLinks[word.word];
      if (url) {
        window.open(url, '_blank');

        if (mouseConstraint) {
          mouseConstraint.mouse.button = -1;
          mouseConstraint.body = null;
          mouseConstraint.constraint.bodyB = null;
        }
        
        return;
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (leftWall || rightWall) Composite.remove(world, [leftWall, rightWall]);
  if (ground) Composite.remove(world, ground);
  createWalls();
  computeLayoutMetrics();
  updateSupportsBasedOnScroll();
  updateScrollAnimation();
}

/* ===================== Scroll + Support Toggling ==================== */
function initScrollAnimation() {
  if (scrollAnim.reduceMotion.matches) {
    applyLogoTransform(1);
    updateSupportsBasedOnScroll();
    return;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateSupportsBasedOnScroll();
}

function onScroll() {
  updateSupportsBasedOnScroll();
  if (rafId != null) return;
  rafId = requestAnimationFrame(updateScrollAnimation);
}

function updateScrollAnimation() {
  rafId = null;
  const t = getScrollProgress();
  applyLogoTransform(t);
}

function getScrollProgress() {
  const y = window.scrollY || window.pageYOffset || 0;
  return Math.max(0, Math.min(1, y / scrollAnim.distance));
}

function computeLayoutMetrics() {
  const logo = document.querySelector('.namelogo-svg');
  if (!logo) { scrollAnim.centerDeltaY = 0; return; }
  const rect = logo.getBoundingClientRect();
  const currentCenterY = rect.top + rect.height / 2;
  const viewportCenterY = window.innerHeight / 2;
  scrollAnim.centerDeltaY = viewportCenterY - currentCenterY;
}

function applyLogoTransform(t) {
  const wrapper = document.querySelector('.title-content');
  if (!wrapper) return;
  const eased = easeInOutCubic(t);
  const translateY = scrollAnim.centerDeltaY * eased;
  const scale = scrollAnim.startScale + (scrollAnim.endScale - scrollAnim.startScale) * eased;
  wrapper.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
}

function updateSupportsBasedOnScroll() {
  const y = window.scrollY || window.pageYOffset || 0;
  if (y <= SUPPORT_THRESHOLD) {
    ensureSupports();
  } else if (supportsOn) {
    if (navBar) navBar.classList.add('is-visible'); // <-- ADD THIS LINE
    bounceThenDrop();
  }
}

function ensureSupports() {
  if (bounceTimer) { clearTimeout(bounceTimer); bounceTimer = null; }

  if (navBar) navBar.classList.remove('is-visible'); 

  if (!ground) {
    const wallOptions = { isStatic: true, restitution: 0.2, friction: 0.5 };
    const wallThickness = 50;
    ground = Bodies.rectangle(width / 2, height + wallThickness / 2 - 5, width * 2, wallThickness, wallOptions);
    Composite.add(world, ground);
  }
  if (!logoTopEdgeBody) createLogoTopEdgeBody();
  if (logoTopEdgeBody) logoTopEdgeBody.restitution = 0.2;

  supportsOn = true;
}

function removeSupports() {
  if (logoTopEdgeBody) {
    Composite.remove(world, logoTopEdgeBody);
    logoTopEdgeBody = null;
    logoEdgeDims = null;
  }
  if (ground) {
    Composite.remove(world, ground);
    ground = null;
  }
  supportsOn = false;
}

function bounceThenDrop() {
  if (logoTopEdgeBody) logoTopEdgeBody.restitution = 0.95;

  const edgeY = logoTopEdgeBody ? logoTopEdgeBody.position.y : Infinity;
  for (const wp of fallingWords) {
    const b = wp.body; if (!b) continue;
    if (b.position.y >= edgeY - BOUNCE_NEAR_DIST && b.position.y <= edgeY + 20) {
      Body.applyForce(b, b.position, { x: 0, y: -BOUNCE_UPWARD_FORCE });
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.2);
    }
  }

  if (bounceTimer) clearTimeout(bounceTimer);
  bounceTimer = setTimeout(() => { removeSupports(); bounceTimer = null; }, BOUNCE_WINDOW_MS);
}

/* ===================== Inverting Cursor JS ===================== */
document.addEventListener('DOMContentLoaded', () => {
    const twCursor = document.getElementById('tw-cursor');
    if (!twCursor) return;
    const twCursorInner = twCursor.querySelector('.tw-cursor__inner');
    if (!twCursorInner) return;

    const hasBackdrop =
      CSS.supports('backdrop-filter: invert(1)') ||
      CSS.supports('-webkit-backdrop-filter: invert(1)');
    if (!hasBackdrop) twCursorInner.classList.add('no-backdrop');

    window.addEventListener('pointermove', (e) => {
      twCursor.style.left = e.clientX + 'px';
      twCursor.style.top  = e.clientY + 'px';
      if (twCursor.style.display !== 'block') twCursor.style.display = 'block';
    }, { passive: true });

    document.addEventListener('mouseleave', () => { twCursor.style.display = 'none'; });
    document.addEventListener('mouseenter', () => { twCursor.style.display = 'block'; });
});