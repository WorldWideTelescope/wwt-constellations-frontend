<template>
  <div>
    <ClientOnly>
      <WorldWideTelescope
        wwt-namespace="wwt-constellations"
      ></WorldWideTelescope>
      <template #fallback>
        <div>WorldWide Telescope component</div>
      </template>
    </ClientOnly>
  </div>
</template>
