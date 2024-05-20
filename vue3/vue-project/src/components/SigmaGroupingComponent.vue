<!-- 그룹화가 되어있는 1300개의 데이터 -->
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
const state = reactive({
  graph: new Graph() as any,
  sigmaInstance: null as Sigma | null,
  searchNode: ref<string>(''),
  change: ref<boolean>(false),
  hoveredNode: ref<any>(''),
  hoveredNeighbors: new Set<string>(),
  selectedNode: null as string | null,
  draggedNode:  null as string | null,
  isDragging: ref<boolean>(false)
})

let cancelCurrentAnimation: (() => void) | null = null

onMounted(() => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ가나다라마바사아자차타카파하고노도로보소오조초토포코호'
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

    state.sigmaInstance?.on('downNode', (event) => {
      console.log(event.node)
      state.isDragging = true
      state.draggedNode = event.node
      state.graph.setNodeAttribute(state.draggedNode, 'highlighted', true)
    })

    state.sigmaInstance?.getMouseCaptor().on('mousemovebody', (event)=>{
      if (!state.isDragging || !state.draggedNode) return;

      const pos = state.sigmaInstance?.viewportToGraph(event);

      state.graph.setNodeAttribute(state.draggedNode, "x", pos.x);
      state.graph.setNodeAttribute(state.draggedNode, "y", pos.y);

      event.preventSigmaDefault();
      event.original.preventDefault();
      event.original.stopPropagation();
    })

    state.sigmaInstance?.getMouseCaptor().on('mouseup', () => {
      console.log('mouseup')
      if (state.draggedNode) {
        state.graph.removeNodeAttribute(state.draggedNode, 'highlighted')
      }
      state.isDragging = false;
      state.draggedNode = null;
    });

    state.sigmaInstance?.getMouseCaptor().on('mousedown', () => {
      console.log('mousedown')
      if (!state.sigmaInstance?.getCustomBBox()) state.sigmaInstance?.setCustomBBox(state.sigmaInstance?.getBBox());
    });
  }
  console.log(state.graph.nodes())

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

// png 저장
const saveAsPng = () => {
  const layers = ['edges', 'nodes', 'edgeLabels', 'labels'].filter(
    (id) => !!(document.getElementById(`layer-${id}`) as HTMLInputElement).checked
  )

  settingPng(state.sigmaInstance, layers)
}

const settingPng = (renderer: Sigma, inputLayers?: string[]) => {
  const { width, height } = renderer.getDimensions()

  const pixelRatio = window.devicePixelRatio || 1

  const tmpRoot = document.createElement('DIV')
  tmpRoot.style.width = `${width}px`
  tmpRoot.style.height = `${height}px`
  tmpRoot.style.position = 'absolute'
  tmpRoot.style.right = '101%'
  tmpRoot.style.bottom = '101%'
  document.body.appendChild(tmpRoot)

  // Copy camera and force to render now, to avoid having to wait the schedule /
  // debounce frame:
  renderer.getCamera().setState(renderer.getCamera().getState())
  renderer.refresh()

  // Create a new canvas, on which the different layers will be drawn:
  const canvas = document.createElement('CANVAS') as HTMLCanvasElement
  canvas.setAttribute('width', width * pixelRatio + '')
  canvas.setAttribute('height', height * pixelRatio + '')
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

  // Draw a white background first:
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width * pixelRatio, height * pixelRatio)

  // For each layer, draw it on our canvas:
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

  // Save the canvas as a PNG image:
  canvas.toBlob((blob) => {
    if (blob) FileSaver.saveAs(blob, 'graph.png')

    // Cleanup:
    renderer.refresh()
    tmpRoot.remove()
  }, 'image/png')
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

  const positions: { [key: string]: { x: number; y: number } } = {}

  state.graph.forEachNode((node: string, attr: any) => {
    if (node.startsWith('Group')) {
      const rootNode = node
      let xOffset = 0
      positions[rootNode] = { x: xOffset, y: yOffset }

      const children = state.graph.neighbors(rootNode)
      children.forEach((child: any) => {
        xOffset += xSpacing
        positions[child] = { x: xOffset, y: yOffset + ySpacing }

        const grandChildren = state.graph.neighbors(child)
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

  cancelCurrentAnimation = animateNodes(state.graph, positions, { duration: 2000 })
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
