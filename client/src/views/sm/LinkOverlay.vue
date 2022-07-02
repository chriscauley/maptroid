<template>
  <div v-for="link in links" :key="link.key" v-bind="link.attrs" @click="(e) => click(e, link)">
    <div class="_before" :style="link.before" />
  </div>
</template>

<script>
const _percent = (i, room_i) => `${100 * (i / 16 + room_i)}%`
const bg_cache = {}

const getText = (link) => {
  const light_bgs = ['white', 'yellow', 'green', 'cyan']
  const text_color = light_bgs.includes(link.color) ? 'black' : 'white'
  const cache_key = `${link.text}__${text_color}`
  if (!bg_cache[cache_key]) {
    const { text } = link
    const canvas = document.createElement('canvas')
    const s = (canvas.width = canvas.height = 64)
    const ctx = canvas.getContext('2d')
    ctx.font = '48px monospace'
    ctx.fillStyle = text_color

    // center text in box
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    const { actualBoundingBoxAscent: a, actualBoundingBoxDescent: d } = ctx.measureText(text)

    ctx.fillText(text, s / 2, s / 2 + (a - d) / 2)

    bg_cache[cache_key] = `url(${canvas.toDataURL()})`
  }
  return bg_cache[cache_key]
}

export default {
  inject: ['map_props'],
  computed: {
    links() {
      const out = []
      const rooms = this.$store.route.world_rooms.filter(
        (r) => this.map_props.room_bounds[r.id] && r.data.links,
      )
      rooms.forEach((room) => {
        const [room_x, room_y] = this.map_props.room_bounds[room.id]
        Object.entries(room.data.links).forEach(([xy, link]) => {
          xy = xy.split(',').map(Number)
          out.push({
            key: `${xy}`,
            xy,
            color: link.color,
            text: link.text,
            attrs: {
              class: `sm-link -${link.color}`,
              style: {
                left: `${100 * (xy[0] / 16 + room_x)}%`,
                top: `${100 * (xy[1] / 16 + room_y)}%`,
                width: `${100 / 16}%`,
                height: `${100 / 16}%`,
              },
            },
            before: {
              backgroundImage: getText(link),
            },
          })
        })
      })
      return out
    },
  },
  methods: {
    click(_event, _item) {},
  },
}
</script>
