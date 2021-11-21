<template>
  <div class="video-picker">
    <h2>Select a Route</h2>
    <p>
      Selected route determines item order and display times. The "casual" run is good if you're a
      new player just trying to figure out how to get items. "Unrestricted" runs are (as of
      2021-11-20) using version 1.0.2 which had a glitch making it possible to beat the game without
      getting varia/gravity suits. The NMG (no major glitches) run is the world record holder for
      the latest version 1.0.3 as of November 20th, 2021 at 7:11 EST.
    </p>
    <div class="flexy">
      <div
        v-for="video in videos"
        :key="video.id"
        class="video-picker__video"
        @click="select(video)"
      >
        <div class="video-picker__label">{{ video.label }}</div>
        <div class="video-picker__thumbnail" :style="getBg(video)" />
        <div class="video-picker__title">{{ video.title }}</div>
        <div class="video-picker__by">
          <img class="video-box__avatar" :src="video.channel_icon" />
          by {{ video.channel_name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  inject: ['videos'],
  emits: ['close'],
  methods: {
    getBg(video) {
      return { backgroundImage: `url("${video.thumbnail_url}")` }
    },
    select(video) {
      this.$store.local.save({ selected_video_id: video.id })
      this.$emit('close')
    },
  },
}
</script>
