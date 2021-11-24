<template>
  <div class="smile-ocr">
    <div v-if="cache?.__missing.length">
      <img :src="next_missing.url" />
      <form @submit.prevent="submit">
        <div class="smile-ocr__inputs">
          <input v-for="(h, i) in next_missing.hashes" :key="i" v-model="answer[i]" />
        </div>
        <button class="btn -primary">submit</button>
        {{ status }}
      </form>
    </div>
    <div v-else>
      No unmatched characters!
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return { answer: 'e5e6=standard1'.split(''), index: 0, status: null, cache: null }
  },
  computed: {
    next_missing() {
      const [url, hashes] = this.cache.__missing[this.index]
      return { url, hashes }
    },
  },
  async mounted() {
    this.cache = (await this.$store.smile.fetch('smile-ocr/')).letter_cache
  },
  methods: {
    submit() {
      this.status = null
      let misses = 0
      let hits = 0
      this.next_missing.hashes.forEach((hash, i) => {
        if (this.cache[hash]) {
          if (this.cache[hash] === this.answer[i]) {
            hits++
          } else {
            misses++
          }
        } else {
          this.cache[hash] = this.answer[i]
        }
      })
      if (misses) {
        this.status = `ERROR: ${misses} characters do not match`
      } else {
        this.status = `${hits} characters matched!`
        this.index++
        this.answer = []
        this.$store.smile.post('smile-ocr/', this.cache)
      }
    },
  },
}
</script>
