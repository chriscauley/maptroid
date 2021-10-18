<template>
  <div v-if="schema">
    <input type="file" multiple ref="files" @change="changeFiles" />
    <unrest-form :schema="schema" :state="state" @submit="submit" />
    <div :title="warnings.join('\n')">Warnings: {{ warnings.length }}</div>
    <div v-if="screenshots">Existing Screenshots: {{ screenshots.length }}</div>
    <div>
      Pending: {{ pending_files.length }}
      <img v-for="(file, i) in pending_files" :key="i" :src="file.src" />
    </div>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  data() {
    return { schema: null, state: { zone: 5, world: 3 }, pending_files: [], warnings: [] }
  },
  computed: {
    screenshots() {
      const { zone, world } = this.state
      if (!(world && zone)) {
        return
      }
      // TODO my original library had limit, not per_page. Need to make pagination flexible OR put everything in query
      return this.$store.screenshot.getPage({ query: { per_page: 5000, zone, world } })?.items
    },
  },
  mounted() {
    axios.get('/api/schema/screenshot/?schema=1').then(({ data }) => {
      this.schema = data.schema
      delete this.schema.properties.data
      delete this.schema.properties.src
    })
  },
  methods: {
    changeFiles(e) {
      e.target.files.forEach((file) => {
        const existing = this.screenshots.find((s) => s.src.endsWith(file.name))
        if (existing) {
          this.warnings.push(`Skipping already uploaded screenshot: ${file.name} #${existing.id}`)
          return
        }
        const reader = new FileReader()

        reader.addEventListener(
          'load',
          () => {
            this.pending_files.push({ name: file.name, src: reader.result })
          },
          false,
        )

        reader.readAsDataURL(file)
      })
    },
    submit() {
      const { zone, world } = this.state
      this.pending_files.forEach(({ name, src }) => {
        const data = {
          src: { dataURL: src, name },
          zone,
          world,
        }
        this.$store.screenshot.save(data)
      })
    },
  },
}
</script>
