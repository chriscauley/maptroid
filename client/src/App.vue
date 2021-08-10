<template>
<open-seadragon :pixelated="true" :options="options" :style="style" />
</template>

<script>
export default {
  data() {
    return {
      style: 'width: 100vw;height: 100vh;',
      options: {
        tileSources: ['output/SuperMetroidMapZebes.dzi'],
        // tileSources: { type: 'image', url: 'SuperMetroidMapZebes.png' },
        maxZoomPixelRatio: 4,
        showNavigator: true,
        showZoomControl: false,
        showHomeControl: false,
        showFullPageControl: false,
        showRotationControl: false,
        debugmode: false,
        gestureSettingsMouse: {
          clickToZoom: false,
          dblClickToZoom: false,
        },
      }
    }
  }
}
</script>
