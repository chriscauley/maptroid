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
          <td v-for="row in rows" :key="row.id" valign="bottom" @click="sorter=row.id">
            <img :src="row.url" width="32" />
          </td>
        </tr>
        <tr v-for="row in rows" :key="row.id">
          <td align="right" @click="sorter=row.id">
            <img :src="row.url" style="height:32px" />
          </td>
          <td v-for="diff, i in row.diffs" :key="i" align="center" :class="diff.class">
            {{ diff.value }}
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
      return this.$store.smilesprite.getPage({query: { per_page: 5000 }})?.items
    },
    rows() {
      const start = new Date().valueOf()
      let rows = this.sprites.map(s => ({...s}))
      rows.forEach(s => s.dhash = s.binary_dhash.split(""))
      rows.forEach(s1 => {
        s1.diffs = rows.map(s2 => {
          const value = s1.dhash.filter((v,i) => s2.dhash[i] !== v).length
          return { value, class: ['_cell', this.getColor(value)] }
        })
      })
      if (this.sorter) {
        const index = rows.findIndex(r => r.id === this.sorter)
          rows = sortBy(rows.slice(), r => r.diffs[index].value)
        rows.forEach(s1 => {
          s1.diffs = rows.map(s2 => {
            const value = s1.dhash.filter((v,i) => s2.dhash[i] !== v).length
            return { value, class: ['_cell', this.getColor(value)] }
          })
        })
      }
      console.log(new Date().valueOf() - start)
      return rows
    },
  },
  methods: {
    getColor(value) {
      if (this.mode === 'dhash') {
        if (! value) {
          return "-green"
        } else if (value < 10) {
          return "-yellow"
        } else if (value < 20) {
          return '-orange'
        }
        return '-red'
      }
    }
  }
}
</script>