<!-- 그룹화가 되어있는 800개의 데이터 -->
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
    <button @click="arrangeGraph">노드의 흐름대로 정렬</button>
    <p>|</p>
    <label class="checkbox"
      ><input type="checkbox" id="filter" v-model="state.change" @change="showHalf($event)" />반만
      보여줘</label
    >
    <p>선택한 Node: {{ state.selectedNode }}</p>
  </div>
  <div ref="container" class="container">
    <div class="zoom">
      <button @click="zoomIn">+</button>
      <button @click="zoomOut">-</button>
      <button @click="zoomReset">Reset Size</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue'
import Graph from 'graphology'
import Sigma from 'sigma'
import type { PlainObject } from 'sigma/types'
import { animateNodes } from 'sigma/utils/animate'
import { circular } from 'graphology-layout'

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

onMounted(() => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ가나다라마바사아자차타카파하'
  const items = ['a', 'b', 'c', 'd']

  alphabet.split('').forEach((groupLetter) => {
    const topGroup = `Group${groupLetter}`
    state.graph.addNode(topGroup, {
      label: topGroup,
      size: 20,
      color: 'black',
      x: Math.random() * 100,
      y: Math.random() * 100
    })

    for (let i = 1; i <= 4; i++) {
      const groupItem = `${groupLetter}-${i}`
      state.graph.addNode(groupItem, {
        label: groupItem,
        size: 10,
        color: 'gray',
        x: Math.random() * 100,
        y: Math.random() * 100
      })

      state.graph.addEdge(topGroup, groupItem, {
        label: `Edge-${i}`,
        size: 2
      })

      items.forEach((item) => {
        const nodeId = `${groupItem}-${item}`
        state.graph.addNode(nodeId, {
          label: nodeId,
          size: 5,
          color: 'lightgray',
          x: Math.random() * 100,
          y: Math.random() * 100
        })
        state.graph.addEdge(groupItem, nodeId, {
          label: `Edge-${i}`,
          size: 2
        })
      })
    }
  })

  if (container.value) {
    state.sigmaInstance = new Sigma(state.graph, container.value, {
      renderEdgeLabels: true,
      allowInvalidContainer: true,
      defaultEdgeColor: '#ccc',
      defaultEdgeType: 'arrow',
      edgeLabelSize: 13,
      labelSize: 15
    })

    state.sigmaInstance?.on('enterNode', (event) => {
      resetColors()
      highlightNodeAndNeighbors(event.node)
      state.sigmaInstance?.refresh()
    })

    state.sigmaInstance?.on('leaveNode', () => {
      resetColors()
      state.sigmaInstance?.refresh()
    })

    // TODO 노드 클릭 시 url 이동 이벤트 (추후 데이터를 재겁색 하는 기능으로 바꿀 수 있을듯)
    state.sigmaInstance?.on('clickNode', (event) => {
      const nodeId = event.node
      state.selectedNode = nodeId
    })
  }

  showRandom()
})

// 노드 컬러 초기화
const resetColors = () => {
  state.graph.forEachNode((node: string) => {
    const originalColor = node.includes('-')
      ? node.split('-').length === 2
        ? 'gray'
        : 'lightgray'
      : 'black'
    state.graph.updateNodeAttribute(node, 'color', () => originalColor)
  })

  state.graph.forEachEdge((edge: string) => {
    state.graph.updateEdgeAttribute(edge, 'color', () => '#ccc')
    state.graph.updateEdgeAttribute(edge, 'hidden', () => false)
  })
}

// 선택된 노드 / 엣지 하이라이트
const highlightNodeAndNeighbors = (nodeId: string) => {
  const visitedNodes = new Set<string>()
  const visitedEdges = new Set<string>()
  const stack = [nodeId]

  while (stack.length > 0) {
    const currentNode = stack.pop()!
    if (!visitedNodes.has(currentNode)) {
      visitedNodes.add(currentNode)
      state.graph.updateNodeAttribute(currentNode, 'color', () =>
        currentNode === nodeId ? 'red' : 'orange'
      )

      state.graph.forEachNeighbor(currentNode, (neighbor: string) => {
        if (!visitedNodes.has(neighbor)) {
          stack.push(neighbor)
        }
      })

      state.graph.forEachEdge(currentNode, (edge: string) => {
        visitedEdges.add(edge)
        state.graph.updateEdgeAttribute(edge, 'color', () => 'blue')
        state.graph.updateEdgeAttribute(edge, 'hidden', () => false)
      })
    }
  }

  state.graph.forEachEdge((edge: string) => {
    if (!visitedEdges.has(edge)) {
      state.graph.updateEdgeAttribute(edge, 'hidden', () => true)
    }
  })
}

