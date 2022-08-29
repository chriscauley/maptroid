<template>
  <div class="assign-room-event">
    <div class="assign-room-event__list">
      <div v-for="room in room_list" :key="room.key" :class="getRoomClass(room)">
        <router-link :to="`?room=${room.key}`">
          <i v-if="room.errors" class="fa fa-exclamation -red" />
          <i v-if="room.is_split" class="fa fa-check -green" />
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
        <a v-if="selected" :href="`/djadmin/maptroid/room/${selected.id}/`">
          {{ selected.key }}
          <i class="fa fa-edit" />
        </a>
      </h3>
      <div v-if="selected" class="assign-room-event__info">
        <img :src="rf_info.src" />
        <div>
          <div v-for="(item, key) in rf_info.items" :key="key">{{ key }}: {{ item }}</div>
        </div>
      </div>
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
        <div class="btn -danger" @click="replace(key, 'coerce')">
          Coerce image to room
        </div>
        <div class="btn -danger" @click="replace(key, 'reverse')">
          Coerce room to image
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
        <div class="_top-menu btn-group">
          <div
            v-if="selected.split_events[event]"
            class="btn -text"
            @click="doAction('split', event)"
          >
            <i class="fa fa-check -green" />
            Split!
          </div>
          <template v-else>
            <div :class="getEventClass(event)" @click="assignEvent(event)">
              {{ event }}
            </div>
            <div class="btn -success" @click="doAction('split', event)">
              Split into new room
            </div>
            <div class="btn -success" @click="doAction('copy', event)">
              Copy Room
            </div>
          </template>
        </div>
        <div class="_images" :style="rf_info.style">
          <div class="_rf-img" :style="rf_info.style" />
          <img :src="getImage(layer, event)" class="_top-image" />
          <img :src="getImage('plm_enemies', event)" class="_top-image" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
    rf_info() {
      const { world_slug } = this.$route.params
      const room_key = this.$route.query.room
      const room = this.$store.route.world_rooms.find((r) => r.key === room_key)
      const [x, y, width, height] = room.data.zone.bounds
      return {
        src: `/media/_maptroid-sink/${world_slug}/rf_scrape/${room.key}`,
        items: { x, y, width, height },
        style: `width: ${width * 256}px;height: ${height * 256}px`,
      }
    },
    room_list() {
      let rooms = this.$store.route.world_rooms
      if (!(rooms && this.data)) {
        return
      }
      rooms = rooms.filter((r) => !r.data.event)
      rooms = rooms.filter((r) => !r.data.split_lock)
      const prepped_rooms = rooms.map((room) => {
        const smile_id = room.key.split('_')[1].split('.')[0]
        const events = this.data.room_events[smile_id] || []
        if (!events.length) {
          console.error('missing events for', smile_id)
        }
        const errors = this.data.room_errors[smile_id]
        const split_events = {}
        let is_split = false
        events.forEach((event) => {
          const slug = event.toLowerCase().replace('=', '')
          if (room.data.events?.includes(slug)) {
            is_split = split_events[event] = true
          }
        })
        return {
          id: room.id,
          key: room.key,
          default_event: room.data.default_event,
          smile_id,
          split_events,
          is_split,
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
      return { ...room }
    },
  },
  methods: {
    refreshData() {
      client.get(`winderz/${this.$route.params.world_slug}`).then((data) => {
        this.data = data
      })
    },
    getImage(layer, event) {
      const { world_slug } = this.$route.params
      return `/media/_maptroid-sink/${world_slug}/${layer}/${event}/${this.selected.key}`
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
    doAction(action, event) {
      const room_id = this.selected.id
      const { world_slug } = this.$route.params
      const data = { room_id: room_id, action, event, world_slug }
      client.post('room/event/', data)
    },
  },
}
</script>
