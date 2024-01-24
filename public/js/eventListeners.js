/*
addEventListener('click', (event) => {
  const playerPosition = {
    x: frontEndPlayers[socket.id].x,
    y: frontEndPlayers[socket.id].y
  }

  const angle = Math.atan2(
    (event.clientY * devicePixelRatio) - playerPosition.y,
    (event.clientX * devicePixelRatio) - playerPosition.x
  )

  socket.emit('shoot', {
    x: playerPosition.x,
    y: playerPosition.y,
    angle
  })
})
*/