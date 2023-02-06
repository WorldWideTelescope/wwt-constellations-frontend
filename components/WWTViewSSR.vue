<template>
  <div>
    <client-only>
      <WWTView />
      <template #fallback>
        <div>WorldWide Telescope component</div>
      </template>
    </client-only>
  </div>
</template>
