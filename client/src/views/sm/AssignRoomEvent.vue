<template>
  <div class="assign-room-event">
    <div class="assign-room-event__list">
      <div v-for="room in room_list" :key="room.key" :class="getRoomClass(room)">
        <router-link :to="`?room=${room.key}`">
          <i v-if="room.errors" class="fa fa-exclamation -red" />
          <span v-if="room.events.length > 1">
            <i v-if="!room.default_event" class="fa fa-exclamation -yellow" />
            {{ room.events.length }}x
          </span>
          {{ room.smile_id }}
        </router-link>
      </div>
    </div>
    <div class="assign-room-event__content">
      <h3>
        {{ $route.params.world_slug }}
        {{ selected?.key }}
      </h3>
      <div class="btn-group" v-if="selected?.events.length > 1">
        <div
          :class="getEventClass(event)"
          @click="assignEvent(event)"
          v-for="event in selected.events"
          :key="event"
        >
          {{ event }}
        </div>
        <div :class="getEventClass()" @click="assignEvent()">None</div>
      </div>
      <div v-for="(reason, key) in selected?.errors" :key="key">
        {{ reason }}: {{ key }} replace with:
        <div
          v-for="event in selected.events"
          :key="event"
          class="btn -danger"
          @click="replace(key, event)"
        >
          {{ event }}
        </div>
      </div>
      <div class="unrest-floating-actions">
        <select v-model="layer" class="btn -primary">
          <option>layer-1</option>
          <option>layer-2</option>
          <option>bts</option>
          <option>bts-extra</option>
        </select>
      </div>
      <div v-for="event in selected?.events" :key="event" class="_event-row">
        <div :class="getEventClass(event)" @click="assignEvent(event)">
          {{ event }}
        </div>
        <div class="_images">
          <div class="_top-menu"></div>
          <img :src="getImage(layer, event)" />
          <img :src="getImage('plm_enemies', event)" class="_top-image" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { sortBy } from 'lodash'

import { getClient } from '@unrest/vue-storage'

const client = getClient()

export default {
  __route: {
    path: '/staff/assign-room-event/:world_slug/',
  },
  data() {
    this.refreshData()
    return { data: null, layer: 'layer-1' }
  },
  computed: {
    room_list() {
      const rooms = this.$store.route.world_rooms
      if (!(rooms && this.data)) {
        return
      }
      const prepped_rooms = rooms.map((room) => {
        const smile_id = room.key.split('_')[1].split('.')[0]
        const events = this.data.room_events[smile_id]
        const errors = this.data.room_errors[smile_id]
        return {
          default_event: room.data.default_event,
          key: room.key,
          smile_id,
          events,
          errors,
          weight: -events.length - (errors ? 10 : 0),
        }
      })
      return sortBy(prepped_rooms, (r) => r.weight)
    },
    selected() {
      const room_key = this.$route.query.room
      const room = room_key && this.room_list?.find((r) => r.key === room_key)
      if (!room) {
        return null
      }
      return {
        ...room,
      }
    },
  },
  methods: {
    refreshData() {
      axios.get(`/media/winderz/${this.$route.params.world_slug}.json`).then(({ data }) => {
        this.data = data
      })
    },
    getImage(layer, event) {
      const { world_slug } = this.$route.params
      return `/sink/${world_slug}/${layer}/${event}/${this.selected.key}`
    },
    getRoomClass(room) {
      return room.key === this.$route.query.room && '_selected-room'
    },
    getEventClass(event) {
      return ['btn', event === this.selected.default_event ? '-primary' : '-secondary']
    },
    replace(error_key, source_event) {
      const [layer, target_event] = error_key.split('__')
      if (target_event === source_event) {
        this.$ui.toast.error('Target and source are the same')
      } else {
        const { key, smile_id } = this.selected
        const { world_slug } = this.$route.params
        const data = { target_event, source_event, layer, key, world_slug, smile_id, error_key }
        client.post('swap-room-event/', data).then((data) => (this.data = data))
      }
    },
    assignEvent(default_event) {
      const room_key = this.$route.query.room
      const rooms = this.$store.route.world_rooms
      const room = rooms.find((r) => r.key === room_key)
      room.data.default_event = default_event
      client.post('save-default-event/', { room_id: room.id, default_event })
    },
  },
}
</script>
