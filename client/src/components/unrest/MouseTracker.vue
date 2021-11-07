<!-- A wrapper for capturing gridded mouse relative to the container it's in -->
<template>
  <div class="unrest-mouse-tracker" @click="click" @mousemove="mousemove">
    <div v-if="cursor" class="unrest-mouse-tracker__cursor" :style="cursor_style" />
    <div v-for="item in prepped_items" :key="item.id" :style="item.style" :class="item.class" />
    <slot />
  </div>
</template>

<script>
const clamp = (min, value, max) => Math.min(max, Math.max(min, value))

export default {
  props: {
    width: Number,
    items: Array,
  },
  data() {
    return { cursor: null, grid_size: 1, rect: {} }
  },
  computed: {
    cursor_style() {
      return {
        left: this.cursor.x * this.grid_size + 'px',
        top: this.cursor.y * this.grid_size + 'px',
        width: (this.cursor.width || 1) * this.grid_size + 'px',
        height: (this.cursor.height || 1) * this.grid_size + 'px',
      }
    },
    prepped_items() {
      return this.items.map((item) => ({
        style: {
          left: item.xy[0] * this.grid_size + 'px',
          top: item.xy[1] * this.grid_size + 'px',
          width: (item.width || 1) * this.grid_size + 'px',
          height: (item.height || 1) * this.grid_size + 'px',
        },
        class: ['unrest-mouse-tracker__item', item.class],
      }))
    },
    height() {
      return Math.max(this.rect.height / this.grid_size)
    },
  },
  watch: {
    width: 'resize',
  },
  mounted() {
    new ResizeObserver(this.resize).observe(this.$el)
    this.resize()
  },
  methods: {
    click(event) {
      this.prepEvent(event)
    },
    mousemove(event) {
      this.prepEvent(event)
      this.cursor = event.grid
    },
    resize() {
      this.rect = this.$el.getBoundingClientRect()
      this.grid_size = this.rect.width / this.width
    },
    prepEvent(event) {
      this.resize() // ResizeObserver won't detect changes in rect.x
      event.grid = {
        size: this.grid_size,
        px: event.clientX - this.rect.x,
        py: event.clientY - this.rect.y,
      }
      event.grid.x = Math.floor(event.grid.px / event.grid.size)
      event.grid.y = Math.floor(event.grid.py / event.grid.size)
      event.grid.x = clamp(0, event.grid.x, this.width)
      event.grid.y = clamp(0, event.grid.y, this.height)
    },
  },
}
</script>
