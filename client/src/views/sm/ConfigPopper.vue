<template>
  <unrest-popper class="sm-config-popper">
    <div v-for="group in groups" :key="group.name">
      <div class="sm-config-popper__title">{{ group.name }}</div>
      <div class="sm-config-popper__items">
        <label v-for="item in group.items" :key="item.name">
          <input type="checkbox" @input="toggle(item)" :checked="item.checked" />
          {{ item.name }}
          <i v-if="item.help_text" class="fa fa-question-circle" :title="item.help_text" />
        </label>
      </div>
    </div>
  </unrest-popper>
</template>

<script>
import { flatten, startCase } from 'lodash'

const groups = {
  layers: {
    'layer-1': true,
    rooms: true,
    walls: false,
    bts: false,
    plm_enemies: false,
  },
  entities: {
    items: true,
    // enemies: true,
    // doors: true,
    route: false,
    links: true,
  },
}

export const LAYER_NAMES = flatten(Object.values(groups).map((g) => Object.keys(g)))
LAYER_NAMES['layer-1'] = 'Layer 1 + 2'
export const INITIAL_LAYERS = {
  settings_open: true,
  'show_layer-1': true,
  show_rooms: true,
  show_walls: true,
  show_items: true,
  show_links: true,
}

export const DZI_LAYERS = ['layer-1', 'bts', 'plm_enemies', 'walls']

const help_texts = {
  'layer-1': 'Foreground and background layers exported from SMILE',
  rooms: 'Shape of rooms (manually defined where not a rectangle)',
  bts: 'This is the room geometry and special tiles according to SMILE.',
  plm_enemies: 'This is the "post load modifications" (items, etc) and enemies layers from SMILE.',
  svg: 'My room geometry, reverse engineered from bts.',
  route: 'Route taken by selected video (coming soon!)',
}

export default {
  props: {
    storage: Object,
  },
  computed: {
    groups() {
      return Object.entries(groups).map(([slug, items]) => ({
        name: startCase(slug),
        slug,
        items: Object.keys(items).map((item_slug) => ({
          slug: item_slug,
          name: startCase(item_slug),
          checked: this.storage.state[`show_${item_slug}`],
          help_text: help_texts[item_slug],
        })),
      }))
    },
  },
  methods: {
    toggle(item) {
      const slug = `show_${item.slug}`
      this.storage.save({ [slug]: !this.storage.state[slug] })
    },
  },
}
</script>
