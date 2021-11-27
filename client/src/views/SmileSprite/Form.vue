<template>
  <div>
    <div class="admin-smile-sprite__img" :style="`background-image: url('${sprite.url}')`" />
    <unrest-schema-form :form_name="`schema/smile-sprite/${sprite.id}`" :success="success" />
    <div v-for="room in rooms" :key="room.id">
      <hr />
      {{ room.name }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    sprite: Object,
  },
  emits: ['refetch', 'close'],
  computed: {
    rooms() {
      const rooms = this.$store.room2.getPage({ query: { per_page: 5000 } })?.items || []
      return rooms.filter((r) => r.data.plm_sprites?.filter((s) => s[0] === this.sprite.id).length)
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
