import Sigma from 'sigma';
import Graph from 'graphology';

const graph = new Graph();
const container = document.getElementById('container');

// Generate nodes and edges
for (let i = 0; i < 3000; i++) {
  graph.addNode(i.toString(), {
    label: 'Node ' + i,
    x: Math.random(),
    y: Math.random(),
    size: 10,
    color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    originalSize: 10
  });

  if (i > 0 && Math.random() > 0.8) {
    graph.addEdge(i.toString(), (i - 1).toString());
  }
}

const sigmaInstance = new Sigma(graph, container, {
  renderEdgeLabels: false,
  nodeReducer: (node, data) => {
    return {...data, size: data.hidden ? 0 : data.size};
  }
});

document.getElementById('searchButton').addEventListener('click', function(e) {
  let searchValue = document.getElementById('search').value.toLowerCase();
  graph.nodes().forEach(node => {
    const data = graph.getNodeAttributes(node);
    graph.setNodeAttribute(node, 'hidden', data.label.toLowerCase().indexOf(searchValue) === -1);
  });
  sigmaInstance.refresh();
})

document.getElementById('resetButton').addEventListener('click', function(e) {
  graph.nodes().forEach(node => {
    const data = graph.getNodeAttributes(node);
    graph.setNodeAttribute(node, 'hidden', false);
  });
  sigmaInstance.refresh();
})

document.getElementById('filter').addEventListener('change', function(e) {
  const isChecked = e.target.checked;
  graph.nodes().forEach(node => {
    graph.setNodeAttribute(node, 'hidden', isChecked && Math.random() > 0.5);
  });
  sigmaInstance.refresh();
});

sigmaInstance.on('enterNode', ({node}) => {
  const {label, x, y} = sigmaInstance.graph.getNodeAttributes(node);
  sigmaInstance.graph.setNodeAttribute(node, 'size', 15);
});

sigmaInstance.on('leaveNode', ({node}) => {
  const {originalSize} = sigmaInstance.graph.getNodeAttributes(node);
  sigmaInstance.graph.setNodeAttribute(node, 'size', originalSize);
});

document.getElementById('zoomIn').addEventListener('click', () => {
  sigmaInstance.getCamera().animatedZoom({duration: 400});
});

document.getElementById('zoomOut').addEventListener('click', () => {
  sigmaInstance.getCamera().animatedUnzoom({duration: 400});
});
