<template>
  <div class="flex-grow">
    <div class="viewer-wrapper">
      <open-seadragon :pixelated="true" :options="options" :events="events" />
    </div>
  </div>
</template>

<script>
import ViewerMixin from './Mixin'

export default {
  __route: {
    path: '/',
  },
  mixins: [ViewerMixin],
}
</script>
