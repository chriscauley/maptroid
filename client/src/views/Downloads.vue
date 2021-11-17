<template>
  <div class="app-body app-downloads">
    <div class="">
      <div class="app-downloads__icons">
        <h2>Map Icons</h2>
        <p>
          I learned inkscape in order to make the icons in this map. It took me a long time and so
          I'd be thrilled if anyone else found them useful. All icons expcept for the stealth door,
          pressure plate, and thermo-trapdoor are the same width. If you have better color
          recommendations or need another size, etc, feel free to contact me.
        </p>
        <p>
          Also, I'm sorry if the groups/names are weird. They developed organically as I made this,
          so they may not make sense to an outside perspective.
        </p>
        <br />
        <br />
        <h3>All Icons (zip file)</h3>
        <div class="app-downloads__flexy">
          <div class="app-downloads__card">
            <a href="`/media/dread/icons/dread-icons-svg.zip">
              <i class="fa fa-file-zip-o" /> dread-icons-svg.zip
              <br />
              svgs (256px wide)
            </a>
          </div>
          <div v-for="size in icon_sizes" :key="size" class="app-downloads__card">
            <a href="`/media/dread_icons/dread-icons-${size}.zip">
              <i class="fa fa-file-zip-o" /> dread-icons-{{ size }}.zip
              <br />
              pngs ({{ size }}px wide)
            </a>
          </div>
        </div>

        <template v-for="group in icon_groups" :key="group.name">
          <h3>{{ group.name }}</h3>
          <div class="app-downloads__flexy">
            <div v-for="icon in group.icons" :key="icon.type" class="app-downloads__card">
              <div class="app-downloads__card-content">
                <div class="app-downloads__img">
                  <img :src="`/media/dread_icons/128/${icon.type}.png`" />
                </div>
                <div class="app-downloads__card-name">
                  {{ icon.name }}
                </div>
                <div class="app-downloads__size-links">
                  <a class="link -underline" href="`/static/dread/icons/svg/${icon.type}.svg`">
                    <i class="fa fa-image" />
                    Vector
                  </a>
                  <a
                    v-for="size in icon_sizes"
                    :key="size"
                    href="`/media/dread_icons/${size}/${icon.type}.svg`"
                    class="link -underline"
                  >
                    <i class="fa fa-image" />
                    {{ size }}px
                  </a>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { startCase } from 'lodash'
import DreadItems from '@/models/DreadItems'
const map_sizes = [0.5, 0.25, 0.125, 0.0625]
const icon_sizes = [256, 128, 64, 32, 16]

const WORLD = 3

export default {
  data() {
    const icon_groups = Object.entries(DreadItems.type_map).map(([group_name, types]) => {
      return {
        name: startCase(group_name),
        icons: types.map((type) => ({
          type,
          name: DreadItems.getName(type),
        })),
      }
    })
    return { map_sizes, icon_sizes, icon_groups }
  },
  computed: {
    zones() {
      return this.$store.zone.getPage({ query: { world_id: WORLD, limit: 5000 } })
    },
  },
}
</script>
