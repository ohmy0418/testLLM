<template>
  <div>
    <h3>
      searchNode: {{state.searchNode}}
    </h3>
    <div style="">

      <input type="text" v-model="state.searchNode" placeholder="Search nodes...">
      <button @click="applySearch">Search</button>
      <button @click="resetGraph">Reset</button>
    </div>
    <div ref="container" style="width: 1000px; height: 800px;"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, reactive } from 'vue';
import Graph from 'graphology';
import Sigma from 'sigma';

export default defineComponent({
  name: 'KnowledgeGraph',
  setup() {
    const container = ref<HTMLElement | null>(null);
    const state = reactive({
      graph: new Graph(),
      sigmaInstance: null as Sigma | null,
      searchNode: ref<string>('')
    });

    const initializeGraph = () => {
      for (let i = 0; i < 1000; i++) {
        state.graph.addNode(i.toString(), {
          label: `Data-${i}`,
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          size: 10,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
          originalColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
        });

        if (i > 0 && Math.random() > 0.8) {
          state.graph.addEdge(i.toString(), (i - 1).toString());
        }
      }
      state.sigmaInstance = new Sigma(state.graph, container.value!);
    };

    const applySearch = () => {
      const searchLower = state.searchNode.toLowerCase();
      state.graph.forEachNode((node, attributes) => {
        const data = state.graph.getNodeAttributes(node)
        if (attributes.label.toLowerCase().includes(searchLower)) {
          state.graph.setNodeAttribute(node, 'color', 'rgb(255, 0, 0)');
          state.graph.setNodeAttribute(node, 'size', 15);
        } else {
          state.graph.setNodeAttribute(node, 'hidden', data.label.toLowerCase().indexOf(searchLower) === -1);
        }
      });
      state.sigmaInstance?.refresh();
    };

    const resetGraph = () => {
      state.graph.forEachNode((node, attributes) => {
        state.graph.setNodeAttribute(node, 'hidden', false);
        state.graph.setNodeAttribute(node, 'color', attributes.originalColor);
      });
      state.sigmaInstance?.refresh();
    };

    onMounted(initializeGraph);

    return { container, state, applySearch, resetGraph };
  },
});
</script>

<style scoped>
/* Add your CSS styling here */
</style>
