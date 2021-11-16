<template>
  <div class="video-picker">
    <h2>Select a Route</h2>
    <p>
      Selected route determines item order and display times. Speedruns may include sequence breaks
      and other advanced techniques.
    </p>
    <div class="flexy">
      <div
        v-for="video in videos"
        :key="video.id"
        class="video-picker__video"
        @click="select(video)"
      >
        <div class="video-picker__label">{{ video.label }}</div>
        <div>
          <img :src="video.thumbnail_url" />
        </div>
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
    select(video) {
      this.$store.local.save({ selected_video_id: video.id })
      this.$emit('close')
    },
  },
}
</script>
