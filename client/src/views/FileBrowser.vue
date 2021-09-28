<template>
  <div :class="css.wrapper">
    <input v-model="path" />
    <div class="ur-files__content">
      <div :class="css.list">
        <div v-for="file in files" :key="file.name" class="ur-files__file-wrapper">
          <div class="ur-files__file" @click="selected = file">
            <div class="_preview-wrapper">
              <div class="_preview" v-if="file.is_image" :style="file.style" />
            </div>
            {{ file.name }}
            <div class="_actions">
              <div class="btn -primary" @click.stop="(e) => delete_(e, file)">
                <i class="fa fa-trash" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="selected" class="ur-files__selected">
        <div class="_image">
          <img :src="selected.path" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Mousetrap from '@unrest/vue-mousetrap'
import { ReactiveRestApi } from '@unrest/vue-storage'

const storage = ReactiveRestApi()

export default {
  __route: {
    path: '/file-browser/',
  },
  mixins: [Mousetrap.Mixin],
  data() {
    return { path: 'plm_enemies', selected: null }
  },
  computed: {
    mousetrap() {
      return {
        esc: () => (this.selected = null),
      }
    },
    files() {
      return this.refetch()
        ?.files.sort()
        .map((name) => {
          const extension = name.match(/\.([\w\d]+)$/)?.[1]
          const path = `/media/${this.path}/${name}`
          const is_image = ['jpg', 'jpeg', 'png'].includes(extension)
          const style = `background-image: url("${path}")`
          return { name, extension, path, is_image, style }
        })
    },
    css() {
      return {
        list: 'ur-files__file-list',
        wrapper: ['ur-files', { '-has-selected': this.selected }],
      }
    },
  },
  methods: {
    refetch() {
      return storage.get('list-dir/?path=' + this.path)
    },
    delete_(e, file) {
      if (!e.ctrlKey) {
        this.$ui.alert('You must hold control to force a delete')
      } else {
        storage.delete('delete-file/', { path: file.path }).then(this.refetch)
      }
    },
  },
}
</script>
