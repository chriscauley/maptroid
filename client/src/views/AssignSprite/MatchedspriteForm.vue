<template>
  <unrest-modal @close="$emit('close')" :hide_actions="true">
    <unrest-schema-form :form_name="`schema/matched-sprite/${id}`" :success="success">
      <template #extra_actions>
        <a :href="adminUrl('matchedsprite', id)" class="fa fa-edit link" target="_blank"> </a>
      </template>
    </unrest-schema-form>
    <div v-if="details">
      <img :src="details.url" />
      <div v-for="plmsprite in details.plmsprites" :key="plmsprite.id" :style="mh(plmsprite)">
        <div class="plmsprite-box">
          <img :src="plmsprite.url" :width="plmsprite.data.width * scale" />
          <img v-bind="overlay(plmsprite)" />
          <div class="plmsprite-box__title">
            <a
              :href="adminUrl('plmsprite', plmsprite.id)"
              class="fa fa-edit link"
              target="_blank"
            />
            #{{ plmsprite.id }}
            <span v-if="plmsprite.extra_plmsprite_id">
              => #{{ plmsprite.extra_plmsprite_id }}
              <a
                :href="adminUrl('plmsprite', plmsprite.extra_plmsprite_id)"
                class="fa fa-edit link"
                target="_blank"
              />
            </span>
          </div>
        </div>
      </div>
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

export default {
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
    mh() {
      return `min-height: ${this.scale * this.details.data.height}px;`
    },
    overlay(plmsprite) {
      const [x, y] = plmsprite.data.matchedsprite_xy || [0,0]
      return {
        class: 'plmsprite-box__matched',
        style: {
          backgroundImage: `url(${this.details.url})`,
          height: `${this.details.data.height * this.scale}px`,
          left: `${x * this.scale}px`,
          top: `${y * this.scale}px`,
          width: `${this.details.data.width * this.scale}px`,
        },
      }
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
  },
}
</script>
