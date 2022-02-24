<template>
  <unrest-text v-model="value" @input="input" :field="field" />
  <teleport to="#geo-box">
    <div
      class="b2-box"
      v-if="prefix"
      @dblclick="reset"
      @click="addPoint"
      ref="box"
      @mousemove="mousemove"
    >
      <svg width="64" height="64">
        <line v-for="(line, i) in lines" :key="i" v-bind="line" stroke="#888" />
        <path v-if="points.length" :d="svg_path" stroke="#0FF" stroke-width="2" fill="none" />
        <ellipse v-if="last" :cx="last[0]" :cy="last[1]" rx="4" zy="4" style="fill: white" />
        <ellipse :cx="hover_xy[0]" :cy="hover_xy[1]" rx="8" zy="8" style="fill: red" />
      </svg>
    </div>
    <div class="geo-box__buttons btn-group">
      <button class="btn -primary -mini" @click="$emit('update:modelValue', 'b16_')">b16_</button>
      <button class="btn -primary -mini" @click="$emit('update:modelValue', 'b25_')">b25_</button>
      <button class="btn -primary -mini" @click="$emit('update:modelValue', '')">clear</button>
    </div>
  </teleport>
</template>

<script>
import { range } from 'lodash'
/*
Box looks like this
0 1 2 3 4
5 6 7 8 9
a b c d e
f g h i j
k l m n o
*/

const _hex = '0123456789abcdefghijklmno'

export default {
  props: {
    modelValue: String,
    field: Object,
  },
  emits: ['update:modelValue'],
  data() {
    return { hover_xy: [0, 0], value: this.modelValue }
  },
  computed: {
    modulo() {
      return this.prefix === 'b25_' ? 5 : 4
    },
    scale() {
      return 64 / (this.modulo - 1)
    },
    lines() {
      const out = []
      const { scale } = this
      range(this.modulo).forEach((i) => {
        out.push({ x1: 0, x2: 64, y1: i * scale, y2: i * scale })
        out.push({ y1: 0, y2: 64, x1: i * scale, x2: i * scale })
      })
      return out
    },
    prefix() {
      const s = this.modelValue.slice(0, 4)
      return ['b25_', 'b16_'].includes(s) ? s : null
    },
    points() {
      return this.modelValue
        .slice(4)
        .split('')
        .map((char) => {
          const index = _hex.indexOf(char)
          const point = [index % this.modulo, Math.floor(index / this.modulo)]
          return point.map((i) => i * this.scale)
        })
    },
    last() {
      return this.points[this.points.length - 1]
    },
    svg_path() {
      const origin = this.points[0]
      const lines = this.points.map((p) => `L ${p}`).join(' ')
      return `M ${origin} ${lines}`
    },
  },
  watch: {
    modelValue() {
      this.value = this.modelValue
    },
  },
  methods: {
    mousemove(e) {
      const { x, y } = this.$refs.box.getBoundingClientRect()
      const xy = [e.clientX - x, e.clientY - y]
      this.hover_xy = xy.map((i) => this.scale * Math.round((i - 8) / this.scale))
    },
    reset() {
      this.$emit('update:modelValue', this.prefix)
    },
    addPoint() {
      let { value } = this
      const [x, y] = this.hover_xy
      const char = _hex[Math.floor(x / this.scale) + this.modulo * Math.floor(y / this.scale)]
      if (value[value.length - 1] === char) {
        value = value.slice(0, value.length - 1)
      } else {
        value += char
      }
      this.$emit('update:modelValue', value)
    },
    input() {
      this.$emit('update:modelValue', this.value)
    },
  },
}
</script>

<style>
.b2-box {
  background: #333;
  height: 80px;
  position: relative;
  width: 80px;
}
.b2-box svg {
  background: black;
  inset: 8px;
  position: absolute;
}
</style>
