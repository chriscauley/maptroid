<template>
  <div v-if="$store.route.ready">
    <label>
      <div class="form-control">
        <div v-for="room in selected_rooms" :key="room.id">
          <div :class="css.pill(room) + ' pointer'" @click="removeRoom(room)">
            {{ room.name }}
          </div>
        </div>
        <input type="text" v-model="search" @keydown="keydown" />
      </div>
    </label>
    <div v-if="search" class="list-group">
      <div class="list-group-item">
        <div>
          <div v-for="room in search_results.rooms" :key="room.id">
            <div :class="css.pill(room) + ' pointer'" @click="addRoom(room)">
              {{ room.name }}
            </div>
          </div>
        </div>
      </div>
      <div v-if="search_results.extra" class="list-group-item">
        {{ search_results.extra }} more rooms. Please narrow search.
      </div>
    </div>
  </div>
</template>

<script>
import { sortBy } from 'lodash'

export default {
  props: {
    modelValue: null,
    field: Object,
    form: Object,
  },
  emits: ['update:modelValue'],
  data() {
    return { search: '' }
  },
  computed: {
    rooms_by_id() {
      const out = {}
      this.$store.route.world_rooms?.forEach((r) => (out[r.id] = r))
      return out
    },

    selected_rooms() {
      const _map = this.$store.route.world_rooms_by_id
      return this.modelValue?.map((id) => _map[id])
    },

    search_results() {
      const { search } = this
      if (search.length < 4) {
        return {}
      }
      const { zones, world_rooms } = this.$store.route
      const zone_ids = zones.filter((z) => z.name.toLowerCase().includes(search)).map((z) => z.id)
      let rooms = world_rooms.filter(
        (r) => zone_ids.includes(r.zone) || r.name?.toLowerCase().includes(search),
      )
      rooms = sortBy(rooms, 'name')
      return {
        rooms: rooms.slice(0, 20),
        extra: Math.max(0, rooms.length - 20),
      }
    },
    css() {
      const { zones } = this.$store.route
      const zone_map = {}
      zones.forEach((z) => (zone_map[z.id] = z.slug))
      return {
        pill: (room) => `pill bg-zone -${zone_map[room.zone]}`,
      }
    },
  },
  methods: {
    onChange(e) {
      const value = coerce(e.target.value, this.field)
      this.$emit('update:modelValue', value)
    },
    keydown(e) {
      if (e.key === 'Enter' && this.search) {
        this.addRoom(this.search_results.rooms[0])
        e.preventDefault()
        e.stopPropagation()
      }
    },
    addRoom(room) {
      const value = (this.modelValue || []).slice()
      if (room && !value.includes(room.id)) {
        this.search = ''
        value.push(room.id)
        this.$emit('update:modelValue', value)
      }
    },
    removeRoom(room) {
      const value = (this.modelValue || []).slice()
      if (room && value.includes(room.id)) {
        this.$emit(
          'update:modelValue',
          value.filter((rid) => rid !== room.id),
        )
      }
    },
  },
}
</script>
