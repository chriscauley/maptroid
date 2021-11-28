import { RestStorage } from '@unrest/vue-storage'

const fromServer = (video) => {
  const times_by_id = (video.times_by_id = {})
  const _pad = (i) => i.toString().padStart(2, 0)
  let max = 0
  video.data.actions.forEach(([id, seconds]) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    const hms = h ? `${h}:${_pad(m)}:${_pad(s)}` : `${m}:${_pad(s)}`
    times_by_id[id] = times_by_id[id] || []
    times_by_id[id].push({ seconds, hms })
    max = Math.max(seconds, max)
  })
  video.max_event = max
  return video
}

export default () => {
  const storage = RestStorage('schema/video', { collection_slug: 'schema/video', fromServer })
  const { state } = storage.api

  storage.setWorld = (world) => {
    state.world = world
    state.videos = null
    const q = { query: { per_page: 5000, world: world.id } }
    storage.fetchPage(q).then(({ items }) => state.videos = items)
  }

  storage.getWorldVideos = () => {
    return state.videos || []
  }

  return storage
}
