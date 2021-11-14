<template>
  <div class="form-control">
    {{ name }}
    <input v-model="name_override" @input="saveItem" placeholder="Name Override" />
    <input v-model="reward" @input="saveItem" placeholder="Reward" />
    <div class="flexy select-none">
      <span class="pill -primary" v-for="time in item.video_times" :key="time.seconds">
        {{ time.hms }}
        <i
          v-if="$auth.user?.is_superuser"
          class="fa fa-close cursor-pointer"
          @click="(e) => deleteTime(e, time)"
        />
      </span>
      <i class="fa fa-youtube-play" @click="addTime" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    item: Object,
    name: String,
  },
  data() {
    return {
      name_override: this.item.data.name,
      reward: this.item.data.reward,
    }
  },
  computed: {
    video() {
      return this.$store.video.getOne(this.$route.query.video)
    },
  },
  methods: {
    saveItem() {
      this.item.data.name = this.name_override // eslint-disable-line
      this.item.data.reward = this.reward // eslint-disable-line
      this.$store.item2.bounceSave(this.item)
    },
    addTime() {
      if (window.YT_PLAYER_TIME === undefined) {
        throw 'Unable to find current player time'
      }
      this.video.data.actions.push([this.item.id, window.YT_PLAYER_TIME])
      this.saveVideo()
    },
    deleteTime(event, time) {
      if (!event.shiftKey && !event.ctrlKey) {
        this.$ui.alert('Hold shift and control to delete event')
        return
      }
      const match = (a) => !(a[0] === this.item.id && a[1] === time.seconds)
      this.video.data.actions = this.video.data.actions.filter(match)
      this.saveVideo()
    },
    saveVideo() {
      this.$store.video
        .save(this.video)
        .then(() => this.$store.video.getOne(this.$route.query.video))
      // this.$store.video.markStale()
    },
  },
}
</script>
