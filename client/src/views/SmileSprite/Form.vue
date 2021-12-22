<template>
  <unrest-modal @close="$emit('close')">
    <div>
      <div class="admin-smile-sprite__preview">
        <div class="admin-smile-sprite__img" :style="`background-image: url('${sprite.url}')`" />
        <svg v-if="svg_path" width="64" height="64">
          <path :d="svg_path" stroke="#0F0" stroke-width="4" />
        </svg>
      </div>
      <unrest-schema-form :form_name="`schema/smile-sprite/${sprite.id}`" :success="success" />
      <div v-for="room in rooms" :key="room.id" class="admin-smile-sprite__room-list">
        <hr />
        {{ room.name }}
      </div>
    </div>
    <template #actions>
      <i class="fa fa-chevron-left" @click="$emit('select-dindex', -1)" />
      <i class="fa fa-chevron-right" @click="$emit('select-dindex', 1)" />
    </template>
  </unrest-modal>
</template>

<script>
export default {
  props: {
    sprite: Object,
  },
  emits: ['refetch', 'close', 'select-dindex'],
  computed: {
    rooms() {
      const rooms = this.$store.room.getPage({ query: { per_page: 5000 } })?.items || []
      if (this.sprite.layer === 'bts') {
        return rooms.filter((r) => r.data.bts?.sprites.find((s) => s === this.sprite.id))
      }
      return rooms.filter((r) => r.data.plm_sprites?.find((s) => s[0] === this.sprite.id))
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
