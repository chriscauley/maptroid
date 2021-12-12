const Query = (q = {}) => ({ query: { per_page: 5000, ...q } })

export default ({ store }) => {
  const route = {
    // getters here are arranged by dependency order. This is effectively a saga.
    get params() {
      return store._app.config.globalProperties.$route.params
    },
    get world_query() {
      return Query({ world__slug: route.params.world_slug })
    },
    get worlds() {
      return store.world2.getPage(Query())?.items || []
    },
    get world() {
      return this.worlds.find((w) => w.slug === route.params.world_slug)
    },

    get zones() {
      return route.all_zones.filter((z) => !z.data.hidden)
    },
    get all_zones() {
      return (route.world && store.zone.getPage(route.world_query)?.items) || []
    },

    get zone() {
      const { zone_slug } = route.params
      return zone_slug && route.zones.find((w) => w.slug === zone_slug)
    },

    get world_rooms() {
      const page = route.world && store.room2.getPage(route.world_query)
      return (page?.items || []).filter((r) => !r.data.hidden)
    },
    get zone_rooms() {
      const zone_id = route.zone?.id
      return route.world_rooms.filter((r) => r.zone === zone_id)
    },

    get world_items() {
      const world_id = route.world?.id
      const page = world_id && store.item2.getPage(Query({ zone__world_id: world_id }))
      return page?.items || []
    },
    get zone_items() {
      const zone_id = route.zone?.id
      return route.world_items.filter((r) => r.zone === zone_id)
    },

    get world_videos() {
      const page = route.world && store.video.getPage(route.world_query)
      return page?.items || []
    },

    refetchWorlds() {
      store.zone.api.markStale()
      return store.world2.fetchPage(Query())?.items || []
    },

    refetchZones() {
      store.zone.api.markStale()
      return store.zone.fetchPage(route.world_query)
    },

    refetchRooms() {
      store.room2.api.markStale()
      return store.room2.fetchPage(route.world_query)
    },

    refetchItems() {
      const world_id = route.world?.id
      store.item2.api.markStale()
      return store.item2.fetchPage(Query({ zone__world_id: world_id }))
    },

    refetchVideos() {
      store.video.api.markStale()
      return store.video.fetchPage(route.world_query)
    },

    getZoneLink(world_slug, zone_slug) {
      const is_dread = world_slug === 'dread'
      return `/${is_dread ? 'maps' : 'sm'}/${world_slug}/${zone_slug}/`
    },

    getWorldLink(world_slug) {
      const is_dread = world_slug === 'dread'
      return `/${is_dread ? 'maps' : 'sm'}/${world_slug}/`
    },

    get times_by_item_id() {
      const video = store.video.getCurrentVideo()
      const times_by_item_id = {}
      if (video) {
        video.data.items.forEach(([item_id, _time]) => (times_by_item_id[item_id] = []))
        video.data.items.forEach(([item_id, time]) => times_by_item_id[item_id].push(time))
      }
      return times_by_item_id
    },
  }

  return route
}
