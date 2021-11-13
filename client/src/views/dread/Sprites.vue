<template>
  <div class="dread-sprites">
    <section v-for="(items, type_name) in type_map" :key="type_name" class="dread-sprites__section">
      <div class="dread-sprites__section__title">{{ type_name }}</div>

      <div v-for="item in items" :key="item" class="dread-sprites__item">
        <div class="dread-sprites__title">
          <i :class="getClass(item)" />
          {{ item }}
          <div v-if="sizes[item]">
            {{ sizes[item] }}
            <i v-if="sizes[item][0] < 256" class="fa fa-error -red" />
          </div>
          <div
            v-for="(slugs, color) in colors_by_type[item]"
            :key="color"
            @click="examining = { item, color }"
            class="dread-sprites__swatch"
            :style="`background: ${color}`"
          >
            <i v-if="!isColorApproved(color)" class="fa fa-warning" />
          </div>
        </div>
        <div class="dread-sprites__images">
          <div>
            <img :src="`${static_}${item}.png`" title="png" @load="(e) => load(item, e)" />
          </div>
          <div @click="logSvg(item)">
            <img :src="`${static_}svg/${item}.svg`" :key="keys[item] || 0" />
          </div>
          <div>
            <img :src="`${static_}source/${item}.png`" title="source" class="source" />
          </div>
        </div>
      </div>
    </section>
    <unrest-modal v-if="examining" @close="examining = null">
      <div class="dread-sprites__swatches">
        <div
          v-for="color in approved_colors"
          :key="color"
          :class="['dread-sprites__swatch', selected_color === color && '-selected']"
          :style="`background: ${color}`"
          :title="color"
          @click="selected_color = color"
        />
      </div>
      <div>
        Selected Color: {{ selected_color || 'none' }}
        <input type="color" v-model="selected_color" />
        <input type="text" v-model="selected_color" />
      </div>
      <div class="dread-sprites__overlay-images">
        <div v-html="substituted_svg" class="_bg" /> <!-- eslint-disable-line -->
        <div v-html="svgs[examining.item]" class="_fg" /> <!-- eslint-disable-line -->
      </div>
      <template #actions>
        <div v-if="selected_color" class="btn -primary" @click="doSubstitution">
          Replace {{ examining.color }} with {{ selected_color }}?
        </div>
        <div v-else class="btn -warning" @click="toggleColor(examining.color)">
          {{ isColorApproved(examining.color) ? 'Reject' : 'Approve' }} color {{ examining.color }}?
        </div>
      </template>
    </unrest-modal>
  </div>
</template>

<script>
import { ReactiveLocalStorage, getClient } from '@unrest/vue-storage'

import DreadItems from '@/models/DreadItems'
import axios from 'axios'

const initial = { approved_colors: {} }
const storage = ReactiveLocalStorage({ LS_KEY: 'dread_sprites', initial })

export default {
  __route: {
    path: '/dread-sprites/',
  },
  data() {
    DreadItems.makeCss()
    const { type_map, getClass } = DreadItems
    return {
      type_map,
      getClass,
      sizes: {},
      svgs: {},
      keys: {},
      colors_by_type: {},
      examining: null,
      selected_color: null,
      static_: '/static/dread/icons/',
    }
  },
  computed: {
    substituted_svg() {
      const { item, color } = this.examining
      return this.svgs[item].replace(new RegExp(color, 'g'), this.selected_color || color)
    },
    approved_colors() {
      return Object.keys(storage.state.approved_colors)
    },
  },
  mounted() {
    Object.values(DreadItems.type_map).forEach((types) =>
      types.forEach((item) => {
        axios.get(`/static/dread/icons/svg/${item}.svg`).then((r) => this.setSvg(item, r.data))
      }),
    )
  },
  methods: {
    setSvg(type, text) {
      const patterns = [
        /stop-color:(#[a-fA-F0-9]+);/g,
        /fill:(#[a-fA-F0-9]+);/g,
        /stroke:(#[a-fA-F0-9]+);/g,
      ]
      this.colors_by_type[type] = {}
      this.svgs[type] = text
      patterns.forEach((pattern) => {
        text.match(pattern)?.forEach((slug) => {
          const color = slug.split(':')[1].split(';')[0]
          this.colors_by_type[type][color] = this.colors_by_type[type][color] || []
          this.colors_by_type[type][color].push(slug)
        })
      })
    },
    logSvg(type) {
      this.$ui.alert({
        text: this.svgs[type],
        tagName: 'pre',
      })
    },
    isColorApproved(color) {
      return storage.state.approved_colors[color]
    },
    load(type, event) {
      this.sizes[type] = event.target.width
    },
    toggleColor(color) {
      if (this.isColorApproved(color)) {
        delete storage.state.approved_colors[color]
      } else {
        storage.state.approved_colors[color] = true
      }
      storage.save(storage.state)
    },
    doSubstitution() {
      const { item } = this.examining
      const data = { type: item, text: this.substituted_svg }
      getClient()
        .post('replace-svg-color/', data)
        .then(() => {
          this.keys[item] = (this.keys[item] || 0) + 1
          this.examining = null
          this.setSvg(item, data.text)
        })
    },
  },
}
</script>
