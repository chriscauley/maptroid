<template>
  <form @submit.prevent="savePassword">
    Enter password:
    <div class="form-group">
      <input type="text" class="form-control" ref="password" />
    </div>
    <div class="multi-tracker__buttons">
      <button class="btn -secondary" type="button" @click="$emit('close')" tabIndex="-1">
        Cancel
      </button>
      <button class="btn -primary">Set Password</button>
    </div>
  </form>
</template>

<script>
export default {
  props: {
    controller: Object,
  },
  emits: ['close'],
  methods: {
    savePassword() {
      this.controller.setPassword(this.$refs.password.value)
    },
  },
}
</script>
