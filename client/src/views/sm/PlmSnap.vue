<template>
  <unrest-draggable class="plm-snap" @drag="drag" @dragend="dragend" @mousemove="mousemove">
    <div class="plm-snap__preview">
      <img v-if="src" :src="src" :width="$refs.canvas.width * 8" />
      <div class="plm-snap__canvas-size">{{ dragging?.width }}x{{ dragging?.height }}</div>
    </div>
    <canvas ref="canvas" v-show="false" />
    <div v-if="dragging" class="plm-snap__dragging" :style="dragging_style" />
  </unrest-draggable>
</template>

<script>
export default {
  props: {
    room: Object,
    plms: Array,
    img: Object,
  },
  data() {
    return { dragging: null, hidden_image: null, src: null }
  },
  computed: {
    dragging_style() {
      const { x, y, width, height } = this.dragging
      return {
        height: `${height}px`,
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
      }
    },
    canvas_style() {
      const { width, height } = this.dragging || { width: 16, height: 16 }
      return {
        right: `${2 * width}px`,
        top: `${2 * height}px`,
        background: 'black',
      }
    },
  },
  mounted() {
    this.$refs.canvas.width = this.$refs.canvas.height = 16
  },
  methods: {
    _normalize(event, object) {
      if (event.shiftKey) {
        Object.entries(object).forEach(([key, value]) => {
          object[key] = 16 * Math.floor(value / 16)
        })
      }
      if (object.width && object.width < 0) {
        object.x += object.width
        object.width = Math.abs(object.width)
      }
      if (object.height && object.height < 0) {
        object.y += object.height
        object.height = Math.abs(object.height)
      }
    },
    mousemove(event) {
      if (!this.dragging) {
        this._makeHiddenImage()
        const box = this.$el.getBoundingClientRect()
        const target = {
          x: Math.floor(event.clientX - box.x),
          y: Math.floor(event.clientY - box.y),
        }
        const { canvas } = this.$refs
        canvas.width = canvas.height = 16
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, 16, 16)
        this._normalize(event, target)
        ctx.drawImage(this.hidden_image, -target.x, -target.y)
        this.src = canvas.toDataURL()
      }
    },
    dragend() {
      if (this.dragging?.width) {
        const data_url = this.$refs.canvas.toDataURL()
        this.$store.smile.post('save-sprite/', { data_url }).then((response) => {
          this.$ui.toast.info(response.message)
        })
      }
      this.dragging = null
    },
    drag(event) {
      const [x0, y0] = event._drag.xy_start
      const [x, y] = event._drag.xy
      const box = this.$el.getBoundingClientRect()
      this.dragging = { x: x0 - box.x, y: y0 - box.y, width: x - x0, height: y - y0 }
      this._normalize(event, this.dragging)
      this.draw()
    },
    draw() {
      if (!this.dragging) {
        return
      }
      this._makeHiddenImage()
      const { canvas } = this.$refs
      const { x, y, width, height } = this.dragging
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(this.hidden_image, -x, -y)
      this.src = canvas.toDataURL()
    },
    _makeHiddenImage() {
      if (this.hidden_image) {
        return
      }
      const canvas = (this.hidden_image = document.createElement('canvas'))
      canvas.width = this.img.width
      canvas.height = this.img.height
      const ctx = canvas.getContext('2d')
      this.plms
        .filter((p) => !p._plm.deleted)
        .forEach((plm) => {
          const img = document.querySelector(`[src="${plm.src}"]`)
          const [x, y] = plm._plm.xy
          ctx.drawImage(img, x, y)
        })
    },
  },
}
</script>
