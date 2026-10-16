<script setup>
import { ref } from "vue";

const count = ref(0);
</script>

<template>
  <main class="container">
    <h1>Vue</h1>
    <p>Edit <code>src/App.vue</code>, save, and watch the preview update.</p>
    <button @click="count++">Count is {{ count }}</button>
  </main>
</template>
