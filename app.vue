<template>
  <div id="app">
    <client-only>
      <WorldWideTelescope wwt-namespace="wwt-constellations"></WorldWideTelescope>
    </client-only>
  </div>
</template>

<style lang="less">
#app {
  width: 100%;
  height: 100%;
  margin: 0;

  .wwtelescope-component {
    width: 100vw;
    height: 100vh;
    border-style: none;
    border-width: 0;
    margin: 0;
    padding: 0;
  }

}
</style>
