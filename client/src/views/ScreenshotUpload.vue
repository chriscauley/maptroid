<template>
  <div v-if="schema" class="app-screenshotupload">
    <input type="file" multiple ref="files" @change="changeFiles" />
    <unrest-form :schema="schema" :state="state" @submit="submit" />
    <div :title="warnings.join('\n')">Warnings: {{ warnings.length }}</div>
    <div v-if="screenshots">Existing Screenshots: {{ screenshots.length }}</div>
    <div>
      Pending: {{ pending_files.length }}
      <img v-for="(file, i) in pending_files" :key="i" :src="file.original" />
    </div>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  data() {
    return { schema: null, state: { zone: 8, world: 3 }, pending_files: [], warnings: [] }
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
      delete this.schema.properties.original
      delete this.schema.properties.output
    })
  },
  methods: {
    changeFiles(e) {
      e.target.files.forEach((file) => {
        const name = file.name.replace('-9A9B6E0371D34263D6B6577F9CBA54D5', '')

        const existing = this.screenshots.find((s) => s.original.endsWith(name))
        if (existing) {
          this.warnings.push(`Skipping already uploaded screenshot: ${name} #${existing.id}`)
          return
        }
        const reader = new FileReader()

        reader.addEventListener(
          'load',
          () => {
            this.pending_files.push({ name, dataURL: reader.result })
          },
          false,
        )

        reader.readAsDataURL(file)
      })
    },
    submit() {
      const { zone, world } = this.state
      this.pending_files.forEach(({ name, dataURL }) => {
        // switch adds this console id string which is annoyingly long
        const data = {
          original: { dataURL, name },
          zone,
          world,
        }
        this.$store.screenshot.save(data)
      })
    },
  },
}
</script>
