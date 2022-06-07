<template>
  <div v-if="current_book" class="labbook">
    <h1>
      {{ current_book.name }}
      <div class="btn -primary" v-if="current_book.url" @click="rerun">
        Re-run
      </div>
    </h1>
    <div v-for="(section, i) in current_book.sections" class="labbook-section" :key="i">
      <hr v-if="i" />
      <img v-if="section.src" :src="section.src" :width="section.width * 6" />
      <div class="labbook-section__row">
        <span v-if="section.color" class="labbook-section__swatch" :style="color(section.color)" />
        {{ section.caption }}
      </div>
      <router-link
        v-if="section.child_labbook"
        class="btn -text"
        :to="`/app/labbook/${section.child_labbook}/`"
      >
        {{ section.child_labbook }}
      </router-link>
    </div>
  </div>
  <div v-else>
    <router-link v-for="slug in book_slugs" :key="slug" :to="`/app/labbook/${slug}/`">
      {{ slug }}
    </router-link>
  </div>
</template>

<script>
import { ReactiveRestApi, getClient } from '@unrest/vue-storage'

const client = getClient({ baseURL: '/' })
const storage = ReactiveRestApi({ client })

export default {
  __route: {
    path: '/app/labbook/:book_slug?',
  },
  computed: {
    books() {
      return storage.get('/media/labbooks/index.json')
    },
    book_slugs() {
      return Object.keys(this.books || {})
    },
    current_book() {
      const { book_slug } = this.$route.params
      return book_slug && this.books && storage.get(this.books[book_slug])
    },
  },
  methods: {
    color(bgr) {
      const [b, g, r] = bgr
      return `background-color: rgb(${r}, ${g}, ${b})`
    },
    rerun() {
      const { book_slug } = this.$route.params
      const url = this.books[book_slug]
      client.post(this.current_book.url).then(() => {
        storage.markStale(url)
        storage.get(url)
      })
    },
  },
}
</script>
