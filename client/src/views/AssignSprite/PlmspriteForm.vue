<template>
  <unrest-modal @close="$emit('close')" :hide_actions="true">
    <div>
      <div class="admin-smile-sprite__preview">
        <div id="geo-box">
          <div class="admin-smile-sprite__img" :style="`background-image: url('${sprite.url}')`" />
        </div>
      </div>
      <unrest-schema-form
        form_name="schema/matched-sprite"
        :prepSchema="prepSchema"
        :success="() => $emit('close')"
      >
        <template #extra_actions>
          <div class="btn -danger" @click="resetToRoot">
            Reset To Root
          </div>
        </template>
      </unrest-schema-form>
      <a
        :href="`/djadmin/sprite/plmsprite/${sprite.id}/`"
        class="btn-link fa fa-edit"
        target="_blank"
      >
      </a>
    </div>
    <mixed-sprite-box
      v-for="{ plmsprite, matchedsprite } in results"
      :matchedsprite="matchedsprite"
      :plmsprite="plmsprite"
      :key="plmsprite.id"
    />
  </unrest-modal>
</template>

<script>
import { getClient } from '@unrest/vue-storage'

import MixedSpriteBox from './MixedSpriteBox'

export default {
  components: { MixedSpriteBox },
  props: {
    sprite: Object,
    category: String,
  },
  emits: ['close'],
  data() {
    this.refetchRoot()
    return { results: null }
  },
  methods: {
    prepSchema(schema) {
      schema.properties.plmsprite.default = this.sprite.id
      schema.properties.category.default = this.category
      return schema
    },
    refetchRoot() {
      const url = `sprite/root-plm/${this.sprite.id}/`
      getClient()
        .get(url)
        .then(({ results }) => (this.results = results))
    },
    resetToRoot(e) {
      if (!(e.ctrlKey && e.shiftKey)) {
        this.$ui.toast.error('Must press ctrl and shift')
        return
      }
      const url = `sprite/reset-to-root/${this.sprite.id}/`
      getClient()
        .post(url)
        .then((data) => {
          this.$ui.toast(data.message)
          this.$emit('close')
        })
    },
  },
}
</script>
