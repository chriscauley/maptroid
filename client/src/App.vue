<template>
  <div class="app-wrapper">
    <app-nav />
    <router-view :key="$route.path" />
    <unrest-ui />
    <video-player />
  </div>
</template>

<script>
import AppNav from '@/components/Nav.vue'
import VideoPlayer from '@/components/Video/index.vue'

export default {
  components: { AppNav, VideoPlayer },
}
</script>
