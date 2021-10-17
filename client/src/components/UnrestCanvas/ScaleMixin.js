const clamp = (number, lower, upper) => Math.min(upper, Math.max(number, lower))

export default {
  props: {
    state: {
      type: Object,
      default: () => ({}),
    },
  },
  mounted() {
    Object.assign(this.state, {
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      grid_size: 4,
      min_scale: 1,
      max_scale: 5,
      mouse: { x: 0, y: 0, grid_x: 0, grid_y: 0 },
      ...this.state,
    })
  },
  methods: {
    onMousewheel() {
      // this hook should be overriden by component
    },
    mousemove(event) {
      const { scale, offsetX, offsetY, grid_size } = this.state
      const box = this.$el.getBoundingClientRect()
      const clientX = event.pageX - box.left
      const clientY = event.pageY - box.top
      const x = clientX / scale - offsetX
      const y = clientY / scale - offsetY
      const grid_ix = Math.floor(x / grid_size)
      const grid_iy = Math.floor(y / grid_size)
      const grid_x = grid_ix * grid_size
      const grid_y = grid_iy * grid_size
      this.state.mouse = { x, y, grid_ix, grid_iy, grid_x, grid_y }
    },
    mousewheel(event) {
      if (event.ctrlKey) {
        this.mousezoom(event)
      } else {
        this.state.offsetX -= event.deltaX / this.state.scale
        this.state.offsetY -= event.deltaY / this.state.scale
      }
      this.state.offsetX = clamp(this.state.offsetX, -1500, 500)
      this.state.offsetY = clamp(this.state.offsetY, -1500, 500)
      this.mousemove(event)
      this.onMousewheel(this.state)
    },
    mousezoom(event) {
      const { scale, offsetX, offsetY, min_scale, max_scale } = this.state
      const box = this.$el.getBoundingClientRect()
      const clientX = event.pageX - box.left
      const clientY = event.pageY - box.top

      const nextScale = clamp(scale - event.deltaY / 100, min_scale, max_scale)

      const currentBoxWidth = box.width / scale
      const currentBoxHeight = box.height / scale

      const nextBoxWidth = box.width / nextScale
      const nextBoxHeight = box.height / nextScale

      const deltaX = (nextBoxWidth - currentBoxWidth) * (clientX / box.width - 0.5)
      const deltaY = (nextBoxHeight - currentBoxHeight) * (clientY / box.height - 0.5)

      // $image.css({
      //   transform : 'scale(' + nextScale + ')',
      //   left      : -1 * nextOffsetX * nextScale,
      //   right     : nextOffsetX * nextScale,
      //   top       : -1 * nextOffsetY * nextScale,
      //   bottom    : nextOffsetY * nextScale
      // })

      Object.assign(this.state, {
        offsetX: offsetX - deltaX,
        offsetY: offsetY - deltaY,
        scale: nextScale,
      })
    },
    scaleUp() {
      this.state.scale = Math.min(5, Math.floor(this.state.scale + 1))
    },
    scaleDown() {
      this.state.scale = Math.max(1, Math.floor(this.state.scale - 1))
    },
  },
}
