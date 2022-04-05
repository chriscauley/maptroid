<template>
  <div>
    <h1>Gamepad test zone</h1>
    <div class="test-gamepad">
      <div class="test-gamepad__left">
        <h3>Buttons</h3>
        <div class="test-gamepad__buttons">
          <div
            v-for="button in buttons"
            :key="button.name"
            :class="['test-gamepad__button', button.value && '-pressed']"
          >
            <div class="test-gamepad__button-name">
              {{ button.name }}
            </div>
          </div>
        </div>
      </div>
      <div class="test-gamepad__left">
        <h3>Axes</h3>
        <div class="test-gamepad__buttons">
          <div
            v-for="axis in axes"
            :class="['test-gamepad__button', axes.value && '-pressed']"
            :key="axis.name"
          >
            {{ axis.name }}
            <div>{{ axis.value?.toFixed(3) }}</div>
          </div>
        </div>
        <div class="circularity-test" @click="clear">
          <div
            v-for="(bins, side) in qdelta"
            :key="side"
            :class="`circularity-test__circle -${side}`"
          >
            <div
              class="circularity-test__slice"
              v-for="(_values, degrees) in bins"
              :key="degrees"
              :style="_values[3]"
              :title="degrees"
            />
            <div class="circularity-test__slice -last" v-if="last[side]" :style="last[side][3]" />
          </div>
        </div>
        <!-- <table class="table"> -->
        <!--   <thead> -->
        <!--     <tr> -->
        <!--       <th>Diagonal</th> -->
        <!--       <th>Max</th> -->
        <!--     </tr> -->
        <!--   </thead> -->
        <!--   <tbody> -->
        <!--     <template v-for="bins, side in qdelta" :key="side"> -->
        <!--       <tr v-for="values, degrees in bins" :key="degrees"> -->
        <!--         <td>{{ side }} - {{ degrees }}</td> -->
        <!--         <td>{{ values[0].toFixed(2) }}</td> -->
        <!--         <td>{{ values[1].toFixed(2) }}</td> -->
        <!--         <td>{{ values[2].toFixed(2) }}</td> -->
        <!--       </tr> -->
        <!--     </template> -->
        <!--   </tbody> -->
        <!-- </table> -->
      </div>
      <div class="test-gamepad__right">
        <div v-html="svg" /><!-- eslint-disable-line -->
      </div>
    </div>
  </div>
</template>

<script>
import gamepad, { button_list, axis_list } from './gamepad'
import svg from 'raw-loader!./xbox-controller.html'
import './controller.css'

const SIDES = ['left', 'right']
const BIN_SIZE = 10
const DEGREES = Array(360/BIN_SIZE).fill(undefined).map((_, i) => i * BIN_SIZE)

export default {
  __route: {
    path: '/gamepad/test/'
  },
  data() {
    const qdelta = {}
    return {
      stick_offsets: {},
      svg,
      values: {},
      qdelta,
      last: {},
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
    SIDES.forEach((side) => {
      this.qdelta[side] = {}
      this.values[side + '-x'] = 0
      this.values[side + '-y'] = 0
      const el = this.$el.querySelector(`#${side}-stick`)
      this.stick_offsets[side] = {
        cx: el.cx.baseVal.value,
        cy: el.cy.baseVal.value,
        cr: el.r.baseVal.value,
      }
    })
    this.clear()
    const { buttonDown, buttonUp, setAxis, callback } = this
    gamepad({ buttonDown, buttonUp, setAxis, callback })
  },
  methods: {
    clear() {
      SIDES.forEach((side) => {
        DEGREES.forEach((i) => {
          this.qdelta[side][i] = [0, 0, 0, { display: 'none' }]
        })
      })
    },
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
    },
    callback() {
      SIDES.forEach((side) => {
        const x = this.values[side + '-x'] || 0
        const y = this.values[side + '-y'] || 0
        const el = this.$el.querySelector(`#${side}-stick`)
        const { cx, cy, cr } = this.stick_offsets[side]
        el.setAttribute('cx', cx + x * cr * 1.25)
        el.setAttribute('cy', cy + y * cr * 1.25)

        const theta = Math.atan2(y, x)
        const r = Math.sqrt(x * x + y * y)
        const degrees = (180 + theta * (180 / Math.PI)) % 360
        const r_bin = BIN_SIZE * Math.floor(degrees / BIN_SIZE)
        const old = this.qdelta[side][r_bin]
        const style = {
          width: `${r * 50}%`,
          transform: `rotate(${r_bin - 180}deg)`,
        }
        if (old[2] < r) {
          this.qdelta[side][r_bin] = [x, y, r, style]
        }
        if (x === 0 && y === 0) {
          el.style.fill = '#888888'
          this.last[side] = null
        } else {
          el.style.fill = '#00FF00'
          this.last[side] = [x, y, r, style]
        }
      })
    },
  },
}
</script>

<style></style>
