export default {
  html: (attrs, scale, SIZE) => {
    return Object.fromEntries(
      Object.entries(attrs).map(([k, v]) => {
        if (k === 'x') {
          k = 'left'
        }
        if (k === 'y') {
          k = 'top'
        }
        if (typeof v === 'number') {
          v = `${(100 * v * scale) / SIZE}%`
        }
        return [k, v]
      }),
    )
  },
}
