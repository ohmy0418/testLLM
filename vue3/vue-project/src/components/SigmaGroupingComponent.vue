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
import type { PlainObject, NodeDisplayData, EdgeDisplayData } from 'sigma/types'
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
  selectedNode: null as string | null,
})

let cancelCurrentAnimation: (() => void) | null = null


onMounted(() => {

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const items = ['a', 'b', 'c', 'd'];

  alphabet.split('').forEach((groupLetter) => {
    const topGroup = `Group${groupLetter}`;
    state.graph.addNode(topGroup, { label: topGroup, size: 20, color: 'black', x: Math.random() * 100, y: Math.random() * 100 });

    for (let i = 1; i <= 4; i++) {
      const groupItem = `${groupLetter}-${i}`;
      state.graph.addNode(groupItem, { label: groupItem, size: 10, color: 'gray', x: Math.random() * 100, y: Math.random() * 100 });
      state.graph.addEdge(topGroup, groupItem);

      items.forEach((item) => {
        const nodeId = `${groupItem}-${item}`;
        state.graph.addNode(nodeId, { label: nodeId, size: 5, color: 'lightgray', x: Math.random() * 100, y: Math.random() * 100 });
        state.graph.addEdge(groupItem, nodeId);
      });
    }
  });

  if (container.value) {
    state.sigmaInstance = new Sigma(state.graph, container.value);

    state.sigmaInstance?.on('enterNode', (event) => {
      resetColors();
      highlightNodeAndNeighbors(event.node);
      state.sigmaInstance?.refresh();
    });

    state.sigmaInstance?.on('leaveNode', () => {
      resetColors();
      state.sigmaInstance?.refresh();
    });
  }
});

const highlightNodeAndNeighbors = (nodeId: string) => {
  const visitedNodes = new Set<string>();
  const visitedEdges = new Set<string>();
  const stack = [nodeId];

  while (stack.length > 0) {
    const currentNode = stack.pop()!;
    if (!visitedNodes.has(currentNode)) {
      visitedNodes.add(currentNode);
      state.graph.updateNodeAttribute(currentNode, 'color', () => currentNode === nodeId ? 'red' : 'orange');

      state.graph.forEachNeighbor(currentNode, (neighbor:any, attributes:any, edgeId:string) => {
        if (!visitedNodes.has(neighbor)) {
          stack.push(neighbor);
        }
        if (edgeId && !visitedEdges.has(edgeId)) {
          visitedEdges.add(edgeId);
          state.graph.updateEdgeAttribute(edgeId, 'color', () => 'orange');
        }
      });
    }
  }
};
const resetColors = () => {
  state.graph.forEachNode((node:string) => {
    const originalColor = node.includes('-') ? (node.split('-').length === 2 ? 'gray' : 'lightgray') : 'black';
    state.graph.updateNodeAttribute(node, 'color', () => originalColor);
  });
  state.graph.forEachEdge((edge:string) => {
    state.graph.updateEdgeAttribute(edge, 'color', () => '#ccc');
  });
};
// 데이터 검색
const searchData = () => {
  const searchLower = state.searchNode.toLowerCase()
  state.graph.forEachNode((node: any, attributes: any) => {
    const data = state.graph.getNodeAttributes(node)
    if (attributes.label.toLowerCase().includes(searchLower)) {
      state.graph.setNodeAttribute(node, 'color', 'purple')
    } else {
      state.graph.setNodeAttribute(
        node,
        'hidden',
        data.label.toLowerCase().indexOf(searchLower) === -1
      )
    }
  })
  // if (searchLower.includes('edge-')) {
  //   let nodeValue = 'data-'.concat(searchLower.slice(5))
  //   state.graph.forEachEdge((edge: any, attributes: any) => {
  //     const data = state.graph.getEdgeAttributes(edge)
  //     if (attributes.label.toLowerCase().includes(searchLower)) {
  //       state.graph.setEdgeAttribute(edge, 'color', 'green')
  //     } else {
  //       state.graph.setEdgeAttribute(
  //         edge,
  //         'hidden',
  //         data.label.toLowerCase().indexOf(searchLower) === -1
  //       )
  //     }
  //   })
  //
  //   state.graph.forEachNode((node: any, attributes: any) => {
  //     const data = state.graph.getNodeAttributes(node)
  //     if (!attributes.label.toLowerCase().includes(nodeValue)) {
  //       state.graph.setNodeAttribute(
  //         node,
  //         'hidden',
  //         data.label.toLowerCase().indexOf(nodeValue) === -1
  //       )
  //     }
  //   })
  // } else {
  //   state.graph.forEachNode((node: any, attributes: any) => {
  //     const data = state.graph.getNodeAttributes(node)
  //     if (attributes.label.toLowerCase().includes(searchLower)) {
  //       state.graph.setNodeAttribute(node, 'color', 'purple')
  //     } else {
  //       state.graph.setNodeAttribute(
  //         node,
  //         'hidden',
  //         data.label.toLowerCase().indexOf(searchLower) === -1
  //       )
  //     }
  //   })
  // }

  state.sigmaInstance?.refresh()
}

// 노드, 엣지 초기화
const resetGraph = () => {
  state.graph.forEachNode((node: any) => {
    state.graph.setNodeAttribute(node, 'hidden', false)
  })

  state.graph.forEachEdge((edge: any, attributes: any, source: string, target: string) => {
    state.graph.setEdgeAttribute(edge, 'hidden', false)
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
