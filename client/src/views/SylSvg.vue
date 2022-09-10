<template>
  <div class="view-syl">
    <div class="btn-group">
      <router-link
        :class="['btn', !$route.params.color ? '-primary' : '-secondary']"
        to="/app/syl/"
      >
        Instructions
      </router-link>
      <router-link v-for="color in colors" :key="color" v-bind="color">
        {{ color.title }}
      </router-link>
    </div>
    <div v-if="$route.params.color">
      <div>any% Route: {{ any_percent }}</div>
      <div>100% Route: {{ hundred_percent }}</div>
      <div v-is="tagName" />
    </div>
    <div v-else>
      <p>
        These are instructions for the Syl region in Y-faster 2: Furious. I decided to speed run
        this hack so I mapped it out.
      </p>
      <p>
        After activating the mapping device in the top right corner of the main room (refered to as
        "start" in the graphs), you can enter the four center doors. Each of these door takes you to
        a region with different colored snow (purple, green, blue or white). The 4 mazes are only
        connected through the start hub. If you notice the snow change back to gray, that means
        you've exited to the start hub again.
      </p>
      <p>
        Doors on the center of the hub are labeled with [c] and the direction can be confusing at
        first. For example, to get to the white region you start by entering the door on top of the
        center, refered to as <code>start_cd</code> becuse it's in the [start] room, [c]enter chunk,
        and you enter it by going [d]own. The door is on the top of the center, but it is labeled as
        a [cd]own door because the direction samus moves while entereing the door.
      </p>
      <p>
        If you click on any of the four colors above, there are instructions on how to get the item
        as quickly as possibly (Any%) or the fastest route to get the item and all the missiles
        (100%). If the direction starts with "c" (like c-left, c-right, c-down, or c-up) that means
        you should go to the opposite side and enter the center from that direction.
      </p>
      <p>
        Below is the schematic map for the central hub. For simplicity, each of the mazes have
        separate pages. These maps highlight the fastest route to get to the item as well as showing
        the path to get the optional missiles (red).
      </p>
      <start-svg />
    </div>
  </div>
</template>

<script>
import StartSvg from '@/svg/start.svg?inline'
import PurpleSvg from '@/svg/purple.svg?inline'
import GreenSvg from '@/svg/green.svg?inline'
import WhiteSvg from '@/svg/white.svg?inline'
import BlueSvg from '@/svg/blue.svg?inline'

const _any = {
  purple: 'c-up > down > down > down > left > left > Wave Beam (+missile)',
  green: 'c-right > right > (+missile) > right > left > right > up > Spazer',
  blue: 'c-left > left > down (counter clockwise) > Ice Beam',
  white: 'c-down > left > right > down > right > X-ray',
}

const _hundred = {
  purple:
    'c-up > down > down > right > (+missile) > down > down > down > left > left > missile (top left) > left (purple exit)',
  blue:
    'c-left > down > missile (top-right) > c-up > c-left > left > c-right > (+missile) > left > right > left > down (blue exit)',
  green:
    'c-right > right > +missile (bottom right) > right > left > c-down > (+missile) > down > right > left > c-right > up (green exit)',
  white:
    'c-down > up > missile (bottom left) > c-left > left > right > down > c-left > (+missile) > right > left > right > down > right (white exit)',
}

export default {
  components: { StartSvg, PurpleSvg, GreenSvg, WhiteSvg, BlueSvg },
  __route: {
    path: '/app/syl/:color?',
  },
  computed: {
    tagName() {
      return this.$route.params.color + '-svg'
    },
    any_percent() {
      return _any[this.$route.params.color]
    },
    hundred_percent() {
      return _hundred[this.$route.params.color]
    },
    colors() {
      const weapons = {
        purple: 'Purple (Wave Beam)',
        green: 'Green (Spazer)',
        blue: 'Blue (Ice Beam)',
        white: 'White (X-ray)',
      }
      return Object.entries(weapons).map(([color, title]) => ({
        color,
        title,
        to: `/app/syl/${color}/`,
        class: ['btn', this.$route.params.color === color ? '-primary' : '-secondary'],
      }))
    },
  },
}
</script>
