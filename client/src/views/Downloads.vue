<template>
  <div class="app-body app-downloads -col">
    <div>
      <h1>Downloads for Metroid Dread</h1>
      <legal-stuff />
    </div>
    <div class="app-downloads__maps">
      <h2>Zone Maps</h2>
      <div class="app-downloads__flexy">
        <div v-for="zone in zones" :key="zone.id" class="app-downloads__card">
          <div class="app-downloads__card-content">
            <div class="app-downloads__img -half">
              <img :src="`/media/dread_zones/0.03125x/${zone.id}-${zone.slug}.png`" />
            </div>
            <div class="app-downloads__card-name">
              {{ zone.name }}
            </div>
            <div class="app-downloads__size-links">
              <a
                download
                class="link -underline"
                :href="`/media/dread_zones/${zone.id}-${zone.slug}.png`"
              >
                <i class="fa fa-image" />
                Full Size ({{ getZoneSize(zone) }})
              </a>
              <a
                v-for="size in map_sizes"
                :key="size"
                download
                class="link -underline"
                :href="`/media/dread_zones/${size}x/${zone.id}-${zone.slug}.png`"
              >
                <i class="fa fa-image" />
                1:{{ 1 / size }} scale
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="app-downloads__icons">
      <h2>Map Icons</h2>
      <p>
        I learned inkscape in order to make the icons in this map. It took me a long time and so I'd
        be thrilled if anyone else found them useful. All icons expcept for the stealth door,
        pressure plate, and thermo-trapdoor are the same width. If you have better color
        recommendations or need another size, etc, feel free to
        <router-link to="/contact/">contact me</router-link>.
      </p>
      <p>
        Also, I'm sorry if the groups/names are weird. They developed organically as I made this, so
        they may not make sense to an outside perspective.
      </p>
      <br />
      <h3>All Icons (zip file)</h3>
      <div class="app-downloads__flexy">
        <a download href="/media/dread_icons/dread-icons-svg.zip" class="app-downloads__card">
          <i class="fa fa-file-zip-o" /> dread-icons-svg.zip
          <br />
          svgs (256px wide)
        </a>
        <a
          v-for="size in icon_sizes"
          :key="size"
          download
          class="app-downloads__card"
          :href="`/media/dread_icons/${size}/dread-icons-${size}.zip`"
        >
          <i class="fa fa-file-zip-o" /> dread-icons-{{ size }}.zip
          <br />
          pngs ({{ size }}px wide)
        </a>
      </div>

      <template v-for="group in icon_groups" :key="group.name">
        <h3>{{ group.name }}</h3>
        <div class="app-downloads__flexy">
          <div v-for="icon in group.icons" :key="icon.type" class="app-downloads__card">
            <div class="app-downloads__card-content">
              <div class="app-downloads__img">
                <img :src="`/static/dread/icons/svg/${icon.type}.svg`" />
              </div>
              <div class="app-downloads__card-name">
                {{ icon.name }}
              </div>
              <div class="app-downloads__size-links">
                <a
                  download
                  class="link -underline"
                  :href="`/static/dread/icons/svg/${icon.type}.svg`"
                >
                  <i class="fa fa-image" />
                  Vector
                </a>
                <a
                  download
                  v-for="size in icon_sizes"
                  :key="size"
                  :href="`/media/dread_icons/${size}/${icon.type}.png`"
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
</template>

<script>
import { startCase } from 'lodash'
import DreadItems from '@/models/DreadItems'
import LegalStuff from './LegalStuff.vue'

const map_sizes = [0.5, 0.25, 0.125, 0.0625, 0.03125]
const icon_sizes = [256, 128, 64, 32, 16]

const WORLD = 3

export default {
  components: { LegalStuff },
  data() {
    window.__testDownloads = () => {
      const allowed_types = ['image/png', 'image/svg+xml', 'application/zip']
      Array.from(document.querySelectorAll('a[download]')).forEach((a) =>
        fetch(a.href, { method: 'head' }).then((r) => {
          if (!allowed_types.includes(r.headers.get('content-type'))) {
            console.warn('bad url', r.headers.get('content-type'), r.url)
          }
        }),
      )
    }
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
      return this.$store.zone.getPage({ query: { world_id: WORLD, limit: 5000 } })?.items || []
    },
  },
  methods: {
    getZoneSize(zone) {
      const { width, height } = zone.data.output.ratio_bounds
      const scale = zone.data.screenshot.width
      return `${Math.floor(width * scale)}x${Math.floor(height * scale)}`
    },
  },
}
</script>
