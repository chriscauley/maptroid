<template>
  <template v-if="$route.params.world_slug === 'metroid-dread'">
    <dread-zone v-if="$route.params.zone_slug" />
    <dread-world v-else />
  </template>
  <sm-view v-else />
</template>

<script>
import { startCase } from 'lodash'
import dread from './dread'
import SmView from './sm/index.vue'

const { DreadZone, DreadWorld } = dread

const overrides = {
  ypx: 'YPX',
  ypr: 'YPR',
  scm: 'SCM',
  'y-faster': 'Y-Faster',
}

export default {
  __route: {
    name: 'map_viewer',
    path: '/maps/:world_slug/:zone_slug?/',
    meta: {
      title: (a) => {
        const { world_slug, zone_slug } = a.params
        const world_name = overrides[world_slug] || startCase(world_slug)
        if (zone_slug) {
          return `${world_name}: ${startCase(zone_slug)}`
        }
        return world_name
      }
    },
  },
  components: { DreadZone, DreadWorld, SmView },
}
</script>
