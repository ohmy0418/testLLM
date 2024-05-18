<template>
  <div class="wrap">
    <SigmaComponent />
  </div>
</template>

<script lang="ts" setup>
import SigmaComponent from './components/SigmaComponent.vue'
</script>

<style scoped>
.wrap {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
