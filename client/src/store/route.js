import { computed, watch } from 'vue'

import { hms } from '@/lib/time'

const Query = (q = {}) => ({ query: { per_page: 5000, ...q } })

export default ({ store }) => {
  // TODO this elaborat system of compute/etc is happening because triggering route changes (via selectItem) causes a lag spike and fps drop
  // Need to find a way to make none of these change when selected item is modified, probably through an intermediate route state
  const _computed = {
    worlds: computed(() => {
      return store.world.getPage(Query())?.items || []
    }),
    world: computed(() => {
      return route.worlds.find((w) => w.slug === route.params.world_slug)
    }),
    zones: computed(() => route.all_zones.filter((z) => !z.data.hidden)),
    all_zones: computed(() => store.zone.getPage(route.world_query)?.items || []),
    zone: computed(() => {
      const { zone_slug } = route.params
      return zone_slug && route.zones.find((w) => w.slug === zone_slug)
    }),
    zone_rooms: computed(() => {
      const zone_id = route.zone?.id
      return route.world_rooms.filter((r) => r.zone === zone_id)
    }),

    world_items: computed(() => {
      const world_id = route.world?.id
      const query = Query({ zone__world_id: world_id })
      const page = world_id && store.item.getPage(query)
      const items = page?.items || []

      // Hide all items in hidden rooms
      const visible_rooms = {}
      route.world_rooms.forEach((r) => (visible_rooms[r.id] = true))
      return items.filter((i) => visible_rooms[i.room] && !i.data.hidden)
    }),

    world_rooms: computed(() => {
      const page = store.room.getPage(route.world_query)

      const visible_zones = {}
      route.zones.forEach((z) => visible_zones[z.id] = true)
      return (page?.items || []).filter((r) => !r.data.hidden && visible_zones[r.zone])
    }),

    zone_items: computed(() => {
      const zone_id = route.zone?.id
      return route.world_items.filter((r) => r.zone === zone_id)
    }),
    world_videos: computed(() => {
      const page = route.world && store.video.getPage(route.world_query)
      return page?.items || []
    }),
    world_runs: computed(() => {
      const page = route.world && store.run.getPage(route.world_query)
      return page?.items || []
    }),
  }

  const route = {
    // getters here are arranged by dependency order. This is effectively a saga.
    get params() {
      return store._app.config.globalProperties.$route.params
    },
    get world_query() {
      return Query({ world__slug: route.params.world_slug })
    },
    get worlds() {
      return _computed.worlds.value
    },
    get world() {
      return _computed.world.value
    },

    get zones() {
      return _computed.zones.value
    },

    get all_zones() {
      return _computed.all_zones.value
    },

    get zone() {
      return _computed.zone.value
    },

    get world_rooms() {
      return _computed.world_rooms.value
    },

    get zone_rooms() {
      return _computed.zone_rooms.value
    },

    get world_items() {
      return _computed.world_items.value
    },
    get zone_items() {
      return _computed.zone_items.value
    },

    get world_videos() {
      return _computed.world_videos.value
    },

    get world_runs() {
      return _computed.world_runs.value
    },

    get ready() {
      const { world, zones, world_rooms } = route
      return world && zones.length && world_rooms.length
    },

    fetchReady() {
      return new Promise((resolve) =>
        watch(
          () => route.ready,
          (value) => value && resolve(),
        ),
      )
    },

    get items_ready() {
      const { world, zones, world_rooms, world_items } = route
      return world && zones.length && world_rooms.length && world_items.length
    },

    fetchItemsReady() {
      // this and get items_read() are used only in game
      return new Promise((resolve) =>
        watch(
          () => route.items_ready,
          (value) => value && resolve(),
        ),
      )
    },

    refetchWorlds() {
      store.world.api.markStale()
      return store.world.fetchPage(Query())?.items || []
    },

    refetchZones() {
      store.zone.api.markStale()
      return store.zone.fetchPage(route.world_query)
    },

    refetchRooms() {
      store.room.api.markStale()
      return store.room.fetchPage(route.world_query)
    },

    refetchItems() {
      const world_id = route.world?.id
      store.item.api.markStale()
      return store.item.fetchPage(Query({ zone__world_id: world_id }))
    },

    refetchVideos() {
      store.video.api.markStale()
      return store.video.fetchPage(route.world_query)
    },

    get times_by_item_id() {
      const video = store.video.getCurrentVideo()
      const out = {}
      if (video) {
        video.data.actions.forEach(([item_id, seconds]) => {
          out[item_id] = out[item_id] || []
          out[item_id].push({
            seconds,
            hms: hms(seconds),
          })
        })
      }
      return out
    },

    selectItem(item) {
      const { $route, $router } = store._app.config.globalProperties
      if (!item) {
        const query = { ...$route.query }
        delete query.item
        $router.replace({ path: $route.path, query })
      } else {
        $router.replace({ path: $route.path, query: { item: item.id } })
      }
    },

    blurItem() {
      route.selectItem(null)
    },

    isDread() {
      const { $route } = store._app.config.globalProperties
      return $route.params.world_slug === 'metroid-dread'
    },
  }

  return route
}
