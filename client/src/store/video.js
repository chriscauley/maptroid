import { computed } from 'vue'
import { RestStorage } from '@unrest/vue-storage'

import { hms } from '@/lib/time'

export default ({ store }) => {
  const storage = RestStorage('schema/video', { collection_slug: 'schema/video' })

  const _times_by_item_id = computed(() => {
    if (!store.route?.world_videos) {
      return {}
    }
    const video = storage.getCurrentVideo()
    const out = {}
    video.data.items.forEach(([item_id, seconds]) => {
      out[item_id] = out[item_id] || []
      out[item_id].push({
        seconds,
        hms: hms(seconds),
      })
    })
    return out
  })

  Object.assign(storage, {
    getCurrentVideo() {
      const { current_video_id } = store.local.state
      const { world_videos } = store.route
      return world_videos.find((v) => v.id === current_video_id) || world_videos[0]
    },
    setCurrentVideo(value) {
      store.local.save({ current_video_id: value?.id })
    },
    get times_by_item_id() {
      return _times_by_item_id.value
    },
  })

  return storage
}
