<template>
  <div class="app-body app-faq">
    <div class="app-faq__inner">
      <h2>Frequently Asked Questions</h2>
      <ul class="faq-link__list">
        <li v-for="link in links" :key="link.href" class="link">
          <a class="faq-link" v-bind="link">{{ link.title }}</a>
        </li>
      </ul>
      <unrest-markdown :source="content" :options="options" :dedent="false" />
    </div>
  </div>
</template>

<script>
import { kebabCase } from 'lodash'

import content from 'raw-loader!./content.md'

export default {
  __route: {
    path: '/app/faq/',
  },
  data() {
    const options = { headerIds: true }
    return { content, options }
  },
  computed: {
    links() {
      // turns out the FAQ is short enough that I don't need this
      return []
      const filter = (l) => l.startsWith('### ')
      const map = (l) => {
        const [_, title] = l.match(/# (.*)/)
        return { title, href: '#' + kebabCase(title) }
      }
      return content
        .split('\n')
        .filter(filter)
        .map(map)
    },
  },
  mounted() {
    this.links.forEach((a) => {
      if (!this.$el.querySelector(a.href)) {
        console.warn('missing link', a.href)
      }
    })
  },
}
</script>
