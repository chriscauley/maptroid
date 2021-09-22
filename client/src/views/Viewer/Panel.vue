<template>
  <div class="osd-panel -viewer">
    <div class="osd-panel__inner">
      <inventory
        :world="world"
        :items="game.listItems()"
        :missing_items="game.listMissingItems()"
      />
      <div v-if="room" class="osd-panel__title">
        Room #{{ room.id }} - {{ room.name || 'unknown' }}
      </div>
      <div class="osd-panel__items list-group">
        <div v-for="(item, i) in items" :key="item.id" :class="css.itemWrapper(item)">
          <i v-if="icons[item.id]" :class="icons[item.id]" />
          <div v-else class="osd-panel__target-number">{{ i + 1 }}</div>
          <div :class="css.item(item)" />
          <div class="flex-grow">{{ item.type }}</div>
          <div class="flex-grow" />
          <i class="fa fa-search" @click="gotoItem(item)" />
        </div>
      </div>
      <div class="flex-grow" />
      <div class="osd-panel__stats">
        <div class="osd-panel__stats-title">
          Moves: {{ game.playthrough.actions.length }}
          <div class="btn -primary -mini" @click="game.undo(1)">
            <i class="fa fa-undo" />
          </div>
          <div class="btn -primary -mini" @click="game.undo(10)"><i class="fa fa-undo" />x10</div>
        </div>
        <div class="osd-panel__action-list">
          <div v-for="(action, i) in lastActions" :key="i">
            #{{ game.playthrough.actions.length - i }}: {{ action }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Inventory from '@/views/Editor/Inventory.vue'

export default {
  components: { Inventory },
  props: {
    game: Object,
    items: Array,
    room: Object,
    world: Object,
    viewer: Object,
    gotoItem: Function,
  },
  computed: {
    icons() {
      const { missing, items } = this.game.state
      const out = {}
      this.items.forEach(({ id }) => {
        if (items[id]) {
          out[id] = 'osd-panel__target-number fa fa-check'
        } else if (missing[id]) {
          out[id] = 'osd-panel__target-number fa fa-close'
        }
      })
      return out
    },
    css() {
      const { selected_item } = this.$store.viewer.state
      return {
        itemWrapper: (item) => [
          'osd-panel__item list-group-item',
          { '-selected': selected_item === item.id },
        ],
        item: (item) => {
          if (item.class === 'boss') {
            return 'sm-map -boss osd-panel__item-icon'
          }
          return `sm-${item.class} -${item.type} osd-panel__item-icon`
        },
      }
    },
    lastActions() {
      const { actions } = this.game.playthrough
      return actions.slice(actions.length - 50).reverse()
    },
  },
}
</script>
