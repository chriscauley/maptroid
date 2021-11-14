<template>
  <div v-if="video" class="embedded-video">
    <div :id="player_id" />
  </div>
</template>

<script>
export default {
  data() {
    const player_id = `_player_${Math.round(Math.random() * 1e6)}`
    return { player: null, player_id }
  },
  computed: {
    video() {
      const video_id = parseInt(this.$route.query.video)
      return video_id && this.$store.video.getOne(video_id)
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
        videoId: this.video.url.match(/v=(.*)$/)[1],
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
