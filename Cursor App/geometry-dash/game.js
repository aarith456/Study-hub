const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

const W = canvas.width
const H = canvas.height
const GROUND_Y = H - 80
const GRAVITY = 0.85
const JUMP = -14
const SCROLL_SPEED = 6
const PLAYER_SIZE = 36

// Game state
let state = 'menu' // menu | playing | dead
let cameraX = 0
let score = 0
let best = parseInt(localStorage.getItem('gd-best') || '0', 10)

const player = {
  x: 120,
  y: GROUND_Y - PLAYER_SIZE,
  vy: 0,
  size: PLAYER_SIZE,
  rotation: 0,
  onGround: true,
}

// Level: obstacles as { type, x, y?, w?, h? }
// type: 'spike' | 'block' | 'platform'
const level = [
  { type: 'spike', x: 400 },
  { type: 'spike', x: 520 },
  { type: 'block', x: 650, w: 40, h: 120 },
  { type: 'spike', x: 780 },
  { type: 'spike', x: 900 },
  { type: 'spike', x: 1020 },
  { type: 'platform', x: 1150, y: GROUND_Y - 100, w: 120, h: 20 },
  { type: 'spike', x: 1320 },
  { type: 'block', x: 1450, w: 50, h: 80 },
  { type: 'spike', x: 1580 },
  { type: 'spike', x: 1700, y: GROUND_Y - 60 },
  { type: 'spike', x: 1820 },
  { type: 'platform', x: 1950, y: GROUND_Y - 140, w: 100, h: 20 },
  { type: 'spike', x: 2100 },
  { type: 'spike', x: 2220 },
  { type: 'spike', x: 2340 },
  { type: 'block', x: 2480, w: 60, h: 150 },
  { type: 'spike', x: 2620 },
  { type: 'spike', x: 2740 },
  { type: 'spike', x: 2860 },
  { type: 'platform', x: 3000, y: GROUND_Y - 90, w: 150, h: 20 },
  { type: 'spike', x: 3200 },
  { type: 'spike', x: 3320 },
  { type: 'spike', x: 3440 },
  { type: 'spike', x: 3560 },
  { type: 'spike', x: 3680 },
  { type: 'block', x: 3820, w: 40, h: 200 },
  { type: 'spike', x: 3950 },
  { type: 'spike', x: 4100 },
  { type: 'spike', x: 4250 },
]

const LEVEL_END = 4500

function reset() {
  cameraX = 0
  score = 0
  player.x = 120
  player.y = GROUND_Y - PLAYER_SIZE
  player.vy = 0
  player.rotation = 0
  player.onGround = true
}

function jump() {
  if (state === 'menu') {
    state = 'playing'
    reset()
    return
  }
  if (state === 'dead') {
    state = 'playing'
    reset()
    return
  }
  if (state === 'playing' && player.onGround) {
    player.vy = JUMP
    player.onGround = false
  }
}

function getObstacleScreenX(obs) {
  return obs.x - cameraX
}

function rectCollide(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2)
  const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3)
  const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

function checkCollision() {
  const px = player.x
  const py = player.y
  const ps = player.size
  const pad = 4

  for (const obs of level) {
    const sx = getObstacleScreenX(obs)
    if (sx < -100 || sx > W + 100) continue

    if (obs.type === 'spike') {
      const spikeY = obs.y ?? GROUND_Y - 40
      const spikeH = 40
      const spikeW = 40
      const cx = sx + spikeW / 2
      const top = spikeY
      const left = sx
      const right = sx + spikeW
      const bottom = spikeY + spikeH
      if (
        pointInTriangle(px + pad, py + ps - pad, cx, top, left, bottom, right, bottom) ||
        pointInTriangle(px + ps - pad, py + ps - pad, cx, top, left, bottom, right, bottom) ||
        pointInTriangle(px + pad, py + pad, cx, top, left, bottom, right, bottom) ||
        pointInTriangle(px + ps - pad, py + pad, cx, top, left, bottom, right, bottom)
      ) {
        return true
      }
    }

    if (obs.type === 'block') {
      const bw = obs.w ?? 40
      const bh = obs.h ?? 80
      const by = GROUND_Y - bh
      if (rectCollide(px + pad, py + pad, ps - pad * 2, ps - pad * 2, sx, by, bw, bh)) {
        return true
      }
    }

    // Platforms are for landing only, not death (handled in updatePlatforms)
  }
  return false
}

function updatePlatforms() {
  player.onGround = false
  const px = player.x
  const py = player.y
  const ps = player.size

  // Ground
  if (player.vy >= 0 && py + ps >= GROUND_Y) {
    player.y = GROUND_Y - ps
    player.vy = 0
    player.onGround = true
  }

  // Platforms (land on top only)
  for (const obs of level) {
    if (obs.type !== 'platform') continue
    const sx = getObstacleScreenX(obs)
    if (sx < -200 || sx > W + 200) continue
    const pw = obs.w ?? 100
    const ph = obs.h ?? 20
    const pyPlat = obs.y ?? GROUND_Y - 80
    if (
      player.vy >= 0 &&
      py + ps >= pyPlat &&
      py + ps <= pyPlat + ph + 8 &&
      px + ps > sx + 4 &&
      px < sx + pw - 4
    ) {
      player.y = pyPlat - ps
      player.vy = 0
      player.onGround = true
    }
  }
}

