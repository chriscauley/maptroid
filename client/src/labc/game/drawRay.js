export default (ctx, xys) => {
  ctx.beginPath()
  ctx.moveTo(xys[0][0], xys[0][1])
  ctx.lineTo(xys[1][0], xys[1][1])
  ctx.stroke()
  ctx.closePath()
}
