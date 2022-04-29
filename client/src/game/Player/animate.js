const pulse = (game, xy, color = 'white', duration = 10000) => {
  const [x, y] = xy
  const start = game.getNow()
  game.animations.push(() => {
    game.ctx.save()
    game.ctx.strokeStyle = color
    const dt = game.getNow() - start
    game.ctx.beginPath()
    game.ctx.arc(x, y, 0.2 * ((dt % 500) / 500) + 0.1, 0, 2 * Math.PI)
    game.ctx.stroke()
    game.ctx.restore()
    return dt < duration
  })
}

const pulseFeet = (game, body, color, duration) => {
  const xy = [body.position[0], body.aabb.lowerBound[1]]
  return pulse(game, xy, color, duration)
}

export default {
  pulse,
  pulseFeet,
}
