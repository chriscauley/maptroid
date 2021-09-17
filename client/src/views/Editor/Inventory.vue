<template>
  <div class="inventory">
    <div v-for="(row, i) in grid" class="inventory__row" :key="i">
      <div v-for="cell in row" :class="cell.class" :key="cell.slug">
        <div v-if="cell.count" class="flaire">{{ cell.count }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import Item from '@/models/Item'

export default {
  props: {
    items: Array,
    missing_items: Array,
    world: Object,
  },
  computed: {
    grid() {
      const hist = {}
      // console.log(this.missing_items?.filter(i => i.class==="item"))
      this.items.forEach((item) => (hist[item.type] = (hist[item.type] || 0) + 1))
      const match = {}
      this.items.forEach((i) => {
        const key = `${i.world_xy}|${i.screen_xy}`
        if (match[key]) {
          console.warn('potentially duplicated item', match[key], i)
        }
        match[key] = i
      })
      const item_sets = [Item.packs, Item.beams, Item.abilities]
      if (this.world.custom_items?.length) {
        item_sets.push(this.world.custom_items)
      }
      const rows = item_sets.map((slugs) => {
        return slugs.map((slug) => ({
          slug,
          class: [`sm-item -${slug}`, { has: hist[slug] }],
        }))
      })
      rows.forEach((row, i) => {
        if ([0, 3].includes(i)) {
          row.forEach((cell) => {
            if (['missile', 'super-missile', 'power-bomb'].includes(cell.slug)) {
              cell.count = hist[cell.slug] * 5
            } else {
              cell.count = hist[cell.slug]
            }
          })
        }
      })
      return rows
    },
  },
}
</script>
