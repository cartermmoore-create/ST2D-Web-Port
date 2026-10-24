(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = 960, H = 600;
  const world = { w: 2400, h: 1800 };
  const hudPods = document.getElementById('pods');
  const hudStamina = document.getElementById('stamina-fill');
  const hudStatus = document.getElementById('status-line');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayText = document.getElementById('overlay-text');
  const overlayButton = document.getElementById('overlay-button');
  const overlaySecondary = document.getElementById('overlay-secondary');
  const pauseButton = document.getElementById('pause-button');
  const touchControls = document.getElementById('touch-controls');

  const down = new Set();
  const touchKeys = new Set();
  let mode = 'menu';
  let mapOpen = false;
  let flashlightOn = true;
  let stamina = 100;
  let collected = 0;
  let lastTime = 0;
  let aim = { x: 1, y: 0 };
  let hasPointerAim = false;
  let camera = { x: 0, y: 0 };
  let player, monster, trees, rocks, custards, groundMarks;
  let playTime = 0;

  function randomGenerator(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function makeWorld() {
    const random = randomGenerator(4262026);
    trees = [];
    rocks = [];
    groundMarks = [];
    custards = [];
    for (let i = 0; i < 360; i++) {
      groundMarks.push({
        x: random() * world.w,
        y: random() * world.h,
        r: 2 + random() * 18,
        shade: random()
      });
    }
    for (let i = 0; i < 92; i++) {
      const t = { x: 70 + random() * (world.w - 140), y: 70 + random() * (world.h - 140),
        r: 18 + random() * 15, seed: random() };
      if (Math.hypot(t.x - 180, t.y - 180) > 150 &&
          Math.hypot(t.x - (world.w - 210), t.y - (world.h - 190)) > 130) trees.push(t);
    }
    for (let i = 0; i < 48; i++) {
      const r = { x: 55 + random() * (world.w - 110), y: 55 + random() * (world.h - 110),
        r: 6 + random() * 10, shade: random() };
      if (!blocked(r.x, r.y, r.r + 5)) rocks.push(r);
    }
    let safety = 0;
    while (custards.length < 10 && safety++ < 3000) {
      const c = { x: 100 + random() * (world.w - 200), y: 100 + random() * (world.h - 200),
        found: false, pulse: random() * Math.PI * 2 };
      if (Math.hypot(c.x - 180, c.y - 180) < 250) continue;
      if (Math.hypot(c.x - (world.w - 210), c.y - (world.h - 190)) < 180) continue;
      if (blocked(c.x, c.y, 28)) continue;
      if (custards.some(q => distance(q, c) < 210)) continue;
      custards.push(c);
    }
  }

  function blocked(x, y, radius) {
    if (x < 24 + radius || y < 24 + radius || x > world.w - 24 - radius || y > world.h - 24 - radius) return true;
    if (trees && trees.some(t => Math.hypot(x - t.x, y - t.y) < t.r + radius * 0.72)) return true;
    if (rocks && rocks.some(r => Math.hypot(x - r.x, y - r.y) < r.r + radius * 0.5)) return true;
    return false;
  }

  function resetGame() {
    makeWorld();
    player = { x: 180, y: 180, r: 9, face: -Math.PI / 2 };
    monster = { x: world.w - 210, y: world.h - 190, r: 12, face: Math.PI };
    camera = { x: 0, y: 0 };
    stamina = 100;
    collected = 0;
    playTime = 0;
    flashlightOn = true;
    mapOpen = false;
    aim = { x: 0.8, y: -0.6 };
    hasPointerAim = false;
    updateHud();
  }

  function showOverlay(title, text, button, secondary) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlayButton.textContent = button;
    overlaySecondary.textContent = secondary || '';
    overlaySecondary.style.display = secondary ? 'inline-flex' : 'none';
    overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function startGame() {
    resetGame();
    mode = 'playing';
    hideOverlay();
    canvas.focus();
    hudStatus.textContent = 'FIND THE CUSTARDS';
  }

  function updateHud() {
    hudPods.textContent = String(collected).padStart(2, '0') + ' / 10';
    hudStamina.style.width = Math.round(stamina) + '%';
  }

  function update(dt) {
    if (mode !== 'playing') return;
    playTime += dt;
    let dx = 0, dy = 0;
    if (down.has('KeyA') || down.has('ArrowLeft') || touchKeys.has('left')) dx--;
    if (down.has('KeyD') || down.has('ArrowRight') || touchKeys.has('right')) dx++;
    if (down.has('KeyW') || down.has('ArrowUp') || touchKeys.has('up')) dy--;
    if (down.has('KeyS') || down.has('ArrowDown') || touchKeys.has('down')) dy++;
    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      const len = Math.hypot(dx, dy);
      dx /= len; dy /= len;
      player.face = Math.atan2(dy, dx);
    }

    const wantsRun = down.has('ShiftLeft') || down.has('ShiftRight') || touchKeys.has('run');
    const running = wantsRun && moving && stamina > 2;
    const speed = running ? 158 : 94;
    if (running) stamina = Math.max(0, stamina - 31 * dt);
    else stamina = Math.min(100, stamina + 17 * dt);

    const nx = player.x + dx * speed * dt;
    if (!blocked(nx, player.y, player.r)) player.x = nx;
    const ny = player.y + dy * speed * dt;
    if (!blocked(player.x, ny, player.r)) player.y = ny;

    if (moving && !hasPointerAim) {
      aim.x = dx; aim.y = dy;
    }

    if (monster) {
      const vx = player.x - monster.x, vy = player.y - monster.y;
      const dist = Math.hypot(vx, vy) || 1;
      const mSpeed = dist < 360 ? 72 : 54;
      const angle = Math.atan2(vy, vx);
      monster.face = angle;
      const candidates = [angle, angle + 0.72, angle - 0.72, angle + 1.25, angle - 1.25];
      let moved = false;
      for (const a of candidates) {
        const tx = monster.x + Math.cos(a) * mSpeed * dt;
        const ty = monster.y + Math.sin(a) * mSpeed * dt;
        if (!blocked(tx, monster.y, monster.r)) {
          monster.x = tx;
          if (!blocked(monster.x, ty, monster.r)) monster.y = ty;
          moved = true;
          break;
        }
        if (!blocked(monster.x, ty, monster.r)) {
          monster.y = ty;
          moved = true;
          break;
        }
      }
      if (!moved && dist < 550) {
        const tx = monster.x + Math.cos(angle) * mSpeed * dt;
        const ty = monster.y + Math.sin(angle) * mSpeed * dt;
        monster.x = Math.max(30, Math.min(world.w - 30, tx));
        monster.y = Math.max(30, Math.min(world.h - 30, ty));
      }
      if (dist < 19) {
        mode = 'lost';
        showOverlay('CAUGHT', 'Something found you in the dark. The custards are still out there.', 'TRY AGAIN', 'BACK TO TITLE');
        hudStatus.textContent = 'SIGNAL LOST';
      }
    }

    for (const c of custards) {
      if (!c.found && Math.hypot(player.x - c.x, player.y - c.y) < 24) {
        c.found = true;
        collected++;
        updateHud();
      }
    }
    if (collected >= 10 && mode === 'playing') {
      mode = 'won';
      showOverlay('ALL FOUND', 'You collected every custard. The forest has gone quiet… for now.', 'PLAY AGAIN', 'BACK TO TITLE');
      hudStatus.textContent = 'OBJECTIVE COMPLETE';
    }

    camera.x = Math.max(0, Math.min(world.w - W, player.x - W / 2));
    camera.y = Math.max(0, Math.min(world.h - H, player.y - H / 2));
    updateHud();
  }

  function drawGround() {
    ctx.fillStyle = '#151c17';
    ctx.fillRect(0, 0, W, H);
    const tile = 56;
    const startX = Math.floor(camera.x / tile) * tile;
    const startY = Math.floor(camera.y / tile) * tile;
    for (let wy = startY; wy < camera.y + H + tile; wy += tile) {
      for (let wx = startX; wx < camera.x + W + tile; wx += tile) {
        const hash = ((Math.floor(wx / tile) * 73856093) ^ (Math.floor(wy / tile) * 19349663)) >>> 0;
        const shade = hash % 5;
        ctx.fillStyle = ['#172019', '#19231b', '#182119', '#1b241c', '#141d17'][shade];
        ctx.fillRect(wx - camera.x, wy - camera.y, tile + 1, tile + 1);
      }
    }
    for (const m of groundMarks) {
      if (m.x < camera.x - 20 || m.x > camera.x + W + 20 || m.y < camera.y - 20 || m.y > camera.y + H + 20) continue;
      ctx.fillStyle = m.shade > 0.5 ? 'rgba(67,75,47,.12)' : 'rgba(4,9,7,.22)';
      ctx.beginPath();
      ctx.ellipse(m.x - camera.x, m.y - camera.y, m.r * 1.4, m.r * .7, m.shade * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // A broken, muddy trail gives the landscape a little structure.
    ctx.save();
    ctx.strokeStyle = 'rgba(54,48,38,.38)';
    ctx.lineWidth = 74;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(75 - camera.x, 285 - camera.y);
    ctx.bezierCurveTo(440 - camera.x, 350 - camera.y, 520 - camera.x, 700 - camera.y, 925 - camera.x, 650 - camera.y);
    ctx.bezierCurveTo(1350 - camera.x, 600 - camera.y, 1450 - camera.x, 1040 - camera.y, 1880 - camera.x, 960 - camera.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawTree(t) {
    const x = t.x - camera.x, y = t.y - camera.y;
    if (x < -80 || x > W + 80 || y < -80 || y > H + 80) return;
    ctx.fillStyle = 'rgba(0,0,0,.42)';
    ctx.beginPath();
    ctx.ellipse(x + 7, y + 13, t.r * 1.2, t.r * .7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#342f25';
    ctx.fillRect(x - 5, y - 1, 11, 21);
    ctx.fillStyle = '#223022';
    ctx.beginPath();
    ctx.arc(x, y - 7, t.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a3929';
    ctx.beginPath();
    ctx.arc(x - t.r * .22, y - t.r * .25, t.r * .7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(106,119,73,.14)';
    ctx.beginPath();
    ctx.arc(x - t.r * .26, y - t.r * .38, t.r * .35, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRock(r) {
    const x = r.x - camera.x, y = r.y - camera.y;
    if (x < -30 || x > W + 30 || y < -30 || y > H + 30) return;
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(x + 3, y + 5, r.r * 1.2, r.r * .8, .2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = r.shade > .5 ? '#30352c' : '#252c25';
    ctx.beginPath(); ctx.ellipse(x, y, r.r, r.r * .78, r.shade * 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(150,157,122,.12)';
    ctx.beginPath(); ctx.ellipse(x - 2, y - 3, r.r * .45, r.r * .2, -.3, 0, Math.PI * 2); ctx.fill();
  }

  function drawCustard(c) {
    if (c.found) return;
    const x = c.x - camera.x, y = c.y - camera.y;
    const pulse = 1 + Math.sin(playTime * 3 + c.pulse) * .08;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(111,204,228,.17)';
    ctx.beginPath(); ctx.arc(0, -2, 23, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3d83a3';
    ctx.beginPath(); ctx.ellipse(0, 5, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#76e9e0';
    ctx.beginPath(); ctx.moveTo(-10, 1); ctx.lineTo(-7, -9); ctx.quadraticCurveTo(0, -15, 7, -9); ctx.lineTo(10, 1); ctx.quadraticCurveTo(0, 7, -10, 1); ctx.fill();
    ctx.fillStyle = '#c7fff2';
    ctx.beginPath(); ctx.ellipse(-2, -8, 4, 2, -.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawCharacter(ch, color, scary) {
    const x = ch.x - camera.x, y = ch.y - camera.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ch.face + Math.PI / 2);
    ctx.fillStyle = 'rgba(0,0,0,.48)';
    ctx.beginPath(); ctx.ellipse(1, 5, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
    // Feet and small rounded body, built from canvas shapes rather than external textures.
    ctx.fillStyle = scary ? '#393247' : '#667e88';
    ctx.fillRect(-7, 2, 5, 8);
    ctx.fillRect(2, 2, 5, 8);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = scary ? '#4b4057' : '#91a9ae';
    ctx.beginPath(); ctx.ellipse(-2, -2, 4, 7, -.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = scary ? '#51445d' : '#738b91';
    ctx.beginPath(); ctx.arc(0, -9, 7, 0, Math.PI * 2); ctx.fill();
    // Antenna.
    ctx.strokeStyle = scary ? '#5f4d68' : '#8da9ad';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -20); ctx.stroke();
    ctx.fillStyle = scary ? '#d34a54' : '#b4d4d4';
    ctx.beginPath(); ctx.arc(0, -21, 2.4, 0, Math.PI * 2); ctx.fill();
    // Face.
    ctx.fillStyle = scary ? '#d5ccd5' : '#d3d9cf';
    ctx.beginPath(); ctx.ellipse(0, -9, 5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = scary ? '#a32836' : '#141a1b';
    ctx.beginPath(); ctx.arc(-2, -10, 1.3, 0, Math.PI * 2); ctx.arc(2, -10, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = scary ? '#54121c' : '#1b2424';
    ctx.fillRect(-1.5, -7, 3, 2);
    ctx.restore();
  }

  function drawLight() {
    const px = player.x - camera.x, py = player.y - camera.y;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.91)';
    ctx.fillRect(0, 0, W, H);
    if (flashlightOn) {
      ctx.globalCompositeOperation = 'destination-out';
      let g = ctx.createRadialGradient(px, py, 5, px, py, 120);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(.6, 'rgba(0,0,0,.87)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px, py, 120, 0, Math.PI * 2); ctx.fill();

      const dir = Math.atan2(aim.y, aim.x);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, 330, dir - .55, dir + .55);
      ctx.closePath();
      const cone = ctx.createRadialGradient(px, py, 28, px, py, 330);
      cone.addColorStop(0, 'rgba(0,0,0,.88)');
      cone.addColorStop(.58, 'rgba(0,0,0,.56)');
      cone.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cone;
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(204,236,203,.04)';
      ctx.beginPath(); ctx.moveTo(px, py);
      ctx.arc(px, py, 330, dir - .55, dir + .55); ctx.closePath(); ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      const g = ctx.createRadialGradient(px, py, 0, px, py, 45);
      g.addColorStop(0, 'rgba(0,0,0,.42)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px, py, 45, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // Soft edge vignette.
    const vignette = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 600);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,.28)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  function drawMiniMap() {
    if (!mapOpen) return;
    const mw = 190, mh = 135, x = W - mw - 18, y = 70;
    ctx.save();
    ctx.fillStyle = 'rgba(7,10,9,.88)';
    ctx.fillRect(x, y, mw, mh);
    ctx.strokeStyle = 'rgba(190,211,193,.55)';
    ctx.strokeRect(x, y, mw, mh);
    for (const t of trees) {
      const tx = x + t.x / world.w * mw, ty = y + t.y / world.h * mh;
      ctx.fillStyle = '#354231'; ctx.fillRect(tx, ty, 2, 2);
    }
    for (const c of custards) {
      if (!c.found) {
        ctx.fillStyle = '#7be7db';
        ctx.fillRect(x + c.x / world.w * mw - 2, y + c.y / world.h * mh - 2, 4, 4);
      }
    }
    ctx.fillStyle = '#f4f4da';
    ctx.beginPath(); ctx.arc(x + player.x / world.w * mw, y + player.y / world.h * mh, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e74755';
    ctx.beginPath(); ctx.arc(x + monster.x / world.w * mw, y + monster.y / world.h * mh, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawGround();
    for (const r of rocks) drawRock(r);
    for (const t of trees) drawTree(t);
    for (const c of custards) drawCustard(c);
    if (monster) drawCharacter(monster, '#352b41', true);
    if (player) drawCharacter(player, '#869eaa', false);
    if (player && monster) drawLight();
    drawMiniMap();
    if (mode === 'playing') {
      // Fine scanlines evoke an old handheld night-vision display without obscuring gameplay.
      ctx.fillStyle = 'rgba(195,225,203,.018)';
      for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
      if (!flashlightOn) {
        ctx.fillStyle = 'rgba(126,20,31,.08)';
        ctx.fillRect(0, 0, W, H);
      }
    }
  }

  function frame(now) {
    const dt = Math.min(.04, (now - (lastTime || now)) / 1000);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function setAimFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const mx = (event.clientX - rect.left) * W / rect.width;
    const my = (event.clientY - rect.top) * H / rect.height;
    if (!player) return;
    const px = player.x - camera.x, py = player.y - camera.y;
    const dx = mx - px, dy = my - py;
    const len = Math.hypot(dx, dy);
    if (len > 4) {
      aim.x = dx / len;
      aim.y = dy / len;
      hasPointerAim = true;
    }
  }

  canvas.addEventListener('pointermove', setAimFromEvent);
  canvas.addEventListener('pointerdown', event => {
    if (mode === 'playing') setAimFromEvent(event);
  });

  document.addEventListener('keydown', event => {
    const code = event.code;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(code)) event.preventDefault();
    if (code === 'Escape' && mode === 'playing') {
      mode = 'paused';
      showOverlay('PAUSED', 'Catch your breath. The forest is still out there.', 'RESUME', 'RESTART');
      return;
    }
    if (code === 'KeyM' && mode === 'playing') mapOpen = !mapOpen;
    if (code === 'Space' && !down.has(code) && mode === 'playing') flashlightOn = !flashlightOn;
    down.add(code);
  });
  document.addEventListener('keyup', event => down.delete(event.code));
  window.addEventListener('blur', () => { down.clear(); touchKeys.clear(); });

  overlayButton.addEventListener('click', () => {
    if (mode === 'menu' || mode === 'lost' || mode === 'won') {
      startGame();
    } else if (mode === 'paused') {
      mode = 'playing';
      hideOverlay();
      canvas.focus();
    }
  });
  overlaySecondary.addEventListener('click', () => {
    mode = 'menu';
    showOverlay('SLENDYTUBBIES 2D', 'A fan-made browser recreation of the dark exploration and custard-collecting gameplay. Find all 10 before the creature reaches you.', 'START GAME', '');
  });
  pauseButton.addEventListener('click', () => {
    if (mode === 'playing') {
      mode = 'paused';
      showOverlay('PAUSED', 'Catch your breath. The forest is still out there.', 'RESUME', 'RESTART');
    }
  });

  document.querySelectorAll('[data-key]').forEach(button => {
    const key = button.dataset.key;
    const start = event => { event.preventDefault(); touchKeys.add(key); button.classList.add('pressed'); };
    const end = event => { event.preventDefault(); touchKeys.delete(key); button.classList.remove('pressed'); };
    button.addEventListener('pointerdown', start);
    button.addEventListener('pointerup', end);
    button.addEventListener('pointercancel', end);
    button.addEventListener('pointerleave', end);
  });
  document.getElementById('light-button').addEventListener('click', () => { if (mode === 'playing') flashlightOn = !flashlightOn; });
  document.getElementById('map-button').addEventListener('click', () => { if (mode === 'playing') mapOpen = !mapOpen; });

  function fitCanvas() {
    const ratio = W / H;
    const holder = document.getElementById('stage');
    const maxW = Math.min(holder.clientWidth, 1200);
    const maxH = Math.min(window.innerHeight * .72, 760);
    let cw = maxW, ch = cw / ratio;
    if (ch > maxH) { ch = maxH; cw = ch * ratio; }
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
  }
  window.addEventListener('resize', fitCanvas);

  resetGame();
  fitCanvas();
  showOverlay('SLENDYTUBBIES 2D', 'A fan-made browser recreation of the dark exploration and custard-collecting gameplay. Find all 10 before the creature reaches you.', 'START GAME', '');
  if (window.matchMedia('(pointer: coarse)').matches) touchControls.classList.add('show');
  requestAnimationFrame(frame);
})();