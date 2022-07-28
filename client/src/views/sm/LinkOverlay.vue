<template>
  <router-link v-for="link in links" :key="link.key" v-bind="link.attrs">
    <div class="_before" :style="link.before" />
  </router-link>
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

    ctx.fillText(text, s / 2, s / 2 + (a - d) / 2, 64)

    bg_cache[cache_key] = `url(${canvas.toDataURL()})`
  }
  return bg_cache[cache_key]
}

export default {
  inject: ['map_props', 'osd_store'],
  computed: {
    links() {
      const out = []
      const all_links = {}
      const rooms = this.$store.route.world_rooms.filter(
        (r) => this.map_props.room_bounds[r.id] && r.data.links,
      )
      rooms.forEach((room) => {
        const [room_x, room_y] = this.map_props.room_bounds[room.id]
        Object.entries(room.data.links).forEach(([xy, link]) => {
          xy = xy.split(',').map(Number)
          all_links[link.text] = all_links[link.text] || []
          all_links[link.text].push(room.id)
          out.push({
            key: `${room.id}_${xy}`,
            xy,
            room_id: room.id,
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
      out.forEach((link) => {
        const targets = all_links[link.text]
        const room_id = targets.find((id) => id !== link.room_id)
	const { world_slug } = this.$route.params
        if (!room_id) {
          if (world_slug !== 'hyper-metroid') {
	     console.warn('Unable to find matching link', link)
	  }
        } else if (targets.length !== 2) {
          const skip = {
            ascent: ['BA', 'F', 'AD', 'CB'],
            'hyper-metroid': ['1', '4', '7', '10', '13'],
	  }
          if (!skip['world_slug'].includes(link.text)) {
            console.warn('Extra targets for link', link, all_links)
          }
        }
        link.attrs.to = `?room=${room_id}`
        link.attrs.onClick = () => this.osd_store.gotoRoom({ id: room_id }, this.map_props)
      })
      return out
    },
  },
}
</script>
