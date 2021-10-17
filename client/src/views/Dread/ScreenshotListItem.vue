<template>
  <div :key="screenshot.id" class="panel-screenshot">
    <img :src="screenshot.image" @load="cropImage" ref="img" />
    <div class="panel-screenshot__buttons">
      #{{ screenshot.id }}
      <template v-if="screenshot.zone">
        <span>{{ screenshot.data.zone_xy }}</span>
        <input v-model="screenshot.data.zone_zoom" type="number" style="width: 50px;" />
      </template>
      <select v-model="screenshot.zone" @input="onInput">
        <option value="">No zone</option>
        <option v-for="zone in zones" :key="zone" :value="zone.id">{{ zone.name }}</option>
      </select>
    </div>
  </div>
</template>

<script>
export const img_cache = {}

export default {
  props: {
    screenshot: Object,
  },
  computed: {
    zones() {
      return this.$store.zone.getPage({ per_page: 100 })?.items || []
    },
  },
  methods: {
    cropImage() {
      if (this.screenshot.id === 1) {
        setTimeout(() => {
          this.screenshot.zone = 1
          this.onInput()
        }, 500)
      }
      const { screenshot } = this
      const canvas = (img_cache[screenshot.id] = document.createElement('canvas'))
      const img = document.createElement('img')
      img.onload = () => {
        // TODO crop numbers are a hard code for metroid dread
        // do during import script instead
        const crop0 = 140
        const crop1 = 570
        const width = (canvas.width = img.width)
        const height = (canvas.height = crop1 - crop0)
        canvas.getContext('2d').drawImage(img, 0, crop0, width, height, 0, 0, width, height)
      }
      img.src = screenshot.image
    },
    onInput() {
      if (!this.screenshot.data.zone_xy) {
        // first time being applied to zoom, set defaults
        const { width, height } = img_cache[this.screenshot.id]
        Object.assign(this.screenshot.data, {
          zone_xy: [0, 0],
          zone_zoom: 1,
          width,
          height,
        })
      }
    },
  },
}
</script>
