<template>
  <div class="video-box" v-if="video">
    <div class="item-list__header">
      <div class="video-box__title" @click="open = true">
        Route:
        <div>{{ video.label }}</div>
        by
        {{ video.channel_name }}
        <div :style="`background-image: url(${video.channel_icon})`" class="video-box__avatar" />
      </div>
      <template v-if="$auth.user?.is_superuser">
        <div class="video-box__seperator" />
        <div @click="togglePlayer">
          <template v-if="expanded">
            {{ visible_time }} <i class="fas fa-chevron-down" />
          </template>
          <template v-else> Expand Player <i class="fas fa-chevron-up" /> </template>
        </div>
      </template>
    </div>
    <div v-if="show_player" class="video-box__player">
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
import Mousetrap from '@unrest/vue-mousetrap'

import { hms } from '@/lib/time'
import VideoPicker from './Picker.vue'

export default {
  components: { VideoPicker },
  mixins: [Mousetrap.Mixin],
  data() {
    const player_id = `_player_${Math.round(Math.random() * 1e6)}`
    return { player: null, open: null, player_id }
  },
  computed: {
    mousetrap() {
      const { player } = this
      return {
        right: () => player.seekTo(player.getCurrentTime() + 5),
        left: () => player.seekTo(player.getCurrentTime() - 5),
        space: () => player[player.getPlayerState() === 1 ? 'stopVideo' : 'playVideo'](),
      }
    },
    video() {
      return this.$store.video.getCurrentVideo()
    },
    expanded() {
      return this.$store.local.state.show_video
    },
    show_player() {
      return this.$store.route.world_videos.length && this.expanded
    },
    visible_time() {
      const { current_time } = this.$store.local.state
      return hms(current_time || 0)
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
  updated() {
    if (this.show_player && !this.$el.querySelector('iframe')) {
      this.loadVideo()
    }
  },
  unmounted() {
    clearInterval(this.interval)
  },
  methods: {
    togglePlayer() {
      this.$store.local.save({ show_video: !this.$store.local.state.show_video })
    },
    loadVideo() {
      if (!this.show_player || !window.YT) {
        this.expanded && setTimeout(this.loadVideo, 200)
        return
      }
      const width = this.$el.clientWidth
      const height = (width * 360) / 640
      const { origin } = window.location
      const start = this.$store.local.state.current_time
      this.player = window.__player = new window.YT.Player(this.player_id, {
        width,
        height,
        videoId: this.video.external_id,
        playerVars: { start, origin, autoplay: 1 },
      })
      clearInterval(this.interval)
      this.interval = setInterval(this.setTime, 60)
    },
    setTime() {
      const new_time = Math.floor(this.player.playerInfo.currentTime)
      if (new_time !== this.$store.local.state.current_time) {
        this.$store.local.save({ current_time: new_time })
      }
    },
  },
}
</script>
