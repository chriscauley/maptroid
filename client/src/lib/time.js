const _pad = (n) => n.toString().padStart(2, '0')

const hms = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h ? `${h}:${_pad(m)}:${_pad(s)}` : `${_pad(m)}:${_pad(s)}`
}

export { hms }
