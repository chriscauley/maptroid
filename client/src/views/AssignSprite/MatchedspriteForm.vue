<template>
  <unrest-modal @close="$emit('close')" :hide_actions="true">
    <unrest-schema-form :form_name="`schema/matched-sprite/${id}`" :success="success">
      <template #extra_actions>
        <div class="btn -danger" @click="deleteMatchedsprite">Delete</div>
        <a :href="adminUrl('matchedsprite', id)" class="fa fa-edit link" target="_blank"> </a>
      </template>
    </unrest-schema-form>
    <div v-if="details">
      <img :src="details.url" />
      <mixed-sprite-box
        v-for="plmsprite in details.plmsprites"
        :key="plmsprite.id"
        :matchedsprite="details"
        :plmsprite="plmsprite"
      />
      <div class="plmsprite-box__details">
        {{ details.data.approval_count || '??' }} / {{ details.plmsprites.length }}
        <div class="btn -primary" @click="markApproved">Mark Approved</div>
        <i class="fas fa-chevron-left cursor-pointer" @click="$emit('next', -1)" />
        <i class="fas fa-chevron-right cursor-pointer" @click="$emit('next', 1)" />
      </div>
    </div>
  </unrest-modal>
</template>

<script>
import { getClient } from '@unrest/vue-storage'

import MixedSpriteBox from './MixedSpriteBox.vue'

export default {
  components: { MixedSpriteBox },
  props: {
    id: Number,
  },
  emits: ['close', 'next'],
  data() {
    this.resetDetails()
    return { details: null, scale: 2 }
  },
  methods: {
    resetDetails() {
      getClient()
        .get(`sprite/matchedsprite/${this.id}/`)
        .then((d) => (this.details = d))
    },
    success() {
      this.$emit('close')
    },
    adminUrl(model, id) {
      return `/djadmin/sprite/${model}/${id}/`
    },
    markApproved() {
      const url = `sprite/approve-matchedsprite/${this.id}/`
      getClient()
        .post(url)
        .then(this.resetDetails)
    },
    deleteMatchedsprite(e) {
      if (!(e.shiftKey && e.ctrlKey)) {
        this.$ui.toast.error('Press shift and control to force delete.')
        return
      }
      const url = `schema/matched-sprite/${this.id}/`
      getClient()
        .delete(url)
        .then(() => this.$emit('close'))
    },
  },
}
</script>
