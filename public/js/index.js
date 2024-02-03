const canvas = document.getElementById('myCanvas')
const ctx = canvas.getContext('2d')

const socket = io()

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio

const w = canvas.width
const h = canvas.height

const frontEndPlayers = {}
let generateBoardRN = false;

/*
socket.on('connect', () => {
  console.log("CONNECT")
})
*/

socket.on('updatePlayers', (backEndPlayers) => {
  for (const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id]

    // if this player doesn't exist, add them as an object
    if (!frontEndPlayers[id]) {
      frontEndPlayers[id] = {
        board: backEndPlayer.board,
        username: backEndPlayer.username,
        ready: backEndPlayer.ready
      }
    } else { // if this player exists, update boards and ready status from backend
      if (generateBoardRN || id !== socket.id) {
        frontEndPlayers[id].board = backEndPlayer.board
      }
      frontEndPlayers[id].ready = backEndPlayer.ready
      frontEndPlayers[id].timeStarted = backEndPlayer.timeStarted
      frontEndPlayers[id].finished = backEndPlayer.finished
      frontEndPlayers[id].won = backEndPlayer.won
      frontEndPlayers[id].timeEnded = backEndPlayer.timeEnded
    }
  }

  // remove players who don't exist in the backend (were disconnected)
  for (const id in frontEndPlayers) {
    if (!backEndPlayers[id]) {
      //const divToDelete = document.querySelector(`div[data-id="${id}"]`)
      //divToDelete.parentNode.removeChild(divToDelete)

      if (id === socket.id) { // display username form if this player on frontend dies
        document.querySelector('#usernameForm').style.display = 'block'
      }

      delete frontEndPlayers[id]
    }
  }

  //console.log(frontEndPlayers)
})

const correctList = [
  [1, 0, 0], [2, 0, 1], [3, 0, 2], [4, 0, 3],
  [5, 1, 0], [6, 1, 1], [7, 1, 2], [8, 1, 3],
  [9, 2, 0], [10, 2, 1], [11, 2, 2], [12, 2, 3],
  [13, 3, 0], [14, 3, 1], [15, 3, 2]]

function correctSpot(number, r, c) {
  for (var i = 0; i < correctList.length; i++) {
    if (number === correctList[i][0]) {
      if (r === correctList[i][1] && c === correctList[i][2]) {
        return true;
      } else {
        return false;
      }
    }
  }
  return false;
}
function cStr(text, ctx, x, y, width, height, font, fontSize) {
  ctx.font = fontSize.toString() + "px " + font
  const textMetrics = ctx.measureText(text);
  ctx.fillText(text, x + (width - textMetrics.width) / 2, y + (height + textMetrics.actualBoundingBoxAscent - textMetrics.actualBoundingBoxDescent) / 2)
}
function secondsToTime(sec) {
  var mins = Math.trunc(sec/60)
  var secs = (sec - 60 * mins).toFixed(2)
  if (secs >= 10) {
    return mins + ":" + secs
  } else {
    return mins + ":0" + secs
  }
}

let stage = "lobby";
let waitingForNext = true;
let countdownStopwatch = 0;
let oppID = "";

let btnX = 0;
let btnY = 0;
let btnW = 0;
let btnH = 0;

const shift = 0.26 * w;
const separation = 0.00549 * h;
const txtSize = 0.11 * h;

let imgs = {};

