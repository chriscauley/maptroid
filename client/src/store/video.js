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

export default ({ store }) => {
  const storage = RestStorage('schema/video', { collection_slug: 'schema/video', fromServer })

  Object.assign(storage, {
    getCurrentVideo() {
      const { current_video_id } = store.local.state
      return store.route.world_videos.find((v) => v.world === current_video_id)
    },
    setCurrentVideo(value) {
      store.local.save({ current_video_id: value?.id })
    },
  })

  return storage
}
