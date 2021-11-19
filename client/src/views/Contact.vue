<template>
  <div class="app-body app-contact">
    <div class="app-contact__form">
      <h1>Contact</h1>
      <div v-if="message" class="alert alert-success">
        {{ message }}
      </div>
      <unrest-schema-form v-else form_name="schema/contact" :state="state" :success="success" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return { state: {}, message: null }
  },
  methods: {
    success() {
      this.message = "Message sent! Thank you for your feedback."
    }
  }
}
</script>