<template>
  <div class="unrest-floating-actions">
    <div class="viewer-toolbar">
      <div v-for="tool in tools" :class="css.tool(tool)" @click="selectTool(tool)" :key="tool.name">
        <i :class="tool.icon" />
      </div>
    </div>
  </div>
</template>

<script>
const tools = [
  { slug: null, name: 'Select', icon: 'fa fa-mouse-pointer' },
  { slug: 'item', name: 'Item', icon: 'sm-item super-missle-alt' },
]

export default {
  data() {
    return { tools }
  },
  computed: {
    css() {
      const { selected_tool } = this.$store.viewer.state
      return {
        tool: (tool) => ['btn', tool.slug === selected_tool ? '-primary' : '-secondary'],
      }
    },
  },
  methods: {
    selectTool(tool) {
      this.$store.viewer.patch({ selected_tool: tool.slug })
    },
  },
}
</script>
