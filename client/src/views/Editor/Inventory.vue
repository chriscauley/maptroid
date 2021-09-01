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
  },
  computed: {
    grid() {
      const hist = {}
      // console.log(this.missing_items?.filter(i => i.class==="item"))
      this.items.forEach((item) => (hist[item.type] = (hist[item.type] || 0) + 1))
      const rows = [Item.packs, Item.beams, Item.abilities].map((slugs) => {
        return slugs.map((slug) => ({
          slug,
          class: [`sm-item -${slug}`, { has: hist[slug] }],
        }))
      })
      rows[0].forEach((cell) => {
        if (['missile', 'super-missile', 'power-bomb'].includes(cell.slug)) {
          cell.count = hist[cell.slug] * 5
        } else if (['energy-tank', 'reserve-tank'].includes(cell.slug)) {
          cell.count = hist[cell.slug]
        }
      })
      return rows
    },
  },
}
</script>