function update() {
  if (state !== 'playing') return

  cameraX += SCROLL_SPEED
  score = Math.floor(cameraX / 10)
  if (score > best) {
    best = score
    localStorage.setItem('gd-best', String(best))
  }

  player.vy += GRAVITY
  player.y += player.vy
  player.rotation += 0.12

  updatePlatforms()

  if (checkCollision()) {
    state = 'dead'
  }

  if (cameraX >= LEVEL_END) {
    state = 'menu'
    reset()
  }
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#0d0d1a')
  grad.addColorStop(1, '#151528')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Grid lines (parallax)
  ctx.strokeStyle = 'rgba(100, 100, 255, 0.08)'
  ctx.lineWidth = 1
  const offset = (cameraX * 0.5) % 40
  for (let x = -offset; x < W + 40; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
}

function drawGround() {
  ctx.fillStyle = '#2a2a4a'
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y)
  ctx.strokeStyle = '#00ffcc'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, GROUND_Y)
  ctx.lineTo(W, GROUND_Y)
  ctx.stroke()
}

function drawSpike(sx, y) {
  const spikeY = y ?? GROUND_Y - 40
  ctx.fillStyle = '#ff3366'
  ctx.strokeStyle = '#ff6699'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sx + 20, spikeY)
  ctx.lineTo(sx, spikeY + 40)
  ctx.lineTo(sx + 40, spikeY + 40)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}

function drawBlock(sx, w, h) {
  const bw = w ?? 40
  const bh = h ?? 80
  const by = GROUND_Y - bh
  ctx.fillStyle = '#ffcc00'
  ctx.strokeStyle = '#ffee66'
  ctx.lineWidth = 2
  ctx.fillRect(sx, by, bw, bh)
  ctx.strokeRect(sx, by, bw, bh)
}

function drawPlatform(sx, y, w, h) {
  const pw = w ?? 100
  const ph = h ?? 20
  const py = y ?? GROUND_Y - 80
  ctx.fillStyle = '#00ccff'
  ctx.strokeStyle = '#66eeff'
  ctx.lineWidth = 2
  ctx.fillRect(sx, py, pw, ph)
  ctx.strokeRect(sx, py, pw, ph)
}

function drawObstacles() {
  for (const obs of level) {
    const sx = getObstacleScreenX(obs)
    if (sx < -80 || sx > W + 80) continue
    if (obs.type === 'spike') drawSpike(sx, obs.y)
    if (obs.type === 'block') drawBlock(sx, obs.w, obs.h)
    if (obs.type === 'platform') drawPlatform(sx, obs.y, obs.w, obs.h)
  }
}

function drawPlayer() {
  ctx.save()
  ctx.translate(player.x + player.size / 2, player.y + player.size / 2)
  ctx.rotate(player.rotation)
  ctx.fillStyle = '#00ffcc'
  ctx.strokeStyle = '#66ffee'
  ctx.lineWidth = 2
  ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size)
  ctx.strokeRect(-player.size / 2, -player.size / 2, player.size, player.size)
  ctx.restore()
}

function drawUI() {
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 24px system-ui'
  ctx.textAlign = 'left'
  ctx.fillText(`Score: ${score}`, 20, 40)
  ctx.fillStyle = '#888'
  ctx.font = '16px system-ui'
  ctx.fillText(`Best: ${best}`, 20, 65)

  if (state === 'menu') {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#00ffcc'
    ctx.font = 'bold 48px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('GEOMETRY DASH', W / 2, H / 2 - 30)
    ctx.fillStyle = '#fff'
    ctx.font = '20px system-ui'
    ctx.fillText('Press SPACE or CLICK to start', W / 2, H / 2 + 20)
  }

  if (state === 'dead') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#ff3366'
    ctx.font = 'bold 40px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('YOU DIED', W / 2, H / 2 - 20)
    ctx.fillStyle = '#fff'
    ctx.font = '18px system-ui'
    ctx.fillText(`Score: ${score}  |  Best: ${best}`, W / 2, H / 2 + 20)
    ctx.fillText('Press SPACE or CLICK to retry', W / 2, H / 2 + 55)
  }
}

function draw() {
  drawBackground()
  drawGround()
  drawObstacles()
  if (state === 'playing' || state === 'dead') drawPlayer()
  drawUI()
}

function loop() {
  update()
  draw()
  requestAnimationFrame(loop)
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault()
    jump()
  }
})

canvas.addEventListener('click', jump)
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault()
  jump()
}, { passive: false })

loop()
