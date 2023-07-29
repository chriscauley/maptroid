<template>
  <div :class="`api-status ${state.wrapper}`" :title="`Solver status: ${state.status}`">
    <i :class="state.icon" />
  </div>
</template>

<script>
export default {
  computed: {
    state() {
      const { api_status } = this.$store.tracker.state
      if (api_status === 'loading') {
        return {
          wrapper: 'btn -warning',
          icon: 'fa fa-exchange',
        }
      } else if (api_status === 'ok') {
        return {
          wrapper: 'btn -success',
          icon: 'fa fa-check',
        }
      }
      return {
        wrapper: 'btn -error',
        icon: 'fa fa-exclamation-circle',
      }
    },
  },
}
</script>
