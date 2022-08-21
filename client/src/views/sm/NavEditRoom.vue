<template>
  <div v-if="links" class="btn-group">
    <div class="btn -danger" @click="links.prev">
      <i :class="getIcon('chevron-left')" />
    </div>
    <div class="btn -danger cursor-default">
      <i :class="icon" />
      {{ links.count }}
    </div>
    <div class="btn -danger" @click="links.next">
      <i :class="getIcon('chevron-right')" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    icon: String,
    links: Object,
  },
  methods: {
    getIcon(icon) {
      return `fa fa-${icon}`
    },
  },
}
</script>
