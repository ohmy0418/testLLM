<template>
  <div class="container" ref="container"></div>
</template>

<script lang="ts" setup>
import Graph from 'graphology'
import { SerializedGraph } from 'graphology-types'
import iwanthue from 'iwanthue'
import Sigma from 'sigma'
import { Coordinates, type EdgeDisplayData, type NodeDisplayData } from 'sigma/types'

import data from '../assets/data/euroSIS.json'
import { onMounted, reactive, ref } from 'vue'

const container = ref<HTMLElement | null>(null)
const state = reactive({
  graph: Graph.from(data as SerializedGraph),
  sigmaInstance: null as Sigma | null
})

// cluster definition
interface Cluster {
  label: string
  x?: number
  y?: number
  color?: string
  positions: { x: number; y: number }[]
}


const initializeGraph = () => {
  // initialize clusters from graph data
  const countryClusters: { [key: string]: Cluster } = {}
  state.graph.forEachNode((_node, atts) => {
    if (!countryClusters[atts.country])
      countryClusters[atts.country] = { label: atts.country, positions: [] }
  })

  // create and assign one color by cluster
  const palette = iwanthue(Object.keys(countryClusters).length, { seed: 'eurSISCountryClusters' })
  for (const country in countryClusters) {
    countryClusters[country].color = palette.pop()
  }

  // change node appearance
  state.graph.forEachNode((node, atts) => {
    const cluster = countryClusters[atts.country]
    // node color depends on the cluster it belongs to
    atts.color = cluster.color
    // node size depends on its degree
    atts.size = Math.sqrt(state.graph.degree(node)) / 2
    // store cluster's nodes positions to calculate cluster label position
    cluster.positions.push({ x: atts.x, y: atts.y })
  })

  // calculate the cluster's nodes barycenter to use this as cluster label position
  for (const country in countryClusters) {
    countryClusters[country].x =
      countryClusters[country].positions.reduce((acc, p) => acc + p.x, 0) /
      countryClusters[country].positions.length
    countryClusters[country].y =
      countryClusters[country].positions.reduce((acc, p) => acc + p.y, 0) /
      countryClusters[country].positions.length
  }

  // initiate sigma
  state.sigmaInstance = new Sigma(state.graph, container.value!, {
    renderEdgeLabels: true,
    allowInvalidContainer: true,
    defaultEdgeColor: '#727171',
    defaultEdgeType: 'arrow',
    edgeLabelSize: 13,
    labelSize: 15
  })

// create the clustersLabel layer
  const clustersLayer = document.createElement('div')
  clustersLayer.id = 'clustersLayer'
  let clusterLabelsDoms = ''
  for (const country in countryClusters) {
    // for each cluster create a div label
    const cluster = countryClusters[country]
    // adapt the position to viewport coordinates
    const viewportPos = state.sigmaInstance.graphToViewport(cluster as Coordinates)
    clusterLabelsDoms += `<div id='${cluster.label}' class="clusterLabel" style="top:${viewportPos.y}px;left:${viewportPos.x}px;color:${cluster.color}">${cluster.label}</div>`
  }
  clustersLayer.innerHTML = clusterLabelsDoms
// insert the layer underneath the hovers layer
  container.value!.insertBefore(clustersLayer, document.getElementsByClassName('sigma-hovers')[0])

// Clusters labels position needs to be updated on each render
  state.sigmaInstance?.on('afterRender', () => {
    for (const country in countryClusters) {
      const cluster = countryClusters[country]
      const clusterLabel = document.getElementById(cluster.label)
      if (clusterLabel) {
        // update position from the viewport
        const viewportPos = state.sigmaInstance.graphToViewport(cluster as Coordinates)
        clusterLabel.style.top = `${viewportPos.y}px`
        clusterLabel.style.left = `${viewportPos.x}px`
      }
    }
  })
}


onMounted(initializeGraph)
//
</script>

<style scoped>
html,
body,
#storybook-root,
#sigma-container {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#clustersLayer {
  width: 100%;
  height: 100%;
  position: absolute;
}

.clusterLabel {
  position: absolute;
  transform: translate(-50%, -50%);
  font-family: sans-serif;
  font-variant: small-caps;
  font-weight: 400;
  font-size: 1.8rem;
  text-shadow: 2px 2px 1px white,
  -2px -2px 1px white,
  -2px 2px 1px white,
  2px -2px 1px white;
}
</style>
