<template>
  <div class="container" ref="container" style="width: 2000px; height: 2000px"></div>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive } from 'vue'
import Graph from 'graphology'
import Sigma from 'sigma'

const container = ref<HTMLElement | null>(null)
const state = reactive({
  graph: new Graph() as any,
  sigmaInstance: null as Sigma | null,
  hoveredNode: ref<any>(''),
  hoveredNeighbors: new Set<string>(),
  highlightedNodes: new Set<string>()
})

// 그래프 초기 세팅
const initializeGraph = () => {
  for (let i = 0; i < 10000; i++) {
    state.graph.addNode(i.toString(), {
      label: `Data-${i}`,
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      size: 8,
      color: '#8c8a8a'
    })

    if (state.graph.nodes().length > 1) {
      state.graph.addEdge(i.toString(), (i - 1).toString(), {
        label: `Edge-${i}`,
        size: 2
      })
    }
  }

  state.sigmaInstance = new Sigma(state.graph, container.value!, {
    renderEdgeLabels: true,
    allowInvalidContainer: true,
    defaultEdgeColor: '#ccc',
    defaultEdgeType: 'arrow',
    edgeLabelSize: 13,
    labelSize: 15
  })

  // Node 오버 시 선택된 node 전달하여 함수 실행
  state.sigmaInstance?.on('enterNode', (event) => {
    highlightNodeAndNeighbors(event.node)
    state.sigmaInstance?.refresh()
  })

  // Node 오버아웃 시 undefined 전달하여 함수 실행
  state.sigmaInstance?.on('leaveNode', () => {
    resetColors()
    state.sigmaInstance?.refresh()
  })
}

// 노드 컬러 초기화
const resetColors = () => {
  state.highlightedNodes.forEach((node) => {
    state.graph.updateNodeAttribute(node, 'color', () => '#8c8a8a')
    state.graph.updateNodeAttribute(node, 'size', () => 8)
  })
  state.highlightedNodes.clear()
}

// 선택된 노드 / 엣지 하이라이트
const highlightNodeAndNeighbors = (nodeId: string) => {
  const visitedNodes = new Set<string>()
  const stack = [nodeId]

  while (stack.length > 0) {
    const currentNode = stack.pop()!

    if (!visitedNodes.has(currentNode)) {
      visitedNodes.add(currentNode)
      state.highlightedNodes.add(currentNode)

      state.graph.updateNodeAttribute(currentNode, 'color', () =>
        currentNode === nodeId ? 'orange' : '#8c8a8a'
      )
      state.graph.updateNodeAttribute(currentNode, 'size', () => (currentNode === nodeId ? 20 : 8))

      state.graph.forEachNeighbor(currentNode, (neighbor: string) => {
        if (!visitedNodes.has(neighbor)) {
          stack.push(neighbor)
          state.highlightedNodes.add(neighbor)
        }
      })
    }
  }
}

onMounted(initializeGraph)
</script>

<style scoped></style>
