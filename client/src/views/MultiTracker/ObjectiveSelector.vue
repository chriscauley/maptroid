<template>
  <div>
    <sm-objective-selector
      :categories="categories"
      @toggle-objective="toggleObjective"
      short_names
    />
    <div class="modal-footer">
      <button @click="$emit('close')" class="btn -danger">Cancel</button>
      <button @click="save" class="btn -primary">Save</button>
    </div>
  </div>
</template>

<script>
import { varia } from 'sm-data'

export default {
  props: {
    controller: Object,
  },
  emits: ['close'],
  data() {
    const selected_objectives = this.controller.get()?.data.objectives || []
    return { selected_objectives }
  },
  computed: {
    categories() {
      return Object.entries(varia.objective.by_category).map(([id, objectives]) => ({
        id,
        class: '',
        objectives: objectives.map((objective) => ({
          ...objective,
          selected: this.selected_objectives.includes(objective.id),
        })),
      }))
    },
  },
  methods: {
    toggleObjective(objective) {
      if (this.selected_objectives.includes(objective)) {
        this.selected_objectives = this.selected_objectives.filter((o) => o !== objective)
      } else {
        this.selected_objectives.push(objective)
      }
    },
    save() {
      this.controller.setObjectives(this.selected_objectives)
      this.$emit('close')
    },
  },
}
</script>
