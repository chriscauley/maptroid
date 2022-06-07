<template>
  <unrest-modal @close="$emit('close')">
    <div>
      <div class="admin-smile-sprite__preview">
        <div id="geo-box">
          <div class="admin-smile-sprite__img" :style="`background-image: url('${sprite.url}')`" />
        </div>
        <div class="btn -primary admin-smile-sprite__automatch" @click="automatch">
          Automatch
        </div>
      </div>
      <unrest-schema-form
        form_name="schema/matched-sprite"
        :prepSchema="prepSchema"
        :success="success"
      />
    </div>
  </unrest-modal>
</template>

<script>
import { getClient } from '@unrest/vue-storage'

export default {
  props: {
    sprite: Object,
  },
  emits: ['refetch', 'close', 'select-dindex'],
  methods: {
    prepSchema(schema) {
      schema.properties.plmsprite.default = this.sprite.id
      return schema
    },
    success(data) {
      this.$emit('refetch', data.id)
      this.$emit('close')
    },
    automatch() {
      const url = `sprite/automatch/${this.sprite.id}/`
      getClient().post(url).then((r) => {
        console.log(r)
      })
    },
  },
}
</script>
