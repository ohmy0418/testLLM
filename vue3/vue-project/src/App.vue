<!--
TODO: packages/demo/src/views/GraphEventsController.tsx
노드 클릭했을 때 새로운 링크(해당 노드)로 이동하는 기능 추가
-->
<template>
  <div class="wrap">
    <h3>searchNode: {{ state.searchNode }}</h3>
    <div class="controls">
      <input
        type="text"
        v-model="state.searchNode"
        class="text-input"
        placeholder="Search nodes..."
      />
      <button @click="searchData">검색</button>
      <button @click="resetGraph">초기화</button>
    </div>
    <div class="controls">
      <label class="checkbox"
      ><input type="checkbox" id="filter" v-model="state.change" @change="showHalf($event)" />반만
        보여줘</label
      >
      <button @click="zoomIn">확대</button>
      <button @click="zoomOut">축소</button>
      <button @click="zoomReset">초기 사이즈로</button>
    </div>
    <div class="controls">
      <button @click="showRandom">랜덤으로 보이기</button>
      <button @click="showCircular">원으로 보이기</button>
    </div>
    <div class="container" ref="container"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, reactive } from 'vue'
import Graph from 'graphology'
import { circular } from 'graphology-layout'
import Sigma from 'sigma'
import type { PlainObject, NodeDisplayData, EdgeDisplayData } from 'sigma/types'
import { animateNodes } from 'sigma/utils/animate'

export default defineComponent({
  name: 'KnowledgeGraph',
  setup() {
    const container = ref<HTMLElement | null>(null)
    const state = reactive({
      graph: new Graph() as any,
      sigmaInstance: null as Sigma | null,
      searchNode: ref<string>(''),
      change: ref<boolean>(false),
      hoveredNode: ref<any>(''),
      hoveredNeighbors: new Set<string>()
    })
    let cancelCurrentAnimation: (() => void) | null = null

    // 그래프 초기 세팅
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
            type: 'arrow',
            label: 'related',
            size: 2,
            color: '#4d4d4d'
          })
        }
      }

      state.sigmaInstance = new Sigma(state.graph, container.value!, {
        renderEdgeLabels: true,
        allowInvalidContainer: true
      })

      showRandom()
      state.sigmaInstance?.on('enterNode', ({ node }) => {
        setHoveredNode(node)
      })
      state.sigmaInstance?.on('leaveNode', () => {
        setHoveredNode(undefined)
      })

      state.sigmaInstance?.setSetting('nodeReducer', (node, data) => {
        const res: Partial<NodeDisplayData> = { ...data }

        if (
          state.hoveredNeighbors &&
          !state.hoveredNeighbors.has(node) &&
          state.hoveredNode !== node
        ) {
          res.color = '#005acd'
        }

        return res
      })

      state.sigmaInstance?.setSetting('edgeReducer', (edge, data) => {
        const res: Partial<EdgeDisplayData> = { ...data }

        if (state.hoveredNode && !state.graph.hasExtremity(edge, state.hoveredNode)) {
          res.hidden = true
        }

        return res
      })
    }

    const setHoveredNode = (node?: string) => {
      if (node) {
        state.hoveredNode = node
        state.hoveredNeighbors = new Set(state.graph.neighbors(node))
      }

      const nodes = state.graph.filterNodes(
        (n: any) => n !== state.hoveredNode && !state.hoveredNeighbors?.has(n)
      )
      const nodesIndex = new Set(nodes)
      const edges = state.graph.filterEdges((e: any) =>
        state.graph.extremities(e).some((n: any) => nodesIndex.has(n))
      )

      if (!node) {
        state.hoveredNode = undefined
        state.hoveredNeighbors = new Set(undefined)
      }

      state.sigmaInstance?.refresh({ partialGraph: { nodes, edges }, skipIndexation: true })
    }

    // 데이터 검색
    const searchData = () => {
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

    // 검색 초기화
    const resetGraph = () => {
      state.graph.forEachNode((node: any, attributes: any) => {
        state.graph.setNodeAttribute(node, 'hidden', false)
        state.graph.setNodeAttribute(node, 'color', attributes.originalColor)
        state.graph.setNodeAttribute(
          node,
          'size',
          Math.floor(Math.random() * (Math.floor(30) - Math.ceil(10)) + 10)
        )
      })
      state.sigmaInstance?.refresh()
    }

    // 확대
    const zoomIn = () => {
      state.sigmaInstance?.getCamera().animatedZoom({ duration: 400 })
    }

    // 축소
    const zoomOut = () => {
      state.sigmaInstance?.getCamera().animatedUnzoom({ duration: 400 })
    }

    // 확대/축소 초기화
    const zoomReset = () => {
      state.sigmaInstance?.getCamera().animatedReset({ duration: 600 })
    }

    // 반만 보이도록 필터
    const showHalf = (event: any) => {
      let isChecked = event.target.checked
      state.graph.nodes().forEach((node: any) => {
        state.graph.setNodeAttribute(node, 'hidden', isChecked && Math.random() > 0.5)
      })
    }

    // 랜덤으로 재정렬
    const showRandom = () => {
      if (cancelCurrentAnimation) cancelCurrentAnimation()

      const xExtents = { min: 0, max: 0 }
      const yExtents = { min: 0, max: 0 }
      state.graph.forEachNode((_node: any, attributes: any) => {
        xExtents.min = Math.min(attributes.x, xExtents.min)
        xExtents.max = Math.max(attributes.x, xExtents.max)
        yExtents.min = Math.min(attributes.y, yExtents.min)
        yExtents.max = Math.max(attributes.y, yExtents.max)
      })
      const randomPositions: PlainObject<PlainObject<number>> = {}
      state.graph.forEachNode((node: any) => {
        randomPositions[node] = {
          x: Math.random() * (xExtents.max - xExtents.min),
          y: Math.random() * (yExtents.max - yExtents.min)
        }
      })
      cancelCurrentAnimation = animateNodes(state.graph, randomPositions, { duration: 2000 })
    }

    // 원으로 보여주기
    const showCircular = () => {
      if (cancelCurrentAnimation) cancelCurrentAnimation()

      const circularPositions = circular(state.graph, { scale: 100 })
      cancelCurrentAnimation = animateNodes(state.graph, circularPositions, {
        duration: 2000,
        easing: 'linear'
      })
    }
    onMounted(initializeGraph)

    return {
      container,
      state,
      searchData,
      resetGraph,
      zoomIn,
      zoomOut,
      zoomReset,
      showHalf,
      showRandom,
      showCircular
    }
  }
})
</script>

<style scoped>
.wrap {
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

.controls,
.snap {
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

  input {
    margin-right: 4px;
  }
}
</style>
