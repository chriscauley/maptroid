<template>
  <div class="ps2" v-if="storage.use()">
    <div class="ps2__img">
      <img src="/static/sm/power-suit2.png" @click="clickImage" />
      <div v-for="blockout in blockouts" :key="blockout.name" v-bind="blockout" @click.stop>
        {{ blockout.name }}
      </div>
    </div>
    <div class="ps2__form">
      <div>
        <div class="form-group">
          <select class="form-control" v-model="selected_animation" @change="changeAnimation">
            <option value="">New Animation</option>
            <option v-for="name in Object.keys(storage.use())" :key="name" :value="name">
              {{ name }}
            </option>
          </select>
        </div>
        <div v-for="key in ['x', 'y', 'width', 'height']" :key="key">
          {{ key }}: {{ state[key] }}
        </div>
        <unrest-form :state="state" :schema="schema" @input="save" @submit="newAnimation">
          <template #actions>
            <div v-if="!state.name || selected_animation === state.name" />
            <div v-else-if="selected_animation">
              <button class="btn -primary">Rename</button>
            </div>
          </template>
        </unrest-form>
      </div>
      <div>
        <canvas ref="canvas4x" />
      </div>
    </div>
  </div>
</template>

<script>
import Mousetrap from '@unrest/vue-mousetrap'
import Storage from './Storage'

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    frames: { type: 'number' },
    mirrored: { type: 'boolean' },
    mirror_offset: { type: 'number', initial: 0 },
  },
}

const getEmptyState = () => ({ x: 0, y: 0, width: 50, height: 50, frames: 1 })

export default {
  __route: {
    path: '/staff/power-suit/',
  },
  mixins: [Mousetrap.Mixin],
  data() {
    const state = getEmptyState()
    return { state, schema, current_frame: 0, selected_animation: '' }
  },

  computed: {
    mousetrap() {
      const arrows = (mod) => ['up', 'down', 'left', 'right'].map((k) => `${mod}${k}`).join(',')
      return {
        [arrows('')]: {
          repeat: (e) => this.pressArrow(e, 'x', 'y'),
        },
        [arrows('shift+')]: {
          repeat: (e) => this.pressArrow(e, 'width', 'height'),
        },
      }
    },
    storage() {
      return Storage()
    },
    animations() {
      return this.storage.use()
    },
    blockouts() {
      const out = []
      Object.values(this.storage.use()).forEach((animation) => {
        const { x, y, width, height, mirrored, frames, name, mirror_offset = 0 } = animation
        const blockout = {
          name,
          style: {
            width: `${width * frames}px`,
            height: `${height}px`,
            left: `${x}px`,
            top: `${y}px`,
          },
          class: '_blockout',
        }
        out.push(blockout)
        if (mirrored) {
          const m = {
            style: { ...blockout.style },
            name: name + ' mirrored',
            class: '_blockout',
          }
          m.style.left = `${x - width * frames - mirror_offset}px`
          out.push(m)
        }
      })
      return out
    },
  },

  mounted() {
    setInterval(this.draw, 1000 / 10)
  },
  methods: {
    clickImage(event) {
      const box = event.target.getBoundingClientRect()
      this.state.x = event.clientX - box.x
      this.state.y = event.clientY - box.y
    },
    pressArrow(e, x_target, y_target) {
      e.preventDefault()
      const key = e.key.replace('Arrow', '').toLowerCase()
      if (key === 'up') {
        this.state[y_target] -= 1
      } else if (key === 'down') {
        this.state[y_target] += 1
      } else if (key === 'right') {
        this.state[x_target] += 1
      } else if (key === 'left') {
        this.state[x_target] -= 1
      }
    },
    draw() {
      const { x, y, width, height, frames, mirrored, mirror_offset = 0 } = this.state
      if (!this.storage.state.img || !width || !height) {
        return
      }
      const canvas = this.$refs.canvas4x
      canvas.width = width * 4
      canvas.height = height * 4
      if (mirrored) {
        canvas.height *= 2
      }
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = false
      const frame = this.current_frame % frames
      ctx.drawImage(
        this.storage.state.img,
        x + frame * width,
        y,
        width,
        height, // source
        0,
        0,
        width * 4,
        height * 4, // destination
      )

      if (mirrored) {
        ctx.drawImage(
          this.storage.state.img,
          x - (frame + 1) * width - mirror_offset,
          y,
          width,
          height, // source
          0,
          height * 4,
          width * 4,
          height * 4, // destination
        )
      }

      this.current_frame++
    },
    save() {
      if (this.selected_animation !== this.state.name) {
        // Don't auto save if the name has changed
        return
      }
      this.storage.state[this.state.name] = this.state
      this.storage.save()
    },
    newAnimation() {
      if (this.selected_animation) {
        this.storage.renameAnimation(this.selected_animation, this.state.name)
        this.selected_animation = this.state.name
      } else {
        this.storage.addAnimation(this.state)
        this.selected_animation = this.state.name
      }
    },
    changeAnimation() {
      this.state = this.storage.use()[this.selected_animation] || { ...this.state, name: '' }
    },
  },
}
</script>
