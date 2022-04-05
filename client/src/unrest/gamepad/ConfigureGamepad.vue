<template>
  <div>
    <table class="table">
      <tr v-for="item in items" :key="item.key">
        <td>{{ item.key }}</td>
        <td>{{ item.value }}</td>
        <td>
          <div v-if="setting === item.key">Press any key!</div>
          <div v-else class="btn -primary" @click="setting = item.key">Select key</div>
        </td>
      </tr>
    </table>

    <div class="btn -primary" @click="$gamepad.resetDefaults">
      Reset Defaults
    </div>
  </div>
</template>

<script>
import gamepad from './gamepad'

export default {
  __route: {
    path: '/gamepad/configure',
  },
  data() {
    return { setting: null }
  },
  computed: {
    items() {
      const taken = {}
      const items = Object.entries(this.$gamepad.config).map(([key, value]) => {
        taken[value] = (taken[value] || 0) + 1
        return { key, value }
      })
      items.forEach((i) => (i.conflict = taken[i.value] > 1))
      return items.filter((i) => i.key !== '__locked')
    },
  },
  mounted() {
    const { buttonDown } = this
    gamepad.watch({ buttonDown })
  },
  methods: {
    buttonDown(_, key) {
      if (this.setting && !this.$gamepad.config.__locked?.includes(key)) {
        this.$gamepad.set(this.setting, key)
        this.setting = null
      }
    },
  },
}
</script>
