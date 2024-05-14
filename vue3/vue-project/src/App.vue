<template>
  <div class="wrap">
    <h3>searchNode: {{ state.searchNode }}</h3>
    <div class="controls">
      <input type="text" v-model="state.searchNode" class="text-input" placeholder="Search nodes..." />
      <button @click="applySearch">Search</button>
      <button @click="resetGraph">Reset</button>
    </div>
    <div class="container" ref="container"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, reactive } from 'vue'
import Graph from 'graphology'
import Sigma from 'sigma'

export default defineComponent({
  name: 'KnowledgeGraph',
  setup() {
    const container = ref<HTMLElement | null>(null)
    const state = reactive({
      graph: new Graph() as any,
      sigmaInstance: null as Sigma | null,
      searchNode: ref<string>('')
    })

    const initializeGraph = () => {
      for (let i = 0; i < 40; i++) {
        state.graph.addNode(i.toString(), {
          label: `Data-${i}`,
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          size: Math.floor(Math.random() * (Math.floor(30) - Math.ceil(10)) + 10),
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
          originalColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
          labelSize: 20
        })

        if (i > 0 && Math.random()) {
          state.graph.addEdge(i.toString(), (i - 1).toString(), {
            type: "arrow",
            label: "related in",
            size: 2,
            color: '#333333'
          })
        }
      }
      state.sigmaInstance = new Sigma(state.graph, container.value!, {
        renderEdgeLabels: true,
      })
    }

    const applySearch = () => {
      const searchLower = state.searchNode.toLowerCase()
      state.graph.forEachNode((node: any, attributes: any) => {
        const data = state.graph.getNodeAttributes(node)
        if (attributes.label.toLowerCase().includes(searchLower)) {
          state.graph.setNodeAttribute(node, 'color', 'rgb(255, 0, 0)')
          state.graph.setNodeAttribute(node, 'size', 15)
        } else {
          state.graph.setNodeAttribute(
            node,
            'hidden',
            data.label.toLowerCase().indexOf(searchLower) === -1
          )
        }
      })
      state.sigmaInstance?.refresh()
    }

    const resetGraph = () => {
      state.graph.forEachNode((node: any, attributes: any) => {
        state.graph.setNodeAttribute(node, 'hidden', false)
        state.graph.setNodeAttribute(node, 'color', attributes.originalColor)
      })
      state.sigmaInstance?.refresh()
    }

    onMounted(initializeGraph)

    return { container, state, applySearch, resetGraph }
  }
})
</script>

<style scoped>
.wrap{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.container {
  width: 100%;
  height: 1000px;
  border: 1px solid #ccc;
}
.controls, .snap {
  display: flex;
  align-items: center;
  gap: 12px;
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  min-width: 40px;
  height: 40px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: none;
  font-size: 16px;
  cursor: pointer;
}

.text-input {
  width: 200px;
  height: 40px;
  padding: 0 12px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: none;
}

.checkbox {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-color: #ccc;
  box-shadow: none;
}
</style>
