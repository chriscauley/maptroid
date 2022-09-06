import { RestStorage } from '@unrest/vue-storage'

export default ({ store }) => {
  const storage = RestStorage('schema/video', { collection_slug: 'schema/video' })

  Object.assign(storage, {
    getCurrentVideo() {
      const { current_video_id } = store.local.state
      const { world_videos } = store.route
      return world_videos.find((v) => v.id === current_video_id) || world_videos[0]
    },
    setCurrentVideo(value) {
      store.local.save({ current_video_id: value?.id })
    },
    getNextUnknownItem() {
      if (!store._app.config.globalProperties.$auth.user?.is_superuser) {
        return null
      }
      const video = storage.getCurrentVideo()
      if (!video?.data.unknown_items?.length) {
        return null
      }

      const matched_times = {} // seconds: item_id
      video.data.items.forEach((i) => (matched_times[i[1]] = i[0]))

      const items = video.data.unknown_items.map(([frame, item]) => {
        const seconds = parseInt(frame / video.data.fps)
        const matched = matched_times[seconds]
        return { frame, item, seconds, matched }
      })

      return items.find((i) => !i.matched)
    },
  })

  return storage
}
