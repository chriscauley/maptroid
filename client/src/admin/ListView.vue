<template>
  <div v-if="model">
    <table class="table">
      <thead>
        <tr>
          <th></th>
          <th v-for="column in columns" :key="column.name">
            {{ column.name }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>
            <router-link :to="`/admin/${model.key}/${item.id}/`" class="link">
              <i class="fa fa-edit" />
              {{ item.id }}
            </router-link>
          </td>
          <td v-for="(column, i) in columns" :key="i">
            {{ column.get(item, store) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import store from './store'

export default {
  __route: {
    path: '/admin/:app_label/:model_name/',
  },
  data() {
    return { store }
  },
  computed: {
    columns() {
      return this.model.admin_options.list_display
    },
    model() {
      return store.getModel(this.$route.params)
    },
    items() {
      return this.model?.getPage()?.items || []
    },
  },
}
</script>
