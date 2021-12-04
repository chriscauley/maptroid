<template>
  <div class="video-picker">
    <h2>Select a Route</h2>
    <p>
      Selected route determines item order and display times.
    </p>
    <ul class="browser-default">
      <li>
        The "casual" run is good if you're a new player just trying to find items.
      </li>
      <li>
        The NMG (no major glitches) run is done using the latest patch v1.0.3.
      </li>
      <li>
        "Unrestricted" runs are using v1.0.2 which had a glitch making it possible to beat the game
        without getting varia/gravity suits.
      </li>
    </ul>
    <p>
      Note: Times listed are the timecodes of the YouTube video of each run, not the in game time.
      Records are changing on a daily basis, and time stamps are manually entered. Please refer to
      <a href="https://www.speedrun.com/mdread/">speedrun.com</a> and the videos for accurate
      numbers.
    </p>
    <div class="flexy">
      <div
        v-for="video in $store.route.world_videos"
        :key="video.id"
        class="video-picker__video"
        @click="select(video)"
      >
        <div class="video-picker__label">{{ video.label }}</div>
        <div class="video-picker__thumbnail" :style="getBg(video)" />
        <div class="video-picker__title">{{ video.title }}</div>
        <div class="video-picker__by">
          <div>
            <img class="video-box__avatar" :src="video.channel_icon" />
          </div>
          by {{ video.channel_name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  emits: ['close'],
  methods: {
    getBg(video) {
      return { backgroundImage: `url("${video.thumbnail_url}")` }
    },
    select(video) {
      this.$store.video.setCurrentVideo(video)
      this.$emit('close')
    },
  },
}
</script>
