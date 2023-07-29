<template>
  <unrest-dropdown
    v-if="$store.route.world.mc_id"
    :items="mc_items"
    class="btn -primary -mc"
    placement="bottom-end"
  >
    <img src="/static/metroidconstruction.png" />
  </unrest-dropdown>
</template>

<script>
export default {
  computed: {
    mc_items() {
      const { mc_data } = this.$store.route.world.data
      const text = [
        'Author: ' + mc_data['author'],
        'Genre: ' + mc_data['genre'],
        'Average Runtime: ' + mc_data['runtime'],
      ]
      const href = 'https://metroidconstruction.com/hack.php?id=' + this.$store.route.world.mc_id
      const items = [
        () => (
          <a href={href} target="_blank">
            View on Metroid Construction
          </a>
        ),
        { text: text.join('\n'), class: '-text' },
      ]
      const { randomizer } = mc_data
      if (randomizer) {
        items.push({
          icon: 'github',
          text: 'Randomizer by ironrusty',
          href: randomizer,
        })
      }
      return items
    },
  },
}
</script>
