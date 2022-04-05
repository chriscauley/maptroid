<template>
  <div>
    <h1>Gamepad test zone</h1>
    <div class="test-gamepad">
      <div class="test-gamepad__left">
        <div v-for="button in buttons" :key="button.name">
          {{ button.name }}: {{ button.value }}
        </div>
        <div v-for="axis in axes" :key="axis.name">{{ axis.name }}: {{ axis.value }}</div>
      </div>
      <div class="test-gamepad__right" v-html="svg" /><!-- eslint-disable-line -->
    </div>
  </div>
</template>

<script>
import gamepad, { button_list, axis_list } from './gamepad'
import svg from 'raw-loader!./xbox-controller.html'
import './controller.css'

export default {
  data() {
    return {
      stick_offsets: {},
      svg,
      values: {},
    }
  },
  computed: {
    buttons() {
      return button_list.map((name) => ({ name, value: this.values[name] }))
    },
    axes() {
      return axis_list.map((name) => ({ name, value: this.values[name] }))
    },
  },
  mounted() {
    ;['left', 'right'].forEach((side) => {
      const el = this.$el.querySelector(`#${side}-stick`)
      this.stick_offsets[side] = {
        cx: el.cx.baseVal.value,
        cy: el.cy.baseVal.value,
        r: el.r.baseVal.value,
      }
    })
    gamepad(this)
  },
  methods: {
    buttonDown(name) {
      this.values[name] = true
      this.$el.querySelector(`#${name}-button`).style.fill = '#00FF00'
    },
    buttonUp(name) {
      this.values[name] = false
      this.$el.querySelector(`#${name}-button`).style.fill = '#888888'
    },
    setAxis(name, value) {
      this.values[name] = value
      const side = name.split('-')[0]
      const x = this.values[side + '-x'] || 0
      const y = this.values[side + '-y'] || 0
      const el = this.$el.querySelector(`#${side}-stick`)
      const { cx, cy, r } = this.stick_offsets[side]
      el.setAttribute('cx', cx + x * r * 1.25)
      el.setAttribute('cy', cy + y * r * 1.25)
      el.style.fill = x === 0 && y === 0 ? '#888888' : '#00FF00'
    },
  },
}
</script>

<style></style>
