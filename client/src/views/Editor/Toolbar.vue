<template>
  <div class="viewer-toolbar">
    <div class="viewer-toolbar__row">
      <div class="viewer-toolbar__debug">{{ viewer_data }}</div>
    </div>
    <div class="viewer-toolbar__row" v-if="selected_tool?.children">
      <div
        v-for="(child, i) in selected_tool.children"
        :key="child.slug"
        @click="child.click"
        :class="child.btn"
        :title="child.slug"
      >
        <i :class="child.class" />
        <div v-if="!ctrl_down" class="flaire">{{ i + 1 }}</div>
      </div>
    </div>
    <div class="viewer-toolbar__row">
      <div
        v-for="(tool, i) in tools"
        :key="tool.name"
        :title="tool.name"
        @click="selectTool(tool)"
        :class="css.tool(tool)"
      >
        <i :class="tool.icon" />
        <div v-if="i !== 0 && ctrl_down" class="flaire">{{ i }}</div>
      </div>
      <div class="btn -light">
        <i class="fa fa-gear" />
        <div class="viewer-toolbar__hover">
          <router-link :to="`/admin/main/world/${world.id}/`">Admin</router-link>
          <router-link :to="`/viewer/${world.id}/`">Viewer</router-link>
          <select v-model="$store.viewer.state.map_style">
            <option value="off">off</option>
            <option value="mini">mini</option>
            <option value="full">full</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Item from '@/models/Item'
import { map_markers, doors } from '@/models'
import Mousetrap from '@unrest/vue-mousetrap'

export default {
  mixins: [Mousetrap.Mixin],
  props: {
    world: Object,
  },
  data() {
    return { ctrl_down: false }
  },
  computed: {
    mousetrap() {
      return {
        '1,2,3,4,5,6,7,8,9': this.pressChild,
        'mod+1,mod+2,mod+3,mod+4,mod+5,mod+6,mod+7,mod+8,mod+9': this.pressTool,
        mod: {
          keyup: () => (this.ctrl_down = false),
          keydown: () => (this.ctrl_down = true),
        },
      }
    },
    css() {
      const { selected_tool } = this.$store.viewer.state
      return {
        tool: (tool) => {
          let selected = tool.slug === selected_tool
          if (tool.selected !== undefined) {
            selected = selected && tool.selected
          }
          return `btn ${selected ? '-primary' : '-secondary'}`
        },
      }
    },
    tools() {
      const { custom_items } = this.world
      return [
        { slug: null, name: 'Select', icon: 'fa fa-mouse-pointer' },
        this.makeTool('item', Item.packs),
        this.makeTool('item', Item.abilities),
        this.makeTool('item', Item.beams),
        custom_items?.length && this.makeTool('item', custom_items),
        { slug: 'boss', name: 'Boss', icon: 'sm-map -boss' },
        { slug: 'chozo', name: 'Chozo', icon: 'sm-chozo' },
        this.makeTool('door', doors),
        this.makeTool('room', this.world.zones),
        this.makeTool('map', map_markers),
      ].filter(Boolean)
    },
    selected_tool() {
      const { selected_tool, item_tool } = this.$store.viewer.state
      if (selected_tool === 'item') {
        return this.tools.find((t) => t.children?.find((c) => c.slug === item_tool))
      }
      return this.tools.find((t) => t.slug === selected_tool)
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
    pressTool(e) {
      e.preventDefault()
      const tool = this.tools[e.key]
      if (tool) {
        this.selectTool(tool)
      }
    },
    pressChild(e) {
      e.preventDefault()
      const tool = this.selected_tool
      const child = tool.children?.[e.key - 1]
      if (child) {
        child.click()
      }
    },
    selectTool(tool) {
      const data = { selected_tool: tool.slug }
      if (tool.variant) {
        data[tool.slug + '_tool'] = tool.variant
      }
      this.$store.viewer.patch(data)
    },
    makeTool(slug, children) {
      const selected_child = this.$store.viewer.state[slug + '_tool']
      const { selected_tool } = this.$store.viewer.state
      const selected = slug === selected_tool && children.includes(selected_child)
      const variant = selected ? selected_child : children[0]
      return {
        slug,
        selected,
        variant,
        name: slug[0].toUpperCase() + slug.slice(1),
        icon: `sm-${slug} -${variant}`,
        children: children?.map((child_slug) => ({
          slug: child_slug,
          class: `sm-${slug} -${child_slug}`,
          btn: ['btn', selected_child === child_slug ? '-primary' : '-secondary'],
          click: () => this.selectTool({ slug, variant: child_slug }),
        })),
      }
    },
  },
}
</script>
