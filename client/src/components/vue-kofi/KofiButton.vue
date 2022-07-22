<template>
  <a class="btn -kofi" :href="kofiUrl" target="_blank" title="Support me on ko-fi.com">
    <img class="kofiimg" src="./cup.svg" />
    {{ text }}
  </a>
</template>

<script>
export default {
  name: 'VueKofi',
  props: {
    uid: { type: String, required: true },
    text: { type: String, default: 'Support Me on Ko-fi' },
  },
  computed: {
    kofiUrl: function() {
      return `https://ko-fi.com/${this.uid}`
    },
  },
}
</script>

<style lang="scss" scoped>
.btn.-kofi {
  @apply flex items-center gap-2;
  background: #46b798;
  &:hover {
    background: #225b4b;
  }
}
.kofiimg {
  display: initial;
  vertical-align: middle;
  height: 13px;
  width: 20px;
  padding-top: 0;
  padding-bottom: 0;
  border: none;
  content: url('./cup.svg');
  filter: drop-shadow(0 1px 1px rgba(34, 34, 34, 0.3));
  -webkit-filter: drop-shadow(0 1px 1px rgba(34, 34, 34, 0.3));
}
</style>
