const clamp = (number, lower, upper) => Math.min(upper, Math.max(number, lower))

export default {
  data() {
    return {
      boxy: {
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        min_scale: 1,
        max_scale: 5,
        mouse: { x: 0, y: 0 },
      },
    }
  },
  methods: {
    onMousewheel() {
      // this hook should be overriden by component
    },
    mousemove(event) {
      const { scale, offsetX, offsetY } = this.boxy
      const box = this.$el.getBoundingClientRect()
      const clientX = event.pageX - box.left
      const clientY = event.pageY - box.top
      this.boxy.mouse = {
        x: clientX / scale - offsetX,
        y: clientY / scale - offsetY,
      }
    },
    mousewheel(event) {
      if (event.ctrlKey) {
        this.mousezoom(event)
      } else {
        this.boxy.offsetX -= event.deltaX / this.boxy.scale
        this.boxy.offsetY -= event.deltaY / this.boxy.scale
      }
      this.boxy.offsetX = clamp(this.boxy.offsetX, -500, 500)
      this.boxy.offsetY = clamp(this.boxy.offsetY, -500, 500)
      this.onMousewheel(this.boxy)
    },
    mousezoom(event) {
      const { scale, offsetX, offsetY, min_scale, max_scale } = this.boxy
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

      Object.assign(this.boxy, {
        offsetX: offsetX - deltaX,
        offsetY: offsetY - deltaY,
        scale: nextScale,
      })
    },
  },
}
