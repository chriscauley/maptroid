<template>
  <div class="ur-files">
    <input v-model="path" />
    <div class="ur-files__file-list">
      <div v-for="file in files" :key="file.name" class="ur-files__file">
        <div class="_preview-wrapper">
          <div class="_preview" v-if="file.is_image" :style="file.style" />
        </div>
        {{ file.name }}
      </div>
    </div>
  </div>
</template>

<script>
import { ReactiveRestApi } from '@unrest/vue-storage'

const storage = ReactiveRestApi()

export default {
  __route: {
    path: '/file-browser/'
  },
  data() {
    return { path: 'plm_enemies' }
  },
  computed: {
    files() {
      return storage.get('list-dir/?path='+this.path)?.files.map(name => {
        const extension = name.match(/\.([\w\d]+)$/)?.[1]
        const path = `/media/${this.path}/${name}`
        const is_image = ['jpg', 'jpeg', 'png'].includes(extension)
        const style = `background-image: url("${path}")`
        return { name, extension, path, is_image, style }
      })
    }
  }
}
</script>
