<template>
  <unrest-popper placement="bottom" offset="0,10" :watchme="watchme">
    <div class="item-popper" @click.stop>
      <div v-if="can_edit">
        {{ item.name }}
        <input v-model="name_override" @input="saveItem" placeholder="Name Override" />
        <input v-model="reward" @input="saveItem" placeholder="Reward" />
        <div class="flexy select-none">
          <span class="pill -primary" v-for="time in video_times" :key="time.seconds">
            {{ time.hms }}
            <i class="fa fa-close" @click="(e) => deleteTime(e, time)" />
          </span>
          <i class="fa fa-youtube-play" @click="addTime" />
        </div>
      </div>
      <div v-else>
        <div class="item-popper__name">{{ item.name }}</div>
        <div v-if="reward" class="item-popper__reward">
          <i class="fa fa-plus" />
          {{ reward }}
        </div>
        <div class="flexy select-none">
          <a
            v-for="time in video_times"
            :key="time.seconds"
            :href="getVideoUrl(time)"
            class="pill -primary"
            target="_blank"
          >
            {{ time.hms }}
            <i class="fa fa-external-link" />
          </a>
        </div>
      </div>
    </div>
  </unrest-popper>
</template>

<script>
export default {
  inject: ['video'],
  props: {
    item: Object,
    watchme: Number,
  },
  data() {
    return {
      drawing: null,
      name_override: this.item.data.name,
      reward: this.item.data.reward,
    }
  },
  computed: {
    can_edit() {
      return this.$auth.user?.is_superuser
    },
    video_times() {
      if (!this.video) {
        return []
      }
      return this.item.times_by_video_id[this.video.id]
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
      const WORLD = 3
      this.$store.video
        .save(this.video)
        .then(() => this.$store.video.getPage({ query: { world_id: WORLD, per_page: 5000 } }))
    },
    getVideoUrl(time) {
      return `https://youtu.be/${this.video.external_id}?t=${time.seconds}`
    },
  },
}
</script>
