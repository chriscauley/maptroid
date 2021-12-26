<template>
  <unrest-admin-popup>
    <template #buttons>
      <!-- these can't be router links because osda and tool storages aren't dynamic -->
      <a href="?mode=screenshots" class="btn -primary">
        <i class="far fa-image" />
      </a>
      <a href="?mode=room" class="btn -primary">
        <i class="fa fa-edit" />
      </a>
    </template>
  </unrest-admin-popup>
</template>

<script>
export default {}
</script>
