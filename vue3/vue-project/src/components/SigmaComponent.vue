<!-- 그룹화가 없는 10000개의 데이터 -->
<template>
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
    <label class="checkbox"
      ><input type="checkbox" id="filter" v-model="state.change" @change="showHalf($event)" />반만
      보여줘</label
    >
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
import type { PlainObject, NodeDisplayData, EdgeDisplayData } from 'sigma/types'
import { animateNodes } from 'sigma/utils/animate'

const container = ref<HTMLElement | null>(null)
const state = reactive({
  graph: new Graph() as any,
  sigmaInstance: null as Sigma | null,
  searchNode: ref<string>(''),
  change: ref<boolean>(false),
  hoveredNode: ref<any>(''),
  hoveredNeighbors: new Set<string>(),
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
      size: Math.floor(Math.random() * (Math.floor(10) - Math.ceil(2)) + 2),
      color: 'gray',
      url: 'https://www.naver.com/'
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

  // 노드 클릭 시 url 이동 이벤트 (추후 데이터를 재겁색 하는 기능으로 바꿀 수 있을듯)
  state.sigmaInstance?.on('clickNode', (event) => {
    const nodeId = event.node
    state.selectedNode = nodeId
  })

  // Node 오버 시 선택된 node 전달하여 함수 실행
  // state.sigmaInstance?.on('enterNode', (event) => {
  //   highlightNodeAndNeighbors(event.node)
  //   state.sigmaInstance?.refresh()
  // })

  // Node 오버아웃 시 undefined 전달하여 함수 실행
  // state.sigmaInstance?.on('leaveNode', () => {
  //   resetColors()
  //   state.sigmaInstance?.refresh()
  // })
}

// 노드 컬러 초기화
const resetColors = () => {
  state.graph.forEachNode((node: string) => {
    state.graph.updateNodeAttribute(node, 'color', () => 'gray')
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
      state.graph.updateNodeAttribute(currentNode, 'color', () =>
        currentNode === nodeId ? 'red' : ''
      )

      state.graph.forEachNeighbor(currentNode, (neighbor: string, attributes: object) => {
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

  if (searchLower.includes('data-')) {
    state.graph.forEachNode((node: any, attributes: any) => {
      const data = state.graph.getNodeAttributes(node)
      if (attributes.label.toLowerCase().includes(searchLower)) {
        state.graph.setNodeAttribute(node, 'color', 'red')
        state.graph.setNodeAttribute(node, 'size', 10)
      } else {
        state.graph.setNodeAttribute(
          node,
          'hidden',
          data.label.toLowerCase().indexOf(searchLower) === -1
        )
      }
    })
  } else if (searchLower.includes('edge-')) {
    let nodeValue = 'data-'.concat(searchLower.slice(5))
    state.graph.forEachEdge((edge: any, attributes: any) => {
      const data = state.graph.getEdgeAttributes(edge)
      if (attributes.label.toLowerCase().includes(searchLower)) {
        state.graph.setEdgeAttribute(edge, 'color', 'orange')
        state.graph.setEdgeAttribute(edge, 'size', 3)
      } else {
        state.graph.setEdgeAttribute(
          edge,
          'hidden',
          data.label.toLowerCase().indexOf(searchLower) === -1
        )
      }
    })

    state.graph.forEachNode((node: any, attributes: any) => {
      const data = state.graph.getNodeAttributes(node)
      if (!attributes.label.toLowerCase().includes(nodeValue)) {
        state.graph.setNodeAttribute(
          node,
          'hidden',
          data.label.toLowerCase().indexOf(nodeValue) === -1
        )
      }
    })
  } else {
    window.alert('data-숫자, edge-숫자 형식으로 입력하세요.')
  }

  state.sigmaInstance?.refresh()
}

// 노드, 엣지 초기화
const resetGraph = () => {
  state.graph.forEachNode((node: any) => {
    state.graph.setNodeAttribute(node, 'hidden', false)
    state.graph.setNodeAttribute(node, 'color', 'gray')
    state.graph.setNodeAttribute(
      node,
      'size',
      Math.floor(Math.random() * (Math.floor(10) - Math.ceil(2)) + 2)
    )
  })

  state.graph.forEachEdge((edge: any, attributes: any, source: string, target: string) => {
    state.graph.setEdgeAttribute(edge, 'hidden', false)
    state.graph.setEdgeAttribute(edge, 'size', 2)
    state.graph.setEdgeAttribute(edge, 'color', '#ccc')
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

// 반만 보이도록 필터 (추후 데이터 카테고리 별로 필터 기능 구현 가능)
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
</script>

<style scoped></style>
