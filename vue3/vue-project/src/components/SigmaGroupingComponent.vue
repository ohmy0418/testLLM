<template>
  <h3>searchNode: {{ searchNode }}</h3>
  <div class="controls">
    <input
      type="text"
      v-model="searchNode"
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
    <label class="checkbox">
      <input type="checkbox" id="filter" v-model="change" @change="showHalf($event)" />반만 보여줘
    </label>
    <p>선택한 Node: {{ selectedNode }}</p>
  </div>
  <div class="controls" id="controls">
    <h3>스냅샷</h3>
    <div class="snap">
      <input type="checkbox" id="layer-edges" checked />
      <label for="layer-edges">Edges</label>
    </div>
    <div class="snap">
      <input type="checkbox" id="layer-nodes" checked />
      <label for="layer-nodes">Nodes</label>
    </div>
    <div class="snap">
      <input type="checkbox" id="layer-edgeLabels" checked />
      <label for="layer-edgeLabels">Edge labels</label>
    </div>
    <div class="snap">
      <input type="checkbox" id="layer-labels" checked />
      <label for="layer-labels">Node labels</label>
    </div>
    <br />
    <button type="button" id="save-as-png" @click="saveAsPng">Save as PNG</button>
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
import FileSaver from 'file-saver'

const container = ref<HTMLElement | null>(null)
const graph = new Graph()
const sigmaInstance = ref<Sigma | null>(null)
const searchNode = ref<string>('')
const change = ref<boolean>(false)
const selectedNode = ref<string | null>(null)

let cancelCurrentAnimation: (() => void) | null = null

const initializeGraph = () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ가나다라마바사아자차타카파하고노도로보소오조초토포코호'
  const items = ['a', 'b', 'c', 'd']

  alphabet.split('').forEach((groupLetter) => {
    const topGroup = `Group${groupLetter}`
    graph.addNode(topGroup, {
      label: topGroup,
      size: 20,
      color: 'black',
      x: Math.random() * 100,
      y: Math.random() * 100
    })

    for (let i = 1; i <= 4; i++) {
      const groupItem = `${groupLetter}-${i}`
      graph.addNode(groupItem, {
        label: groupItem,
        size: 10,
        color: 'gray',
        x: Math.random() * 100,
        y: Math.random() * 100
      })

      graph.addEdge(topGroup, groupItem, {
        label: `Edge-${i}`,
        size: 2
      })

      items.forEach((item) => {
        const nodeId = `${groupItem}-${item}`
        graph.addNode(nodeId, {
          label: nodeId,
          size: 5,
          color: 'lightgray',
          x: Math.random() * 100,
          y: Math.random() * 100
        })
        graph.addEdge(groupItem, nodeId, {
          label: `Edge-${i}`,
          size: 2
        })
      })
    }
  })
}

onMounted(() => {
  initializeGraph()

  if (container.value) {
    sigmaInstance.value = new Sigma(graph, container.value, {
      renderEdgeLabels: true,
      allowInvalidContainer: true,
      defaultEdgeColor: '#ccc',
      defaultEdgeType: 'arrow',
      edgeLabelSize: 13,
      labelSize: 15
    })

    sigmaInstance.value?.on('enterNode', (event) => {
      resetColors()
      highlightNodeAndNeighbors(event.node)
      sigmaInstance.value?.refresh()
    })

    sigmaInstance.value?.on('leaveNode', () => {
      resetColors()
      sigmaInstance.value?.refresh()
    })

    sigmaInstance.value?.on('clickNode', (event) => {
      selectedNode.value = event.node
    })
  }

  showRandom()
})

// 노드 컬러 초기화
const resetColors = () => {
  graph.forEachNode((node: string) => {
    const originalColor = node.includes('-')
      ? node.split('-').length === 2
        ? 'gray'
        : 'lightgray'
      : 'black'
    graph.updateNodeAttribute(node, 'color',() =>  originalColor)
  })

  graph.forEachEdge((edge: string) => {
    graph.updateEdgeAttribute(edge, 'color', () => '#ccc')
    graph.updateEdgeAttribute(edge, 'hidden', () => false)
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
      graph.updateNodeAttribute(currentNode, 'color', () => currentNode === nodeId ? 'red' : 'orange')

      graph.forEachNeighbor(currentNode, (neighbor: string) => {
        if (!visitedNodes.has(neighbor)) {
          stack.push(neighbor)
        }
      })

      graph.forEachEdge(currentNode, (edge: string) => {
        visitedEdges.add(edge)
        graph.updateEdgeAttribute(edge, 'color', () => 'blue')
        graph.updateEdgeAttribute(edge, 'hidden', () => false)
      })
    }
  }

  graph.forEachEdge((edge: string) => {
    if (!visitedEdges.has(edge)) {
      graph.updateEdgeAttribute(edge, 'hidden',() =>  true)
    }
  })
}

// 데이터 검색
const searchData = () => {
  const searchLower = searchNode.value.toLowerCase()

  if (searchLower.includes('edge-')) {
    graph.forEachEdge((edge: any, attributes: any) => {
      const data = graph.getEdgeAttributes(edge)
      if (attributes.label.toLowerCase().includes(searchLower)) {
        graph.setEdgeAttribute(edge, 'color', 'skyblue')
      } else {
        graph.setEdgeAttribute(edge, 'hidden', data.label.toLowerCase().indexOf(searchLower) === -1)
      }
    })
  } else {
    graph.forEachNode((node: any, attributes: any) => {
      const data = graph.getNodeAttributes(node)
      if (attributes.label.toLowerCase().includes(searchLower)) {
        graph.setNodeAttribute(node, 'color', 'red')
      } else {
        graph.setNodeAttribute(node, 'hidden', data.label.toLowerCase().indexOf(searchLower) === -1)
      }
    })
  }

  sigmaInstance.value?.refresh()
}

