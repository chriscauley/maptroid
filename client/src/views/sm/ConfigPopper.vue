<template>
  <unrest-popper class="sm-config-popper">
    <div v-for="group in groups" :key="group.name">
      <div class="sm-config-popper__title">{{ group.name }}</div>
      <div class="sm-config-popper__items">
        <label v-for="item in group.items" :key="item.name">
          <input type="checkbox" @input="toggle(item)" :checked="item.checked" />
          {{ item.name }}
        </label>
      </div>
    </div>
  </unrest-popper>
</template>

<script>
import { startCase } from 'lodash'

const groups = {
  layers: {
    ['layer-1']: true,
    bts: true,
    rooms: true,
    svg: true,
  },
  entities: {
    items: true,
    // enemies: true,
    // doors: true,
    route: true,
  },
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
