<template>
  <div class="app-body app-about">
    <div class="app-about__inner">
      <h1>About This App</h1>
      <div>
        <p>
          This app was made by <a href="http://github.com/chriscauley">Chris Cauley</a> and is built
          using <a href="https://vuejs.org/">Vue.js</a>,
          <a href="https://www.djangoproject.com/">Django</a>,
          <a href="https://openseadragon.github.io/">Open Seadragon</a>,
          <a href="https://inkscape.org/">Inkscape</a>, and an inappropriate number of screenshots
          from
          <a href="https://www.nintendo.com/games/detail/metroid-dread-switch/">Metroid Dread</a>.
        </p>
        <p>
          Source code is hosted on <a href="https://github.com/chriscauley/maptroid/">github</a>.
          Although this is technically open source, it probably needs a bit of cleanup before anyone
          else could work on it. Feel free to <router-link to="/about/">contact me</router-link>
          if you'd like to know more.
        </p>
        <p>
          <a href="https://thenounproject.com/icon/portal-4647674/" title="portal icon">
            Portal icon adapted from the noun project
          </a>
        </p>
        <legal-stuff />
      </div>
    </div>
  </div>
</template>

<script>
import LegalStuff from './LegalStuff.vue'

export default {
  components: { LegalStuff },
}
</script>
