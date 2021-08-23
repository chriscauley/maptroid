<template>
  <div class="viewer-toolbar">
    <div
      v-for="tool in tools"
      :class="css.tool(tool)"
      :key="tool.name"
      :title="tool.name"
      @click="selectTool(tool)"
    >
      <i :class="tool.icon" />
    </div>
    <div class="btn -light">{{ viewer_data }}</div>
  </div>
</template>

<script>
const tools = [
  { slug: null, name: 'Select', icon: 'fa fa-mouse-pointer' },
  { slug: 'item', name: 'Item', icon: 'sm-item super-missle-alt' },
  { slug: 'boss', name: 'Boss', icon: 'sm-enemy boss' },
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
    viewer_data() {
      const { pointer } = this.$store.viewer.state
      if (!pointer) {
        return
      }
      const [x, y] = [pointer.x, pointer.y].map((i) => Math.floor(i / 16))
      return [`${x}x${y}`, `${x / 16}x${y / 16}`]
    },
  },
  methods: {
    selectTool(tool) {
      this.$store.viewer.patch({ selected_tool: tool.slug })
    },
  },
}
</script>
