import { computed } from 'vue'
import { RestStorage } from '@unrest/vue-storage'

import { hms } from '@/lib/time'

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
  })

  return storage
}