// 데이터 검색
const searchData = () => {
  const searchLower = state.searchNode.toLowerCase()

  if (searchLower.includes('edge-')) {
    state.graph.forEachEdge((edge: any, attributes: any) => {
      const data = state.graph.getEdgeAttributes(edge)
      if (attributes.label.toLowerCase().includes(searchLower)) {
        state.graph.setEdgeAttribute(edge, 'color', 'green')
      } else {
        state.graph.setEdgeAttribute(
          edge,
          'hidden',
          data.label.toLowerCase().indexOf(searchLower) === -1
        )
      }
    })
  } else {
    state.graph.forEachNode((node: any, attributes: any) => {
      const data = state.graph.getNodeAttributes(node)
      if (attributes.label.toLowerCase().includes(searchLower)) {
        state.graph.setNodeAttribute(node, 'color', 'red')
      } else {
        state.graph.setNodeAttribute(
          node,
          'hidden',
          data.label.toLowerCase().indexOf(searchLower) === -1
        )
      }
    })
  }

  state.sigmaInstance?.refresh()
}

// 노드, 엣지 초기화
const resetGraph = () => {
  state.graph.forEachNode((node: any) => {
    state.graph.setNodeAttribute(node, 'hidden', false)
  })

  state.graph.forEachEdge((edge: any, attributes: any, source: string, target: string) => {
    state.graph.setEdgeAttribute(edge, 'hidden', false)
    state.graph.setEdgeAttribute(edge, 'color', '#ccc')
  })
  state.searchNode = ''
  state.sigmaInstance?.refresh()
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
  cancelCurrentAnimation = animateNodes(state.graph, randomPositions, { duration: 1500 })
}

// 원으로 보여주기
const showCircular = () => {
  if (cancelCurrentAnimation) cancelCurrentAnimation()

  const circularPositions = circular(state.graph, { scale: 100 })
  cancelCurrentAnimation = animateNodes(state.graph, circularPositions, { duration: 1500 })
}

const arrangeGraph = () => {
  if (!state.graph || !state.sigmaInstance) return

  const xSpacing = 300
  const ySpacing = 150
  let yOffset = 0

  state.graph.forEachNode((node: string, attr: any) => {
    if (node.startsWith('Group')) {
      const rootNode = node
      let xOffset = 0
      state.graph.updateNodeAttribute(rootNode, 'x', () => xOffset)
      state.graph.updateNodeAttribute(rootNode, 'y', () => yOffset)

      const children = state.graph.neighbors(rootNode)
      children.forEach((child: any) => {
        xOffset += xSpacing
        state.graph.updateNodeAttribute(child, 'x', () => xOffset)
        state.graph.updateNodeAttribute(child, 'y', () => yOffset + ySpacing)

        const grandChildren = state.graph.neighbors(child)
        let grandChildOffset = xOffset - ((grandChildren.length / 2) * xSpacing) / 2
        grandChildren.forEach((grandChild: any) => {
          grandChildOffset += xSpacing / 2
          if (!grandChild.startsWith('Group')) {
            state.graph.updateNodeAttribute(grandChild, 'x', () => grandChildOffset)
            state.graph.updateNodeAttribute(grandChild, 'y', () => yOffset + 2 * ySpacing)
          }
        })
      })
      yOffset += 3 * ySpacing
    }
  })
}

// 반만 보이도록 필터 (추후 데이터 카테고리 별로 필터 기능 구현 가능)
const showHalf = (event: any) => {
  let isChecked = event.target.checked
  state.graph.nodes().forEach((node: any) => {
    state.graph.setNodeAttribute(node, 'hidden', isChecked && Math.random() > 0.5)
  })
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
</script>

<style></style>
