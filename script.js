// Table Tennis Pong Game with Sound and Test Button
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // HUD
  const playerScoreEl = document.getElementById('playerScore');
  const computerScoreEl = document.getElementById('computerScore');
  const resetBtn = document.getElementById('resetBtn');
  const testSoundBtn = document.getElementById('testSoundBtn');
  const popSound = document.getElementById('popSound'); // get audio element

  const W = canvas.width;
  const H = canvas.height;

  // Colors
  const colorBlue = '#1976d2';
  const colorRed = '#d32f2f';
  const colorTable = '#bdbdbd'; // grey table
  const colorNet = '#000';      // black net
  const colorBall = '#000';     // black ball

  // Game objects
  const paddleWidth = 12;
  const paddleHeight = 90;
  const paddleOffset = 30;

  const player = {
    x: paddleOffset,
    y: (H - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 7,
    color: colorBlue,
  };

  const computer = {
    x: W - paddleOffset - paddleWidth,
    y: (H - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 5.0, // AI max speed
    color: colorRed,
  };

  const ballRadius = 9;
  let ball = createBall();

  let scores = { player: 0, computer: 0 };

  // Input state
  let keys = { ArrowUp: false, ArrowDown: false };
  let paused = false;

  // Mouse control
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    player.y = clamp(mouseY - player.height / 2, 0, H - player.height);
  });

  // Touch to move paddle (touchmove)
  canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const touchY = touch.clientY - rect.top;
    player.y = clamp(touchY - player.height / 2, 0, H - player.height);
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      paused = !paused;
    }
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      keys[e.code] = true;
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      keys[e.code] = false;
      e.preventDefault();
    }
  });

  resetBtn.addEventListener('click', () => {
    scores.player = 0;
    scores.computer = 0;
    updateScoreboard();
    resetBall();
  });

  // Test sound button
  testSoundBtn.addEventListener('click', () => {
    if (popSound) {
      popSound.currentTime = 0;
      popSound.play();
    }
  });

  // Utilities
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function createBall(directionRight = Math.random() < 0.5) {
    const angle = (Math.random() * 60 - 30) * (Math.PI / 180);
    const speed = 5.3;
    const vx = (directionRight ? 1 : -1) * speed * Math.cos(angle);
    const vy = speed * Math.sin(angle);
    return { x: W / 2, y: H / 2, vx, vy, radius: ballRadius, speed };
  }

  function resetBall(lastWinner = null) {
    const directionRight = lastWinner === 'player' ? true : lastWinner === 'computer' ? false : Math.random() < 0.5;
    ball = createBall(directionRight);
    paused = false;
  }

  function updateScoreboard() {
    playerScoreEl.textContent = scores.player;
    computerScoreEl.textContent = scores.computer;
  }

  function paddleCollision(ball, paddle) {
    const nearestX = clamp(ball.x, paddle.x, paddle.x + paddle.width);
    const nearestY = clamp(ball.y, paddle.y, paddle.y + paddle.height);
    const dx = ball.x - nearestX;
    const dy = ball.y - nearestY;
    return (dx * dx + dy * dy) <= ball.radius * ball.radius;
  }

  function playPop() {
    if (popSound) {
      popSound.currentTime = 0;
      popSound.play();
    }
  }

  function update() {
    if (!paused) {
      if (keys.ArrowUp) player.y -= player.speed;
      if (keys.ArrowDown) player.y += player.speed;
      player.y = clamp(player.y, 0, H - player.height);

      // Computer paddle AI
      const targetY = ball.y - computer.height / 2;
      if (Math.abs(targetY - computer.y) > 2) {
        const dir = targetY > computer.y ? 1 : -1;
        computer.y += dir * computer.speed;
        computer.y = clamp(computer.y, 0, H - computer.height);
      }

      ball.x += ball.vx;
      ball.y += ball.vy;

      // Top/bottom collision (wall)
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = -ball.vy;
        playPop();
      } else if (ball.y + ball.radius >= H) {
        ball.y = H - ball.radius;
        ball.vy = -ball.vy;
        playPop();
      }

      // Left paddle collision
      if (ball.vx < 0 && paddleCollision(ball, player)) {
        ball.x = player.x + player.width + ball.radius;
        reflectOffPaddle(ball, player);
        playPop();
      }

      // Right paddle collision
      if (ball.vx > 0 && paddleCollision(ball, computer)) {
        ball.x = computer.x - ball.radius;
        reflectOffPaddle(ball, computer);
        playPop();
      }

      // Score: ball out of left or right
      if (ball.x + ball.radius < 0) {
        scores.computer++;
        updateScoreboard();
        resetBall('computer');
      } else if (ball.x - ball.radius > W) {
        scores.player++;
        updateScoreboard();
        resetBall('player');
      }
    }
  }

  function reflectOffPaddle(ball, paddle) {
    const paddleCenter = paddle.y + paddle.height / 2;
    const distFromCenter = (ball.y - paddleCenter);
    const normalized = distFromCenter / (paddle.height / 2);
    const maxBounce = 75 * (Math.PI / 180);
    const bounceAngle = normalized * maxBounce;

    ball.speed = Math.min(ball.speed * 1.05, 16);

    const direction = (ball.x < W / 2) ? 1 : -1;
    ball.vx = direction * ball.speed * Math.cos(bounceAngle);
    ball.vy = ball.speed * Math.sin(bounceAngle);

    if (Math.abs(ball.vx) < 1.2) {
      ball.vx = direction * Math.sign(ball.vx || 1) * 1.2;
    }
  }

  function drawNet() {
    ctx.save();
    ctx.strokeStyle = colorNet; // black net
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 14]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawTableLines() {
    ctx.save();
    ctx.strokeStyle = colorNet; // black for table edge lines too
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(W, 4);
    ctx.moveTo(0, H - 4);
    ctx.lineTo(W, H - 4);
    ctx.moveTo(4, 0);
    ctx.lineTo(4, H);
    ctx.moveTo(W - 4, 0);
    ctx.lineTo(W - 4, H);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Table background
    ctx.fillStyle = colorTable;
    ctx.fillRect(0, 0, W, H);

    drawTableLines();
    drawNet();

    drawPaddle(player);
    drawPaddle(computer);

    // Ball
    ctx.beginPath();
    ctx.fillStyle = colorBall; // black
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.shadowColor = '#555';
    ctx.shadowBlur = 5;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Score on table in black
    ctx.fillStyle = '#000';
    ctx.font = 'bold 18px system-ui, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${scores.player} — ${scores.computer}`, W / 2, 30);

    if (paused) {
      ctx.fillStyle = 'rgba(32,32,32,0.30)';
      ctx.fillRect(W / 2 - 120, H / 2 - 30, 240, 60);
      ctx.fillStyle = '#fff';
      ctx.font = '20px system-ui, Arial';
      ctx.fillText('Paused', W / 2, H / 2 + 8);
    }
  }

  function drawPaddle(paddle) {
    ctx.save();
    ctx.fillStyle = paddle.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.2;
    roundRect(ctx, paddle.x, paddle.y, paddle.width, paddle.height, 8);
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  updateScoreboard();
  loop();

  window.pong = {
    resetBall,
    scores,
    setPaused(v) { paused = !!v; },
  };
})();