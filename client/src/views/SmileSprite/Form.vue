<template>
  <unrest-modal @close="$emit('close')">
    <div>
      <div class="admin-smile-sprite__preview">
        <div id="geo-box">
          <div class="admin-smile-sprite__img" :style="`background-image: url('${sprite.url}')`" />
          <div class="admin-smile-sprite__buttons">
            <a :href="sprite.url" target="_blank" class="btn -primary -mini">
              <i class="fa fa-file-image" />
            </a>
          </div>
        </div>
        <svg v-if="svg_path" width="64" height="64">
          <path :d="svg_path" stroke="#0F0" stroke-width="4" />
        </svg>
      </div>
      <unrest-schema-form
        :form_name="`schema/smile-sprite/${sprite.id}`"
        :success="success"
        :ui="ui"
      />
    </div>
    <template #actions>
      <i class="fa fa-chevron-left" @click="$emit('select-dindex', -1)" />
      <i class="fa fa-chevron-right" @click="$emit('select-dindex', 1)" />
    </template>
  </unrest-modal>
</template>

<script>
import GeoBox from './GeoBox.vue'

export default {
  props: {
    sprite: Object,
  },
  emits: ['refetch', 'close', 'select-dindex'],
  computed: {
    ui() {
      return { type: { tagName: GeoBox } }
    },
    svg_path() {
      if (!this.sprite.type.startsWith('b_')) {
        return null
      }
      const points = this.sprite.type
        .slice(2)
        .split('')
        .map((index) => {
          index = parseInt(index)
          const point = [index % 3, Math.floor(index / 3)]
          return point.map((i) => i * 32)
        })
      const origin = points[points.length - 1]
      const lines = points.map((p) => `L ${p}`).join(' ')
      return `M ${origin} ${lines}`
    },
  },
  methods: {
    success(data) {
      this.$emit('refetch', data.id)
      this.$emit('close')
    },
  },
}
</script>