// 노드, 엣지 초기화
const resetGraph = () => {
  graph.forEachNode((node: any) => {
    graph.setNodeAttribute(node, 'hidden', false)
  })

  graph.forEachEdge((edge: any, attributes: any, source: string, target: string) => {
    graph.setEdgeAttribute(edge, 'hidden', false)
    graph.setEdgeAttribute(edge, 'color', '#ccc')
  })
  searchNode.value = ''
  sigmaInstance.value?.refresh()
}

// png 저장
const saveAsPng = () => {
  const layers = ['edges', 'nodes', 'edgeLabels', 'labels'].filter(
    (id) => !!(document.getElementById(`layer-${id}`) as HTMLInputElement).checked
  )

  settingPng(sigmaInstance.value, layers)
}

const settingPng = (renderer: Sigma | null, inputLayers?: string[]) => {
  if (!renderer) return

  const { width, height } = renderer.getDimensions()

  const pixelRatio = window.devicePixelRatio || 1

  const tmpRoot = document.createElement('DIV')
  tmpRoot.style.width = `${width}px`
  tmpRoot.style.height = `${height}px`
  tmpRoot.style.position = 'absolute'
  tmpRoot.style.right = '101%'
  tmpRoot.style.bottom = '101%'
  document.body.appendChild(tmpRoot)

  renderer.getCamera().setState(renderer.getCamera().getState())
  renderer.refresh()

  const canvas = document.createElement('CANVAS') as HTMLCanvasElement
  canvas.setAttribute('width', width * pixelRatio + '')
  canvas.setAttribute('height', height * pixelRatio + '')
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width * pixelRatio, height * pixelRatio)

  const canvases = renderer.getCanvases()
  const layers = inputLayers ? inputLayers.filter((id) => !!canvases[id]) : Object.keys(canvases)
  layers.forEach((id) => {
    ctx.drawImage(
      canvases[id],
      0,
      0,
      width * pixelRatio,
      height * pixelRatio,
      0,
      0,
      width * pixelRatio,
      height * pixelRatio
    )
  })

  canvas.toBlob((blob) => {
    if (blob) FileSaver.saveAs(blob, 'graph.png')

    renderer.refresh()
    tmpRoot.remove()
  }, 'image/png')
}

// 랜덤으로 재정렬
const showRandom = () => {
  if (cancelCurrentAnimation) cancelCurrentAnimation()

  const xExtents = { min: 0, max: 0 }
  const yExtents = { min: 0, max: 0 }
  graph.forEachNode((_node: any, attributes: any) => {
    xExtents.min = Math.min(attributes.x, xExtents.min)
    xExtents.max = Math.max(attributes.x, xExtents.max)
    yExtents.min = Math.min(attributes.y, yExtents.min)
    yExtents.max = Math.max(attributes.y, yExtents.max)
  })
  const randomPositions: PlainObject<PlainObject<number>> = {}
  graph.forEachNode((node: any) => {
    randomPositions[node] = {
      x: Math.random() * (xExtents.max - xExtents.min),
      y: Math.random() * (yExtents.max - yExtents.min)
    }
  })
  cancelCurrentAnimation = animateNodes(graph, randomPositions, { duration: 1500 })
}

// 원으로 보여주기
const showCircular = () => {
  if (cancelCurrentAnimation) cancelCurrentAnimation()

  const circularPositions = circular(graph, { scale: 100 })
  cancelCurrentAnimation = animateNodes(graph, circularPositions, { duration: 1500 })
}

const arrangeGraph = () => {
  if (!graph || !sigmaInstance.value) return

  const xSpacing = 300
  const ySpacing = 150
  let yOffset = 0

  const positions: { [key: string]: { x: number; y: number } } = {}

  graph.forEachNode((node: string, attr: any) => {
    if (node.startsWith('Group')) {
      const rootNode = node
      let xOffset = 0
      positions[rootNode] = { x: xOffset, y: yOffset }

      const children = graph.neighbors(rootNode)
      children.forEach((child: any) => {
        xOffset += xSpacing
        positions[child] = { x: xOffset, y: yOffset + ySpacing }

        const grandChildren = graph.neighbors(child)
        let grandChildOffset = xOffset - ((grandChildren.length / 2) * xSpacing) / 2
        grandChildren.forEach((grandChild: any) => {
          grandChildOffset += xSpacing / 2
          if (!grandChild.startsWith('Group')) {
            positions[grandChild] = { x: grandChildOffset, y: yOffset + 2 * ySpacing }
          }
        })
      })
      yOffset += 3 * ySpacing
    }
  })

  cancelCurrentAnimation = animateNodes(graph, positions, { duration: 2000 })
}

// 반만 보이도록 필터
const showHalf = (event: any) => {
  const isChecked = event.target.checked
  graph.nodes().forEach((node: any) => {
    graph.setNodeAttribute(node, 'hidden', isChecked && Math.random() > 0.5)
  })
}

// 확대
const zoomIn = () => {
  sigmaInstance.value?.getCamera().animatedZoom({ duration: 400 })
}

// 축소
const zoomOut = () => {
  sigmaInstance.value?.getCamera().animatedUnzoom({ duration: 400 })
}

// 확대/축소 초기화
const zoomReset = () => {
  sigmaInstance.value?.getCamera().animatedReset({ duration: 600 })
}
</script>

<style scoped>
/* 스타일 정의 */
</style>
