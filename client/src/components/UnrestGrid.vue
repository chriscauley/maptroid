<!-- provides a grid overlay and a clickable area -->
<template>
  <div class="unrest-grid">
    <div class="unrest-grid__mouse" v-bind="mouse" />
    <slot />
  </div>
</template>

<script>
export default {}
</script>