let animationId
async function animate() {
  animationId = requestAnimationFrame(animate)

  // light: 255, 252, 236
  // dark: 54, 54, 54
  ctx.fillStyle = 'rgba(54, 54, 54, 1)'
  ctx.fillRect(0, 0, w, h)
  // 1920 x 911

  if (!frontEndPlayers[socket.id]) {
    ctx.fillStyle = 'rgba(255, 255, 255, 1)'
    cStr("Kihei's", ctx, 0, 0, w, 550, "arial", txtSize*0.5)
    cStr("15 Puzzle!", ctx, 0, 0, w, 710, "arial", txtSize*0.7)
  } else {
    let size = 0.82 * h;

    // outline
    ctx.fillStyle = 'rgba(128, 115, 110, 1)'
    ctx.fillRect((w-size)/2 - shift, (h-size)/2, size, size)
    ctx.fillRect((w-size)/2 + shift, (h-size)/2, size, size)
    size -= 30;

    let left = (w-size)/2 - shift;
    let top = (h-size)/2;
    let tileSize = size / 4;

    // inner box
    ctx.fillStyle = 'rgba(191, 181, 166, 1)'
    ctx.fillRect(left, top, size, size)
    ctx.fillRect(left + 2*shift, top, size, size)

    ctx.fillStyle = 'rgba(255, 255, 255, 1)'

    if (stage === "lobby" || (stage === "gameover" && waitingForNext)) {
      if (oppID !== "" && frontEndPlayers[socket.id].ready && frontEndPlayers[oppID].ready) {
        cStr("3", ctx, 0, 0, w, h, "arial", txtSize)
        generateBoardRN = true;
        socket.emit('generateBoard');
        socket.emit('resetGame');
        waitingForNext = false;
        stage = "countdown";
        countdownStopwatch = Date.now();
      } else {
        cStr("vs", ctx, 0, 0, w, h, "arial", txtSize)
      }
    } else if (stage === "countdown") {
      let currTime = Date.now();
      if (currTime - countdownStopwatch >= 0 && currTime - countdownStopwatch < 1000) {
        cStr("3", ctx, 0, 0, w, h, "arial", txtSize)
      } else if (currTime - countdownStopwatch >= 1000 && currTime - countdownStopwatch < 2000) {
        cStr("2", ctx, 0, 0, w, h, "arial", txtSize)
      } else if (currTime - countdownStopwatch >= 2000 && currTime - countdownStopwatch < 3000) {
        cStr("1", ctx, 0, 0, w, h, "arial", txtSize)
        generateBoardRN = false;
      } else if (currTime - countdownStopwatch >= 3000) {
        cStr("GO!", ctx, 0, 0, w, h, "arial", txtSize)
        stage = "game";
        frontEndPlayers[socket.id].timeStarted = currTime;
        socket.emit('time', currTime);
      }
    } else if (stage === "game") {
      cStr("GO!", ctx, 0, 0, w, h, "arial", txtSize)
    } else if (stage === "gameover") {
      cStr("vs", ctx, 0, 0, w, h, "arial", txtSize)
    }

    for (const id in frontEndPlayers) {

      var board = frontEndPlayers[id].board;

      // set correct x values for board and stuff (depending which player it is)
      if (id === socket.id) {
        left = (w-size)/2 - shift;
        
        // define button position
        btnX = left + size/2 - 0.065*w
        btnY = 0.917*h
        btnW = 0.13*w
        btnH = 0.076*h
      } else {
        left = (w-size)/2 + shift;
        oppID = id; // set opponent ID
      }

      // ready buttons
      ctx.fillStyle = 'rgba(191, 181, 166, 1)'
      ctx.fillRect(left + size/2 - 0.065*w, 0.917*h, 0.13*w, 0.076*h)
      if (frontEndPlayers[id].ready) {
        ctx.fillStyle = 'rgba(0, 255, 0, 1)'
      } else {
        ctx.fillStyle = 'rgba(255, 0, 0, 1)'
      }
      cStr("Ready", ctx, left + size/2 - 0.065*w, 0.917*h, 0.13*w, 0.076*h, "arial", txtSize*0.5)

      var currentX = left
      var currentY = top

      // draw tiles
      for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
          var num = board[r][c]
          if (num !== 0) {
            if (correctSpot(num, r, c)) {
              ctx.fillStyle = 'rgba(149, 255, 143, 1)'
            } else {
              ctx.fillStyle = 'rgba(240, 255, 143, 1)'
            }

            // tile
            ctx.fillRect(currentX + separation, currentY + separation, tileSize - separation*2, tileSize - separation*2);
            
            // number text
            ctx.fillStyle = 'rgba(40, 41, 38, 1)'
            cStr(num.toString(), ctx, currentX, currentY, tileSize, tileSize, "arial", txtSize)
          }
          currentX += tileSize;
        }
        currentY += tileSize;
        currentX = left;
      }
      
      // usernames
      ctx.fillStyle = 'rgba(255, 255, 255, 1)'
      var the_name = frontEndPlayers[id].username;
      if (the_name === "") {
        if (id === socket.id) {
          the_name = "You"
        } else {
          the_name = "Player 2"
        }
      }
      cStr(the_name, ctx, left, top - 0.45*h, size, size, "arial", txtSize*0.6)

      let currTime = Date.now();
      if (stage === "game") {

        if (id === socket.id) {
          // check for win (if this is your board)
          let playerBoard = frontEndPlayers[id].board;
          let counter = 0;
          let playerFinished = true;
          for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 4; c++) {
              counter++;
              if (playerBoard[r][c] > 0 && playerBoard[r][c] !== counter) {
                playerFinished = false;
                r = 5;
                break;
              }
            }
          }

          if (playerFinished) {
            stage = "gameover";
            frontEndPlayers[id].finished = true;
            frontEndPlayers[id].timeEnded = currTime;
            frontEndPlayers[id].ready = false;
            socket.emit('newReadyStatus', false);

            if (!frontEndPlayers[oppID].finished) { // you won
              frontEndPlayers[id].won = true;
              socket.emit("playerFinished", true, currTime);
              
            } else { // you lost
              frontEndPlayers[id].won = false;
              socket.emit("playerFinished", false, currTime);

              waitingForNext = true;
            }
          }

          ctx.fillStyle = 'rgba(255, 255, 255, 1)'
          cStr(secondsToTime((currTime - frontEndPlayers[id].timeStarted)/1000), ctx, left + size/2 + 0.065*w, 0.917*h, 0.13*w, 0.076*h, "arial", txtSize*0.5)
        } else {
          // not the current frontend player
          if (frontEndPlayers[id].finished) {
            ctx.fillStyle = 'rgba(255, 255, 255, 1)'
            cStr(secondsToTime((frontEndPlayers[id].timeEnded - frontEndPlayers[id].timeStarted)/1000), ctx, left + size/2 + 0.065*w, 0.917*h, 0.13*w, 0.076*h, "arial", txtSize*0.5)

            ctx.drawImage(imgs[0], left + size/2 - 0.143*h, top + size/2 - 0.143*h, 0.285*h, 0.285*h);
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 1)'
            cStr(secondsToTime((currTime - frontEndPlayers[id].timeStarted)/1000), ctx, left + size/2 + 0.065*w, 0.917*h, 0.13*w, 0.076*h, "arial", txtSize*0.5)
          }
        }
        
      } else if (stage === "gameover") {
        ctx.fillStyle = 'rgba(255, 255, 255, 1)'
        if (id === socket.id) {
          cStr(secondsToTime((frontEndPlayers[id].timeEnded - frontEndPlayers[id].timeStarted)/1000), ctx, left + size/2 + 0.065*w, 0.917*h, 0.13*w, 0.076*h, "arial", txtSize*0.5)

          if (frontEndPlayers[id].won) {
            ctx.drawImage(imgs[0], left + size/2 - 0.143*h, top + size/2 - 0.143*h, 0.285*h, 0.285*h);
          } else {
            ctx.drawImage(imgs[1], left + size/2 - 0.143*h, top + size/2 - 0.143*h, 0.285*h, 0.285*h);
          }

        } else {
          if (frontEndPlayers[id].finished) {
            // opponent is finished
            cStr(secondsToTime((frontEndPlayers[id].timeEnded - frontEndPlayers[id].timeStarted)/1000), ctx, left + size/2 + 0.065*w, 0.917*h, 0.13*w, 0.076*h, "arial", txtSize*0.5)
            
            if (frontEndPlayers[id].won) {
              ctx.drawImage(imgs[0], left + size/2 - 0.143*h, top + size/2 - 0.143*h, 0.285*h, 0.285*h);
            } else {
              ctx.drawImage(imgs[1], left + size/2 - 0.143*h, top + size/2 - 0.143*h, 0.285*h, 0.285*h);
            }
            
            waitingForNext = true;
            
          } else {
            cStr(secondsToTime((currTime - frontEndPlayers[id].timeStarted)/1000), ctx, left + size/2 + 0.065*w, 0.917*h, 0.13*w, 0.076*h, "arial", txtSize*0.5)
          }
        }
      }
      //console.log(stage)

    }
  }
}

