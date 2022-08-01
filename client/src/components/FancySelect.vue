<template>
  <unrest-dropdown :items="items" :id="field.id" class="form-control">
    <i :class="`fa fa-${icon}`" />
    {{ title }}
  </unrest-dropdown>
</template>

<script>
import ur_form from '@unrest/vue-form'

const { coerce, getChoices } = ur_form

export default {
  props: {
    modelValue: null,
    field: Object,
    form: Object,
  },
  emits: ['update:modelValue'],
  computed: {
    icon() {
      const { icon } = this.field
      return typeof icon === 'function' ? icon(this.modelValue) : icon
    },
    items() {
      const choices = getChoices(this.field)
      return choices.map((choice) => ({
        text: choice.name,
        value: choice.value,
        click: () => {
          const value = coerce(choice.value, this.field)
          this.$emit('update:modelValue', value)
        },
      }))
    },
    title() {
      const matched = this.items.find((item) => {
        return item.value === this.modelValue
      })
      return (matched || this.items[0]).text
    },
  },
}
</script>
