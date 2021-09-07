<template>
  <div>
    <h2>
      <router-link :to="`/admin/${app.app_label}/`">{{ app.verbose }}</router-link>
    </h2>
    <ul>
      <li v-for="model in app.models" :key="model.key">
        <router-link :to="`/admin/${app.app_label}/${model.model_name}/`">
          {{ model.verbose }} ({{ model.getCount() }})
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: { app: Object },
}
</script>
