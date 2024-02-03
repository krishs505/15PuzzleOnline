const express = require('express')
const app = express()

const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 })

const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const initialBoard = [[1,2,3,4], [5,6,7,8], [9,10,11,12], [13,14,15,0]];
let backEndBoard = [];

const backEndPlayers = {}

io.on('connection', (socket) => {
  console.log('a user connected')

  io.emit('updatePlayers', backEndPlayers)

  socket.on('initGame', ({ username, width, height, devicePixelRatio }) => {
    const copiedBoard = [];
    for (var i = 0; i < initialBoard.length; i++) {
      copiedBoard[i] = initialBoard[i].slice();
    }

    // create backend player object for connected user
    backEndPlayers[socket.id] = {
      board: copiedBoard,
      username,
      ready: false,
      canvas: {width, height}
    }

    console.log(username + " joined.")
  })

  // delete player who disconnects
  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete backEndPlayers[socket.id]
    io.emit('updatePlayers', backEndPlayers)
  })

  // when the backend receives request to that key is down
  socket.on('keydown', ({ keycode }) => {
    switch (keycode) {
      case 'KeyW':
        moveUD(backEndPlayers[socket.id].board, 1)
        break
      case 'KeyA':
        moveLR(backEndPlayers[socket.id].board, -1)
        break
      case 'KeyS':
        moveUD(backEndPlayers[socket.id].board, -1)
        break
      case 'KeyD':
        moveLR(backEndPlayers[socket.id].board, 1)
        break
    }
  })

  socket.on('newReadyStatus', (readyStatus) => {
    backEndPlayers[socket.id].ready = readyStatus;
  })

  socket.on('time', (timeStarted) => {
    backEndPlayers[socket.id].timeStarted = timeStarted;
  })

  socket.on('generateBoard', () => {
    let tempBoard = [];
    
    if (backEndBoard.length === 0) {
      for (var i = 0; i < initialBoard.length; i++) {
        tempBoard[i] = initialBoard[i].slice();
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

      backEndBoard = tempBoard;
    } else {
      for (var i = 0; i < backEndBoard.length; i++) {
        tempBoard[i] = backEndBoard[i].slice();
      }
      
      backEndBoard = []; // reset backend board for NEXT game
    }

    backEndPlayers[socket.id].board = tempBoard;
    //console.log(backEndBoard.length)
  })

  socket.on('playerFinished', (wonStatus, timeEnded) => {
    backEndPlayers[socket.id].finished = true;
    backEndPlayers[socket.id].won = wonStatus;
    backEndPlayers[socket.id].timeEnded = timeEnded;
  })

  socket.on('resetGame', () => {
    backEndPlayers[socket.id].finished = false;
    backEndPlayers[socket.id].won = false;
    backEndPlayers[socket.id].timeEnded = undefined;
  })

  //console.log(backEndPlayers)
})

// backend ticker
setInterval(() => {

  io.emit('updatePlayers', backEndPlayers)

}, 15)

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


server.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

console.log('Server loaded')
