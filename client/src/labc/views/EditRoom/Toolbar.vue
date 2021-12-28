<template>
  <div class="ur-toolbar">
    <div class="ur-toolbar__row btn-group">
      <div
        v-for="(tool, i) in tools"
        :key="tool.name"
        :title="tool.name"
        @click="tool.click"
        :class="tool.class"
      >
        <i :class="tool.icon" />
        <div v-if="i !== 0 && ctrl_down" class="flaire">{{ i }}</div>
      </div>
    </div>
    <div class="ur-toolbar__row btn-group" v-if="selected_tool?.children">
      <div
        v-for="(child, i) in selected_tool.children"
        :key="child.slug"
        @click="child.click"
        :class="child.class"
        :title="child.slug"
      >
        <i :class="child.icon" />
        <div v-if="!ctrl_down" class="flaire">{{ i + 1 }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    ctrl_down() {
      return false
    },
    tools() {
      return this.$store.tool.listTools()
    },
    selected_tool() {
      return this.tools.find((t) => t.slug === this.$store.tool.state.selected_tool)
    },
  },
}
</script>
