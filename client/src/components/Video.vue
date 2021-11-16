<template>
  <div v-if="video" class="embedded-video">
    <div v-if="$auth.user?.is_superuser" class="item-bar">
      <span v-for="item in grouped_items" :key="item.type" class="item-bar__item">
        <span :class="item.icon" /> {{ item.count }}
      </span>
    </div>
    <div :id="player_id" />
  </div>
</template>

<script>
import DreadItems from '@/models/DreadItems'

const VISIBLE_LIST = DreadItems.items.slice(0, -1)
const VISIBLE = {}
VISIBLE_LIST.forEach((t) => (VISIBLE[t] = true))

export default {
  props: {
    world_items: Array,
  },
  data() {
    const player_id = `_player_${Math.round(Math.random() * 1e6)}`
    return { player: null, player_id }
  },
  computed: {
    video() {
      const video_id = parseInt(this.$route.query.video)
      return video_id && this.$store.video.getOne(video_id)
    },
    grouped_items() {
      const bins = {}
      const type_by_id = {}
      this.world_items
        .filter((i) => VISIBLE[i.data.type])
        .forEach((i) => (type_by_id[i.id] = i.data.type))
      this.video.data.actions.forEach((action) => {
        const type = type_by_id[action[0]]
        bins[type] = (bins[type] || 0) + 1
      })

      const items = VISIBLE_LIST.map((type) => ({
        type,
        count: bins[type],
        icon: DreadItems.getClass(type),
      }))
      items.push({
        type: 'missiles__computed',
        count: 15 + 2 * (bins.missile__tank || 0) + 10 * (bins['missile__plus-tank'] || 0),
        icon: DreadItems.getClass('missile__tank'),
      })
      items.push({
        type: 'energy__tank',
        count: (bins.energy__tank || 0) + Math.floor((bins.energy__part || 0) / 4),
        icon: DreadItems.getClass('energy__tank'),
      })
      return items
    },
  },
  mounted() {
    if (!document.querySelector('#yt_player_api')) {
      // 1. https://developers.google.com/youtube/player_parameters#IFrame_Player_API
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/player_api'
      tag.id = 'yt_player_api'
      document.head.appendChild(tag)
      window.onYouTubePlayerAPIReady = this.loadVideo
    } else {
      this.loadVideo()
    }
  },
  methods: {
    loadVideo() {
      const width = this.$el.clientWidth
      const height = (width * 360) / 640
      const { origin } = window.location
      this.player = new window.YT.Player(this.player_id, {
        width,
        height,
        videoId: this.video.external_id,
        playerVars: { start: this.video.max_event, origin },
      })
      this.interval = setInterval(this.setTime, 60)
    },
    setTime() {
      const new_time = Math.floor(this.player.playerInfo.currentTime)
      if (new_time !== window.YT_PLAYER_TIME) {
        window.YT_PLAYER_TIME = new_time
      }
    },
  },
}
</script>
