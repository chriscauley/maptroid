<template>
  <div class="smile-compare" v-if="sprites">
    <select v-model="mode">
      <option>dhash</option>
      <option>color</option>
      <option>both</option>
    </select>
    <table>
      <tbody>
        <tr>
          <td></td>
          <td v-for="row in rows" :key="row.id" valign="bottom" @click="sorter = row">
            <img :src="row.url" width="32" />
          </td>
        </tr>
        <tr v-for="row in rows" :key="row.id">
          <td align="right" @click="sorter = row">
            <img :src="row.url" style="height:32px" />
          </td>
          <td v-for="(cell, i) in row.cells" :key="i" align="center" :class="cell.class">
            {{ displayValue(cell.value) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { sortBy } from 'lodash'

export default {
  data() {
    return { sorter: null, mode: 'dhash' }
  },
  computed: {
    sprites() {
      return this.$store.smile.get('sprite-distances/')?.items
    },
    rows() {
      let sprites = this.sprites.slice()
      if (this.sorter) {
        sprites = sortBy(sprites, (s) => s.distances[this.sorter.id][this.mode])
      }
      sprites.forEach((s1) => {
        s1.cells = sprites.map((s2) => {
          const value = s1.distances[s2.id][this.mode]
          return { value, class: ['_cell', this.getColor(value)] }
        })
      })
      return sprites
    },
  },
  methods: {
    getColor(value) {
      const { mode } = this
      if (mode === 'dhash') {
        value = value / 8
      } else if (mode === 'color') {
        value = value / 8
      }

      if (!value) {
        return '-green'
      } else if (value < 1) {
        return '-yellow'
      } else if (value < 2) {
        return '-orange'
      }
      return '-red'
    },
    displayValue(value) {
      if (!value) {
        return value
      }
      if (value > 2) {
        return Math.round(value)
      }
      return value.toFixed(1)
    },
  },
}
</script>
