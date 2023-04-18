<template>
  <div id="page-root">
    <ClientOnly>
      <FeedContainer source-type="" />
    </ClientOnly>
  </div>
</template>

<style lang="less">
#page-root {
  pointer-events: none;
}

#feed {
  position: absolute;
  overflow: visible;
  z-index: 10;
  height: 100%;
  min-width: 200px;
  pointer-events: auto;
}

@media(max-width: 600px) {
  #feed {
    top: 80%;
    max-width: 100%;
    max-height: 20%;
  }
}
</style>
