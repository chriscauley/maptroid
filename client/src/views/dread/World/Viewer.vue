<template>
  <base-viewer class="dread-world-viewer" :osd_store="osd_store" @viewer-bound="open" />
</template>

<script>
import BaseViewer from '@/components/BaseViewer.vue'

export default {
  components: { BaseViewer },
  props: {
    zones: Array,
    osd_store: Object,
  },
  methods: {
    open() {
      const url = '/static/dread/zone_shapes/world-clean_short.png'
      this.osd_store.viewer.addSimpleImage({ url, width: 1 })
    },
  },
}
</script>
