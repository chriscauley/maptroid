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
    <div v-if="$route.params.color" style="margin-bottom: 1rem; margin-top: 1rem;">
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
        You start in a large gray room (refered to as "start" in the graphs) with four gray doors in the center.
        After activating the mapping device in the top right corner, you can enter the four doors. Each takes you to
        a region with different colored snow (purple, green, blue or white). The 4 mazes are only
        connected through the start hub. If you notice the snow change back to gray, that means
        you've exited to the start hub again.
      </p>
      <p>
        It's a bit confusing describing where to go since the top door on the center hub is entered by going down. I call the top door a "down door" because it's facing the same direction as all other doors you enter by going down. I label doors on the center with "c". For example, to get to the white region you start by entering the door on top of the center, refered to as <code>start_cd</code> becuse it's in the [start] room, [c]enter chunk, and you enter it by going [d]own. The door is on the top of the center, but it is labeled as a "cd" or "c-down" door because the direction samus moves while entereing the door.
      </p>
      <p>
        If you click on any of the four buttons above, I list the shortest path through the maze (Any%) and the shortest route that includes all the missiles
        (100%). If the direction starts with "c" (like c-left, c-right, c-down, or c-up) that means
        you should go to the opposite side and enter the center from that direction.
      </p>
      <p>
        The graphs may be a bit confusing (which is why I wrote out the instructions). If doors are grouped in a rectangle that means you can access them. I didn't add arrows to show connections inside of these because it would get messy. I also didn't add arrows or connections between start doors because it warped the graph too much. On missile runs, if a red arrow dumps you back into start it is implied that you need to go back to the first door to enter the maze area.
      </p>
      <p>
        Below is the schematic map for the central hub. Odds are you don't need to look at the graph at all, they are just there in case anyone wants to check my work. For simplicity, each of the mazes have
        separate pages. These maps highlight the fastest route to get to the item as well as showing
        the path to get the optional missiles (red). 100% routes use a mixture of red and colored paths.
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
  purple: 'c-up > down > down > down > left > (missile) > left (purple exit)',
  green: 'c-right > right > (missile) > right > left > right > up (green exit)',
  blue: 'c-left > left > right > down (blue exit, all the way around)',
  white: 'c-down > left > right > down > right (White exit)',
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
