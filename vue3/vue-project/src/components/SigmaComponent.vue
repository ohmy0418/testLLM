<template>
  <h2>그룹화하지 않은 10000개의 랜덤 노드로 지식 그래프 구현</h2>
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
    <button @click="showRandom">랜덤으로 보이기</button>
    <button @click="showCircular">원으로 보이기</button>
    <p>|</p>
    <label class="checkbox">
      <input type="checkbox" id="filter" v-model="state.change" @change="showHalf($event)" />반만
      보여줘
    </label>
    <p>선택한 Node: {{ state.selectedNode }}</p>
  </div>
  <div class="container" ref="container" style="width: 1500px; height: 1500px">
    <div class="zoom">
      <button @click="zoomIn">+</button>
      <button @click="zoomOut">-</button>
      <button @click="zoomReset">Reset Size</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive } from 'vue'
import Graph from 'graphology'
import { circular } from 'graphology-layout'
import Sigma from 'sigma'
import type { PlainObject } from 'sigma/types'
import { animateNodes } from 'sigma/utils/animate'

const container = ref<HTMLElement | null>(null)
const state = reactive({
  graph: new Graph(),
  sigmaInstance: null as Sigma | null,
  searchNode: ref<string>(''),
  change: ref<boolean>(false),
  selectedNode: null as string | null
})
let cancelCurrentAnimation: (() => void) | null = null

// 그래프 초기 세팅
const initializeGraph = () => {
  for (let i = 0; i < 10000; i++) {
    state.graph.addNode(i.toString(), {
      label: `Data-${i}`,
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      size: Math.floor(Math.random() * (10 - 2 + 1)) + 2,
      color: 'gray',
      url: 'https://www.naver.com/'
    })

    if (i > 0) {
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

  state.sigmaInstance?.on('clickNode', (event) => {
    state.selectedNode = event.node
  })

  showRandom()
}

// 노드 컬러 초기화
const resetColors = () => {
  state.graph.forEachNode((node) => {
    state.graph.updateNodeAttribute(node, 'color', 'gray')
  })
}

// 선택된 노드 / 엣지 하이라이트
const highlightNodeAndNeighbors = (nodeId: string) => {
  const visitedNodes = new Set<string>()
  const stack = [nodeId]
  while (stack.length > 0) {
    const currentNode = stack.pop()!
    if (!visitedNodes.has(currentNode)) {
      visitedNodes.add(currentNode)
      state.graph.updateNodeAttribute(currentNode, 'color', currentNode === nodeId ? 'red' : '')

      state.graph.forEachNeighbor(currentNode, (neighbor) => {
        if (!visitedNodes.has(neighbor)) {
          stack.push(neighbor)
        }
      })
    }
  }
}

// 데이터 검색
const searchData = () => {
  const searchLower = state.searchNode.toLowerCase()

  state.graph.forEachNode((node, attributes) => {
    const data = state.graph.getNodeAttributes(node)
    if (attributes.label.toLowerCase().includes(searchLower)) {
      state.graph.updateNodeAttribute(node, 'color', () => 'red')
      state.graph.updateNodeAttribute(node, 'size', () => 10)
    } else {
      state.graph.updateNodeAttribute(node, 'hidden', () => true)
    }
  })

  state.graph.forEachEdge((edge, attributes) => {
    const data = state.graph.getEdgeAttributes(edge)
    if (attributes.label.toLowerCase().includes(searchLower)) {
      state.graph.updateEdgeAttribute(edge, 'color', () => 'orange')
      state.graph.updateEdgeAttribute(edge, 'size', () => 3)
    } else {
      state.graph.updateEdgeAttribute(edge, 'hidden', () => true)
    }
  })

  state.sigmaInstance?.refresh()
}

// 노드, 엣지 초기화
const resetGraph = () => {
  state.graph.forEachNode((node) => {
    state.graph.updateNodeAttribute(node, 'hidden', () => false)
    state.graph.updateNodeAttribute(node, 'color', () => 'gray')
    state.graph.updateNodeAttribute(node, 'size', () => Math.floor(Math.random() * (10 - 2 + 1)) + 2)
  })

  state.graph.forEachEdge((edge) => {
    state.graph.updateEdgeAttribute(edge, 'hidden', () => false)
    state.graph.updateEdgeAttribute(edge, 'size', () => 2)
    state.graph.updateEdgeAttribute(edge, 'color', () => '#ccc')
  })
  state.searchNode = ''
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
  const isChecked = event.target.checked
  state.graph.forEachNode((node) => {
    state.graph.updateNodeAttribute(node, 'hidden', () => isChecked && Math.random() > 0.5)
  })
  state.sigmaInstance?.refresh()
}

// 랜덤으로 재정렬
const showRandom = () => {
  if (cancelCurrentAnimation) cancelCurrentAnimation()

  const xExtents = { min: 0, max: 0 }
  const yExtents = { min: 0, max: 0 }
  state.graph.forEachNode((node, attributes) => {
    xExtents.min = Math.min(attributes.x, xExtents.min)
    xExtents.max = Math.max(attributes.x, xExtents.max)
    yExtents.min = Math.min(attributes.y, yExtents.min)
    yExtents.max = Math.max(attributes.y, yExtents.max)
  })

  const randomPositions: PlainObject<PlainObject<number>> = {}
  state.graph.forEachNode((node) => {
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
</script>

<style scoped></style>
