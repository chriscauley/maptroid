<template>
  <div class="power-suit__sprite">
    <i class="fa fa-edit cursor-pointer" @click="editing = true" />
    <div class="power-suit__frames">
      <div v-for="(frame, i) in frames" :key="i" :class="frameClass(i)">
        <img :src="frame.src" />
      </div>
    </div>
    <img v-bind="getFrame(0)" />
    <unrest-modal v-if="editing" @close="editing = null">
      <div v-for="frame in frames" :key="frame.sprite_id" class="power-suit__frame -editing">
        <img :src="frame.src" :width="frame.width * 4" />
        <unrest-draggable
          @drag="(e) => dragbox(e, frame)"
          @dragend="dragend"
          class="power-suit__frame-hitbox"
          :style="getHitboxStyle(frame)"
        />
      </div>
    </unrest-modal>
  </div>
</template>

<script>
import store from './store'

export default {
  props: {
    sprite: Object,
    img: Object,
  },
  data() {
    return {
      frame_no: 0,
      interval: 250,
      timeout: null,
      editing: false,
      drag: null,
    }
  },
  computed: {
    frames() {
      return store.getAnimation(this.sprite.name).frames
    },
  },
  mounted() {
    this.tick()
  },
  unmounted() {
    clearTimeout(this.timeout)
  },
  methods: {
    tick() {
      clearTimeout(this.timeout)
      this.frame_no++
      this.timeout = setTimeout(this.tick, this.interval)
    },
    frameClass(i) {
      return ['power-suit__frame', this.frame_no % this.frames.length === i && '-active']
    },
    getFrame(di) {
      const i = (this.frame_no + di) % (this.frames.length || 1)
      const frame = this.frames[i]
      return {
        src: frame.src,
        width: frame.width * 4,
        style: {
          marginLeft: `${100 - frame.offset[0] * 4}px`,
          marginTop: `${frame.offset[1] * 4}px`,
        },
      }
    },
    getHitboxStyle(frame) {
      let [dx, dy] = frame.offset
      if (this.drag?.sprite_id == frame.sprite_id) {
        dx += this.drag.dx
        dy += this.drag.dy
      }
      return {
        left: `${dx * 4}px`,
        top: `${dy * 4}px`,
      }
    },
    dragbox(e, frame) {
      const [x0, y0] = e._drag.xy_start
      const [x1, y1] = e._drag.xy
      const dx = parseInt((x1 - x0) / 4)
      const dy = parseInt((y1 - y0) / 4)
      this.drag = { dx, dy, sprite_id: frame.sprite_id }
    },
    dragend() {
      const { dx, dy, sprite_id } = this.drag
      const { offsets } = this.sprite
      const [dx0, dy0] = offsets[sprite_id] || [0, 0]
      offsets[sprite_id] = [dx0 + dx, dy0 + dy]
      this.drag = null
      store.save()
    },
  },
}
</script>
