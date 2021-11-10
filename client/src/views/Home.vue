<template>
  <div>
    <h2>Dread</h2>
    <table class="table">
      <tr v-for="zone in dread_zones" :key="zone.id">
        <td>{{ zone.id }}</td>
        <td>
          <router-link class="link" :to="`/dread/${zone.slug}/`">
            {{ zone.name }}
          </router-link>
        </td>
        <td v-if="$auth.user?.is_superuser">
          <router-link class="link" :to="`/dread/${zone.slug}/?mode=room`">
            Edit Rooms
          </router-link>
        </td>
        <td v-if="$auth.user?.is_superuser">
          <router-link class="link" :to="`/dread/${zone.slug}/?mode=screenshots`">
            Edit Screenshots
          </router-link>
        </td>
      </tr>
    </table>

    <h2>Misc</h2>
    <div v-for="link in links" :key="link">
      <router-link :to="link">{{ link }}</router-link>
    </div>
  </div>
</template>

<script>
export default {
  __route: {
    path: '/',
  },
  computed: {
    dread_zones() {
      return this.$store.zone.getPage({ query: { per_page: 500, world: 3 } })?.items || []
    },
    links() {
      return ['/screenshotupload/', '/dread/sprites/']
    },
  },
}
</script>
