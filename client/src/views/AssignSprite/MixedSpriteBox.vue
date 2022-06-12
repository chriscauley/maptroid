<template>
  <div class="plmsprite-box">
    <img :src="plmsprite.url" :width="plmsprite.data.width * scale" />
    <img v-bind="overlay(plmsprite)" />
    <div class="plmsprite-box__title">
      <a :href="adminUrl('plmsprite', plmsprite.id)" class="fa fa-edit link" target="_blank" />
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
</template>

<script>
export default {
  props: {
    plmsprite: Object,
    matchedsprite: Object,
  },
  emits: ['close', 'next'],
  data() {
    return { scale: 2 }
  },
  methods: {
    mh() {
      return `min-height: ${this.scale * this.matchedsprite.data.height}px;`
    },
    overlay(plmsprite) {
      const [x, y] = plmsprite.data.matchedsprite_xy || [0, 0]
      return {
        class: 'plmsprite-box__matched',
        style: {
          backgroundImage: `url(${this.matchedsprite.url})`,
          height: `${this.matchedsprite.data.height * this.scale}px`,
          left: `${x * this.scale}px`,
          top: `${y * this.scale}px`,
          width: `${this.matchedsprite.data.width * this.scale}px`,
        },
      }
    },
    adminUrl(model, id) {
      return `/djadmin/sprite/${model}/${id}/`
    },
  },
}
</script>