// load all images then start animate function
let imagesToLoad = ['win.png', 'lose.png'];
let loadCounter = 0;
imagesToLoad.forEach((src, index) => {
  let img = new Image();
  img.onload = function() {
      imgs[index] = img;
      loadCounter++;
      if (loadCounter === imagesToLoad.length) {
          animate();
      }
  };
  img.src = src;
});

const rect = canvas.getBoundingClientRect();
document.addEventListener('click', function(e) {
  let mx = (e.clientX - rect.left) * devicePixelRatio;
  let my = (e.clientY - rect.top) * devicePixelRatio;

  if (frontEndPlayers[socket.id] && mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
    if (!frontEndPlayers[socket.id].ready) {
      frontEndPlayers[socket.id].ready = true;
      socket.emit('newReadyStatus', true);
    } else {
      frontEndPlayers[socket.id].ready = false;
      socket.emit('newReadyStatus', false);
    }
  }
});

const keys = {
  w: {
    pressed: false
  },
  a: {
    pressed: false
  },
  s: {
    pressed: false
  },
  d: {
    pressed: false
  },
}

function inRange(n) {
  if (n >= 0 && n <= 3) {
    return true;
  } else {
    return false;
  }
}
function holePos(board) {
  for (var r = 0; r < 4; r++) {
    for (var c = 0; c < 4; c++) {
      if (board[r][c] === 0) {
        return [r, c]
      }
    }
  }
}
function moveLR(board, n) {
  const hp = holePos(board);
  if (inRange(hp[1] - n)) {
    board[hp[0]][hp[1]] = board[hp[0]][hp[1] - n];
    board[hp[0]][hp[1] - n] = 0;
  }
}
function moveUD(board, n) {
  const hp = holePos(board);
  if (inRange(hp[0] + n)) {
    board[hp[0]][hp[1]] = board[hp[0] + n][hp[1]];
    board[hp[0] + n][hp[1]] = 0;
  }
}

