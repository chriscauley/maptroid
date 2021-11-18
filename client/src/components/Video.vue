<template>
  <div class="video-box" v-if="video">
    <div class="list-group-item cursor-pointer" @click="open = true">
      Route:
      <div class="flex-grow truncate">{{ video.label }}</div>
      by {{ video.channel_name }}
      <img :src="video.channel_icon" class="video-box__avatar" />
    </div>
    <div v-if="start_at" class="video-box__player">
      <div class="item-bar">
        <i class="fa fa-youtube-play cursor-pointer" @click="toggleVideo" />
        <span v-for="item in grouped_items" :key="item.type" class="item-bar__item">
          <span :class="item.icon" /> {{ item.count }}
        </span>
      </div>
      <div :id="player_id" />
    </div>
    <teleport to="body">
      <unrest-modal v-if="open" @close="open = false">
        <video-picker @close="open = false" />
      </unrest-modal>
    </teleport>
  </div>
</template>

<script>
import DreadItems from '@/models/DreadItems'
import VideoPicker from './VideoPicker.vue'

const VISIBLE_LIST = DreadItems.items.slice(0, -1)
const VISIBLE = {}
VISIBLE_LIST.forEach((t) => (VISIBLE[t] = true))

export default {
  components: { VideoPicker },
  inject: ['video'],
  props: {
    world_items: Array,
  },
  data() {
    const player_id = `_player_${Math.round(Math.random() * 1e6)}`
    return { player: null, open: null, player_id }
  },
  computed: {
    start_at() {
      return this.$auth.user?.is_superuser ? this.video.max_event : null
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
    toggleVideo() {
      this.$store.local.save({ show_video: !this.$store.local.state.show_video })
      // TODO right now killing/restoring video is unstable, so I just reload the page
      window.location.reload()
    },
    loadVideo() {
      const { show_video } = this.$store.local.state
      if (!show_video || !this.start_at) {
        return
      }
      const width = this.$el.clientWidth
      const height = (width * 360) / 640
      const { origin } = window.location
      this.player = new window.YT.Player(this.player_id, {
        width,
        height,
        videoId: this.video.external_id,
        playerVars: { start: this.start_at, origin },
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
