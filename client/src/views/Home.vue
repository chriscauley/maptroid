<template>
  <div class="app__home">
    <h1>
      Project Maptroid
      <router-link to="/app/faq/" class="link">
        What is this?
      </router-link>
    </h1>
    <world-select />
  </div>
</template>

<script>
export default {
  __route: {
    path: '/',
  },
  name: 'HomeView',
}
</script>