// every 15 ms, check if a key is pressed, move tiles, emit it to backend
setInterval(() => {
  if (stage === "countdown" || stage === "gameover") return;

  if (keys.w.pressed) {
    moveUD(frontEndPlayers[socket.id].board, 1)
    socket.emit('keydown', { keycode: 'KeyW' })
    keys.w.pressed = false;
  }

  if (keys.a.pressed) {
    moveLR(frontEndPlayers[socket.id].board, -1)
    socket.emit('keydown', { keycode: 'KeyA' })
    keys.a.pressed = false;
  }

  if (keys.s.pressed) {
    moveUD(frontEndPlayers[socket.id].board, -1)
    socket.emit('keydown', { keycode: 'KeyS' })
    keys.s.pressed = false;
  }

  if (keys.d.pressed) {
    moveLR(frontEndPlayers[socket.id].board, 1)
    socket.emit('keydown', { keycode: 'KeyD' })
    keys.d.pressed = false;
  }
}, 15)

// listens for key being pressed and updates keys object
window.addEventListener('keydown', (event) => {
  if (!frontEndPlayers[socket.id]) return

  switch(event.code) {
    case 'KeyW':
    case 'ArrowUp':
      keys.w.pressed = true
      break
    case 'KeyA':
    case 'ArrowLeft':
      keys.a.pressed = true
      break
    case 'KeyS':
    case 'ArrowDown':
      keys.s.pressed = true
      break
    case 'KeyD':
    case 'ArrowRight':
      keys.d.pressed = true
      break
  }
})
window.addEventListener('keyup', (event) => {
  if (!frontEndPlayers[socket.id]) return
  
  switch(event.code) {
    case 'KeyW':
    case 'ArrowUp':
      keys.w.pressed = false
      break
    case 'KeyA':
    case 'ArrowLeft':
      keys.a.pressed = false
      break
    case 'KeyS':
    case 'ArrowDown':
      keys.s.pressed = false
      break
    case 'KeyD':
    case 'ArrowRight':
      keys.d.pressed = false
      break
  }
})

document.querySelector('#usernameForm').addEventListener('submit', (event) => {
  
  event.preventDefault()
  document.querySelector('#usernameForm').style.display = 'none' // hide username form

  socket.emit('initGame', {
    username: document.querySelector("#usernameInput").value,
    width: w,
    height: h,
    devicePixelRatio
  })
})