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
    <div class="btn -light" style="font-size: 16px;">{{ viewer_data }}</div>
  </div>
</template>

<script>
import Area from '@/models/Area'
import { bosses, map_markers } from '@/models'

export default {
  computed: {
    css() {
      const { selected_tool } = this.$store.viewer.state
      return {
        tool: (tool) => [
          'btn viewer-toolbar__tool',
          tool.slug === selected_tool ? '-primary' : '-secondary',
        ],
      }
    },
    tools() {
      const { room_tool, map_tool } = this.$store.viewer.state
      const Room = {
        slug: 'room',
        name: 'Room',
        icon: `sm-room -${room_tool}`,
        children: Area.list.map((slug) => ({
          slug,
          class: `sm-room -${slug}`,
          btn: ['btn', room_tool === slug ? '-primary' : '-secondary'],
          click: () => this.$store.viewer.patch({ room_tool: slug }),
        })),
      }

      return [
        { slug: null, name: 'Select', icon: 'fa fa-mouse-pointer' },
        { slug: 'item', name: 'Item', icon: 'sm-item -super-missile-alt' },
        { slug: 'boss', name: 'Boss', icon: 'sm-map -boss' },
        Room,
        {
          slug: 'map',
          name: 'Map',
          icon: `sm-map -${map_tool}`,
          children: map_markers.map((slug) => ({
            slug,
            class: `sm-map -${slug}`,
            btn: ['btn', map_tool === slug ? '-primary' : '-secondary'],
            click: () => this.$store.viewer.patch({ map_tool: slug }),
          })),
        }
      ]
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
