<template>
  <div v-if="$auth.user?.is_superuser" class="admin-popup__root">
    <div class="btn -primary" @click="open = true">
      <i class="fa fa-cogs" />
    </div>
    <slot name="buttons" />
    <teleport to="body" v-if="open">
      <unrest-modal @close="open = false">
        <slot />
      </unrest-modal>
    </teleport>
  </div>
</template>

<script>
export default {
  data() {
    return { open: false }
  },
}
</script>
