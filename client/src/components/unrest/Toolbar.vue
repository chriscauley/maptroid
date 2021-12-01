<template>
  <div class="ur-toolbar">
    <div class="ur-toolbar__row btn-group">
      <template v-for="tool in tools" :key="tool.name">
        <unrest-dropdown v-if="tool.items" :items="tool.items" :class="tool.class">
          <i :class="tool.icon" />
        </unrest-dropdown>
        <div v-else :title="tool.name" @click="tool.click" :class="tool.class">
          <i :class="tool.icon" />
        </div>
      </template>
      <slot name="buttons" />
    </div>
    <div class="ur-toolbar__row btn-group" v-if="selected_tool?.children">
      <div
        v-for="child in selected_tool.children"
        :key="child.slug"
        @click="child.click"
        :class="child.class"
        :title="child.slug"
      >
        <i :class="child.icon" />
      </div>
    </div>
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    storage: Object,
  },
  computed: {
    tools() {
      return this.storage.listTools()
    },
    selected_tool() {
      const { selected_tool, selected_variant } = this.storage.state
      if (selected_variant) {
        return this.tools.find(
          (t) => t.slug === selected_tool && t.variants.includes(selected_variant),
        )
      }
      return this.tools.find((t) => t.slug === selected_tool)
    },
  },
}
</script>
