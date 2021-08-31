<template>
  <div class="viewer-toolbar">
    <div
      v-for="tool in tools"
      :key="tool.name"
      :title="tool.name"
      @click="selectTool(tool)"
      :class="css.tool(tool)"
    >
      <i :class="tool.icon" />
      <div v-if="tool.children" class="viewer-toolbar__children">
        <div
          v-for="child in tool.children"
          :key="child.slug"
          @click="child.click"
          :class="child.btn"
          :title="child.slug"
        >
          <i :class="child.class" />
        </div>
      </div>
    </div>
    <div class="btn -light viewer-toolbar__tool">
      <i class="fa fa-gear" />
      <div class="viewer-toolbar__children -menu">
        <select v-model="$store.viewer.state.map_style">
          <option value="off">off</option>
          <option value="mini">mini</option>
          <option value="full">full</option>
        </select>
      </div>
    </div>
    <div class="viewer-toolbar__debug">{{ viewer_data }}</div>
  </div>
</template>

<script>
import Area from '@/models/Area'
import Item from '@/models/Item'
import { map_markers, doors } from '@/models'

export default {
  props: {
    world: Object,
  },
  computed: {
    css() {
      const { selected_tool } = this.$store.viewer.state
      return {
        tool: (tool) => {
          let selected = tool.slug === selected_tool
          if (tool.selected !== undefined) {
            selected = selected && tool.selected
          }
          return `btn viewer-toolbar__tool ${selected ? '-primary' : '-secondary'}`
        },
      }
    },
    tools() {
      return [
        { slug: null, name: 'Select', icon: 'fa fa-mouse-pointer' },
        this.makeTool('item', Item.packs),
        this.makeTool('item', Item.abilities),
        this.makeTool('item', Item.beams),
        { slug: 'boss', name: 'Boss', icon: 'sm-map -boss' },
        { slug: 'chozo', name: 'Chozo', icon: 'sm-chozo' },
        this.makeTool('door', doors),
        this.makeTool('room', Area.list),
        this.makeTool('map', map_markers),
      ]
    },
    viewer_data() {
      const { pointer } = this.$store.viewer.state
      if (!pointer) {
        return
      }
      const { map_item_size } = this.world
      const [x, y] = [pointer.x, pointer.y].map((i) => Math.floor(i / map_item_size))
      return [`${x}x${y}`, `${x / map_item_size}x${y / map_item_size}`]
    },
  },
  methods: {
    selectTool(tool) {
      this.$store.viewer.patch({ selected_tool: tool.slug, ...tool.extra_state })
    },
    makeTool(slug, children) {
      const selected_child = this.$store.viewer.state[slug + '_tool']
      const { selected_tool } = this.$store.viewer.state
      const selected = slug === selected_tool && children.includes(selected_child)
      const active_child = selected ? selected_child : children[0]
      return {
        slug,
        selected,
        extra_state: { [slug + '_tool']: active_child },
        name: slug[0].toUpperCase() + slug.slice(1),
        icon: `sm-${slug} -${active_child}`,
        children: children?.map((child_slug) => ({
          slug: child_slug,
          class: `sm-${slug} -${child_slug}`,
          btn: ['btn', selected_child === child_slug ? '-primary' : '-secondary'],
          click: () => this.$store.viewer.patch({ [slug + '_tool']: child_slug }),
        })),
      }
    },
  },
}
</script>
