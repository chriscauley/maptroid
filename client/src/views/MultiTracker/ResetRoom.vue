<template>
  <div>
    <b>
      Are you sure you want to clear the room?
      <br />
      This cannot be undone.
    </b>
    <br />
    <br />
    <div class="modal-footer">
      <button class="btn -info" @click="$emit('close')">Cancel</button>
      <button class="btn -danger" @click="reset">Reset Room</button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    controller: Object,
  },
  emits: ['close'],
  methods: {
    reset() {
      this.controller.reset()
      this.$emit('close')
    },
  },
}
</script>
