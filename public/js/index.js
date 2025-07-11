const canvas = document.getElementById('myCanvas')
const ctx = canvas.getContext('2d')

const socket = io()

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio

let w = canvas.width
let h = canvas.height

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
        ready: backEndPlayer.ready,
        spectator: backEndPlayer.spectator
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
      frontEndPlayers[id].spectator = backEndPlayer.spectator
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
const size = 0.62 * h - 30; // 0.82 * h - 30
const tileSize = size / 4;

const txtSize = 0.11 * h;

let imgs = {};

let currentHole = [3, 3];

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
    cStr("Kihei's", ctx, 0, 0, w, 0.55*h, "arial", txtSize*0.5)
    cStr("15 Puzzle!", ctx, 0, 0, w, 0.7*h, "arial", txtSize*0.7)
  } else {
    let left = (w-size)/2 - shift;
    let top = (h-size)/2;

    // inner box
    ctx.fillStyle = 'rgba(54, 54, 54, 1)'
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
        if (generateBoardRN) { // not the point of this variable, but using it so holePos only runs once
          currentHole = holePos(frontEndPlayers[socket.id].board);
        }
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
      if (frontEndPlayers[id].spectator) continue;

      var board = frontEndPlayers[id].board;

      // set correct x values for board and stuff (depending which player it is)
      if (id === socket.id) {
        left = (w-size)/2 - shift;
        
        // define button position
        btnX = left + size/2 - 0.065*w
        btnY = 0.82*h
        btnW = 0.13*w
        btnH = 0.076*h
      } else {
        left = (w-size)/2 + shift;
        oppID = id; // set opponent ID
      }

      // ready buttons
      ctx.fillStyle = 'rgba(191, 181, 166, 1)'
      ctx.fillRect(left + size/2 - 0.065*w, 0.82*h, 0.13*w, 0.076*h)
      if (frontEndPlayers[id].ready) {
        ctx.fillStyle = 'rgba(0, 255, 0, 1)'
      } else {
        ctx.fillStyle = 'rgba(255, 0, 0, 1)'
      }
      cStr("Ready", ctx, left + size/2 - 0.065*w, 0.82*h, 0.13*w, 0.076*h, "arial", txtSize*0.5)

      var currentX = left;
      var currentY = top;

      // draw tiles
      for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
          var num = board[r][c]
          if (num !== 0) {
            // correct spot coloring
            /*
            if (correctSpot(num, r, c)) {
              ctx.fillStyle = 'rgba(149, 255, 143, 1)'
            } else {
              ctx.fillStyle = 'rgba(240, 255, 143, 1)'
            }
            */

            // speed sliding coloring
            if (num <= 4) {
              ctx.fillStyle = 'rgba(254, 102, 105, 1)';
            } else if (num === 5 || num === 9 || num === 13) {
              ctx.fillStyle = 'rgba(255, 238, 101, 1)';
            } else if (num === 6 || num === 7 || num === 8) {
              ctx.fillStyle = 'rgba(130, 253, 114, 1)';
            } else if (num === 10 || num === 14) {
              ctx.fillStyle = 'rgba(130, 255, 223, 1)';
            } else if (num === 11 || num === 12) {
              ctx.fillStyle = 'rgba(142, 181, 251, 1)';
            } else if (num === 15) {
              ctx.fillStyle = 'rgba(204, 139, 250, 1)';
            }

            // tile
            ctx.fillRect(currentX, currentY, tileSize, tileSize);
            
            // number text
            ctx.fillStyle = 'rgba(10, 11, 34, 1)'
            cStr(num.toString(), ctx, currentX, currentY, tileSize, tileSize, "arial", txtSize*0.6)
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
          the_name = "You";
        } else {
          the_name = "Player 2";
        }
      }
      cStr(the_name, ctx, left, top - 0.35*h, size, size, "arial", txtSize*0.6)

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
          cStr(secondsToTime((currTime - frontEndPlayers[id].timeStarted)/1000), ctx, left + size/2 + 0.065*w, 0.82*h, 0.13*w, 0.076*h, "arial", txtSize*0.5)
        } else { // not the current frontend player

          if (frontEndPlayers[id].finished) {
            ctx.fillStyle = 'rgba(255, 255, 255, 1)'
            cStr(secondsToTime((frontEndPlayers[id].timeEnded - frontEndPlayers[id].timeStarted)/1000), ctx, left + size/2 + 0.065*w, 0.82*h, 0.13*w, 0.076*h, "arial", txtSize*0.5)

            ctx.drawImage(imgs[0], left + size/2 - 0.143*h, top + size/2 - 0.143*h, 0.285*h, 0.285*h);
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 1)'
            cStr(secondsToTime((currTime - frontEndPlayers[id].timeStarted)/1000), ctx, left + size/2 + 0.065*w, 0.82*h, 0.13*w, 0.076*h, "arial", txtSize*0.5)
          }

        }
        
      } else if (stage === "gameover") {
        ctx.fillStyle = 'rgba(255, 255, 255, 1)'
        if (id === socket.id) {
          cStr(secondsToTime((frontEndPlayers[id].timeEnded - frontEndPlayers[id].timeStarted)/1000), ctx, left + size/2 + 0.065*w, 0.82*h, 0.13*w, 0.076*h, "arial", txtSize*0.5)

          if (frontEndPlayers[id].won) {
            ctx.drawImage(imgs[0], left + size/2 - 0.143*h, top + size/2 - 0.143*h, 0.285*h, 0.285*h);
          } else {
            ctx.drawImage(imgs[1], left + size/2 - 0.143*h, top + size/2 - 0.143*h, 0.285*h, 0.285*h);
          }

        } else {
          if (frontEndPlayers[id].finished) {
            // opponent is finished
            cStr(secondsToTime((frontEndPlayers[id].timeEnded - frontEndPlayers[id].timeStarted)/1000), ctx, left + size/2 + 0.065*w, 0.82*h, 0.13*w, 0.076*h, "arial", txtSize*0.5)
            
            if (frontEndPlayers[id].won) {
              ctx.drawImage(imgs[0], left + size/2 - 0.143*h, top + size/2 - 0.143*h, 0.285*h, 0.285*h);
            } else {
              ctx.drawImage(imgs[1], left + size/2 - 0.143*h, top + size/2 - 0.143*h, 0.285*h, 0.285*h);
            }
            
            waitingForNext = true;
            
          } else {
            cStr(secondsToTime((currTime - frontEndPlayers[id].timeStarted)/1000), ctx, left + size/2 + 0.065*w, 0.82*h, 0.13*w, 0.076*h, "arial", txtSize*0.5)
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

let rect = canvas.getBoundingClientRect();

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

document.addEventListener('mousemove', function(e) {
  if (stage === "countdown" || stage === "gameover") return;

  let left = (w-size)/2 - shift;
  let top = (h-size)/2;
  let mx = (e.clientX - rect.left) * devicePixelRatio - left;
  let my = (e.clientY - rect.top) * devicePixelRatio - top;

  let r = Math.floor(my / tileSize);
  let c = Math.floor(mx / tileSize);

  if (inRange(r) && inRange(c)) {
    
    const [hr, hc] = currentHole;
    
    if ((r === hr) !== (c === hc)) { // XOR, one of them must be true but not both (this removes the case where mouse is on hole)
      //console.log(`row ${r}, col ${c}`);

      if (r === hr) { // left right
        mouseLR(frontEndPlayers[socket.id].board, r, c, hc);
      } else { // up down
        mouseUD(frontEndPlayers[socket.id].board, r, c, hr);
      }

      // emit to backend
      socket.emit('boardUpdate', frontEndPlayers[socket.id].board);

      // update hole position
      currentHole = [r, c];
    }
  }
});

let isTouching = false;
document.addEventListener('touchmove', (e) => {
  if (stage === "countdown" || stage === "gameover") return;

  // Prevent scrolling (optional)
  e.preventDefault();

  const touch = e.touches[0];

  let left = (w-size)/2 - shift;
  let top = (h-size)/2;
  let mx = (touch.clientX - rect.left) * devicePixelRatio - left;
  let my = (touch.clientY - rect.top) * devicePixelRatio - top;

  let r = Math.floor(my / tileSize);
  let c = Math.floor(mx / tileSize);

  if (inRange(r) && inRange(c)) {
    const [hr, hc] = currentHole;

    if ((r === hr) !== (c === hc)) { // XOR, one of them must be true but not both (this removes the case where mouse is on hole)
      //console.log(`row ${r}, col ${c}`);

      if (r === hr) { // left right
        mouseLR(frontEndPlayers[socket.id].board, r, c, hc);
      } else { // up down
        mouseUD(frontEndPlayers[socket.id].board, r, c, hr);
      }

      // emit to backend
      socket.emit('boardUpdate', frontEndPlayers[socket.id].board);

      // update hole position
      currentHole = [r, c];
    }
  }
}, { passive: false });

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
  space: {
    pressed: false
  }
}

const inRange = n => n >= 0 && n < 4;

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b); // sort numerically
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    // Even length: average of two middle values
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    // Odd length: return the middle value
    return sorted[mid];
  }
}
function maxim(arr) {
  return Math.max(...arr);
}
function avg(arr) {
  const sum = arr.reduce((a, b) => a + b, 0);
  return sum / arr.length;
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

function mouseLR(board, r, c, hc) {
  for (let i = 0; i < Math.abs(c - hc); i++) {
    if (c > hc) {
      board[r][hc + i] = board[r][hc + i + 1];
    } else {
      board[r][hc - i] = board[r][hc - i - 1];
    }
  }
  board[r][c] = 0;
}
function mouseUD(board, r, c, hr) {
  for (let i = 0; i < Math.abs(r - hr); i++) {
    if (r > hr) {
      board[hr + i][c] = board[hr + i + 1][c];
    } else {
      board[hr - i][c] = board[hr - i - 1][c];
    }
  }
  board[r][c] = 0;
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


// every 15 ms, check if spacebar is pressed, generate board, emit it to backend
setInterval(() => {
  if (stage === "lobby") {
    if (keys.space.pressed) {
      let tempBoard = [];

      for (var i = 0; i < 4; i++) {
        tempBoard[i] = frontEndPlayers[socket.id].board[i].slice();
      }
    
      for (var i = 0; i < 1000000; i++) {
        let rand = Math.floor(Math.random() * 4);

        switch (rand) {
          case 0:
            moveLR(tempBoard, 1); break;
          case 1:
            moveLR(tempBoard, -1); break;
          case 2:
            moveUD(tempBoard, 1); break;
          case 3:
            moveUD(tempBoard, -1); break;
        }
      }

      frontEndPlayers[socket.id].board = tempBoard;
      currentHole = holePos(frontEndPlayers[socket.id].board);

      socket.emit('boardUpdate', frontEndPlayers[socket.id].board);

      keys.space.pressed = false;
    }
  }
  
  /*
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
  */
}, 15)

// listens for key being pressed and updates keys object
window.addEventListener('keydown', (event) => {
  if (!frontEndPlayers[socket.id]) return

  if (event.code === 'Space') {
    keys.space.pressed = true;
  }

  /*
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
  */
})
window.addEventListener('keyup', (event) => {
  if (!frontEndPlayers[socket.id]) return
  
  if (event.code === 'Space') {
    keys.space.pressed = false;
  }
  
  /*
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
  */
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