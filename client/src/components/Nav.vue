<template>
  <header :class="css.nav.outer()">
    <section :class="css.nav.section('left')">
      <router-link to="/" :class="css.nav.brand()">Metroid</router-link>
    </section>
    <section class="unrest-grid">
      <unrest-dropdown class="btn -light" :items="items">
        <i class="fa fa-bars" />
      </unrest-dropdown>
    </section>
  </header>
</template>

<script>
import css from '@unrest/css'
export default {
  data() {
    const items = [
      { to: '/', text: 'Interactive Map' },
      { class: 'divider' },
      { to: '/editor/', text: 'Editor' },
      { to: '/spritegallery/', text: 'Item Gallery' },
    ]
    return { css, items }
  },
}
</script>
