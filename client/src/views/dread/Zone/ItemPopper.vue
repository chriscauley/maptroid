<template>
  <unrest-popper placement="bottom" offset="0,10" :watchme="watchme">
    <div class="item-popper" @click.stop>
      <div v-if="can_edit">
        {{ item.attrs.title }}
        <input v-model="name_override" @input="saveItem" placeholder="Name Override" />
        <input v-model="reward" @input="saveItem" placeholder="Reward" />
        <select
          v-if="transits"
          v-model="transit_target_id"
          @change="saveItem"
          placeholder="Transit"
        >
          <option v-for="transit in transits" :value="transit.id" :key="transit.id">
            {{ transit.name }}
          </option>
        </select>
        <div class="flexy select-none">
          <span class="pill -primary" v-for="time in video_times" :key="time.seconds">
            {{ time.hms }}
            <i class="fa fa-close" @click="(e) => deleteTime(e, time)" />
          </span>
          <i class="fa fa-youtube-play" @click="addTime" />
        </div>
      </div>
      <div v-else>
        <div class="item-popper__name">{{ item.attrs.title }}</div>
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
  inject: ['transit_choices'],
  props: {
    item: Object,
    watchme: Number,
  },
  data() {
    // TODO remove this after all transit choices are set
    window._checkTransits = () => {
      this.transit_choices
        .filter((tc) => tc.zone_id === this.item.zone && !tc._target)
        .forEach((tc) => console.warn(tc.name, 'is missing endpoint'))
    }
    return {
      drawing: null,
      name_override: this.item.data.name,
      reward: this.item.data.reward,
      transit_target_id: this.item.data.transit_target_id,
    }
  },
  computed: {
    transit_target() {
      const _id = this.transit_target_id
      return _id && this.transits.find((tc) => tc.id === _id)
    },
    transits() {
      const { type } = this.item.data
      if (this.transit_choices.find((tc) => tc.id === this.item.id)) {
        return this.transit_choices.filter((tc) => tc.type === type && tc.id !== this.item.id)
      }
      return null
    },
    can_edit() {
      return this.$auth.user?.is_superuser
    },
    video_times() {
      return this.$store.video.times_by_item_id[this.item.id] || []
    },
  },
  methods: {
    saveItem() {
      this.item.data.name = this.name_override // eslint-disable-line
      this.item.data.reward = this.reward // eslint-disable-line
      if (this.transits) {
        delete this.item.data.transit_target
        this.item.data.transit_target_id = this.transit_target_id // eslint-disable-line
      }
      this.$store.item.bounceSave(this.item)
    },
    addTime() {
      if (window.YT_PLAYER_TIME === undefined) {
        throw 'Unable to find current player time'
      }
      const video = this.$store.video.getCurrentVideo()
      video.data.actions.push([this.item.id, window.YT_PLAYER_TIME])
      this.saveVideo()
    },
    deleteTime(event, time) {
      if (!event.shiftKey && !event.ctrlKey) {
        this.$ui.alert('Hold shift and control to delete event')
        return
      }
      const video = this.$store.video.getCurrentVideo()
      const match = (a) => !(a[0] === this.item.id && a[1] === time.seconds)
      video.data.actions = video.data.actions.filter(match)
      this.saveVideo()
    },
    saveVideo() {
      const video = this.$store.video.getCurrentVideo()
      this.$store.video.save(video).then(this.$store.route.refetchVideos)
    },
    getVideoUrl(time) {
      const video = this.$store.video.getCurrentVideo()
      return `https://youtu.be/${video.external_id}?t=${time.seconds - 10}`
    },
  },
}
</script>
