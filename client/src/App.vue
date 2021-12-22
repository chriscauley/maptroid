<template>
  <div class="app-wrapper">
    <app-nav />
    <router-view :key="$route.path" />
    <unrest-ui />
  </div>
</template>

<script>
import AppNav from '@/components/Nav.vue'

export default {
  components: { AppNav },
}
</script>
