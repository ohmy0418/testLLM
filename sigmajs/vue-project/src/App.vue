<template>
  <div class="gnb">
    <RouterLink to="/sigma">Go to Sigma BigData</RouterLink>
    <RouterLink to="/sigmaGrouping">Go to Sigma Grouping</RouterLink>
  </div>
  <p>------------------------------------------------------------------------------------------------------------------------------------------------------</p>
  <div class="wrap">
    <router-view></router-view>
  </div>
</template>

<script lang="ts" setup>
</script>

<style scoped>
.gnb {
  display: flex;
  gap: 12px;
}

.wrap {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
