import FileSaver from "file-saver";
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
  renderEdgeLabels: true,
  nodeReducer: (node, data) => {
    return {...data, size: data.hidden ? 0 : data.size};
  }
});

// 스크린 샷 설정
function saveAsPNG( inputLayers = [] ) {
  const {width, height} = sigmaInstance.getDimensions();
  const pixelRatio = window.devicePixelRatio || 1;

  const tmpRoot = document.createElement("DIV");
  tmpRoot.setAttribute("class", "hoho")
  tmpRoot.style.width = `${width}px`;
  tmpRoot.style.height = `${height}px`;
  tmpRoot.style.position = "absolute";
  tmpRoot.style.right = "101%";
  tmpRoot.style.bottom = "101%";
  document.body.appendChild(tmpRoot);

// Instantiate sigma:
  const tmpRenderer = new Sigma(sigmaInstance.getGraph(), tmpRoot, sigmaInstance.getSettings());

// Copy camera and force to render now, to avoid having to wait the schedule /
// debounce frame:
  tmpRenderer.getCamera().setState(sigmaInstance.getCamera().getState());
  tmpRenderer.refresh();

// Create a new canvas, on which the different layers will be drawn:
  const canvas = document.createElement("CANVAS");
  canvas.setAttribute("width", width * pixelRatio + "");
  canvas.setAttribute("height", height * pixelRatio + "");
  const ctx = canvas.getContext("2d");

// Draw a white background first:
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width * pixelRatio, height * pixelRatio);

// For each layer, draw it on our canvas:
  const canvases = tmpRenderer.getCanvases();
  const layers = inputLayers ? inputLayers.filter((id) => !!canvases[id]) : Object.keys(canvases);
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
        height * pixelRatio,
    );
  });

// Save the canvas as a PNG image:
  canvas.toBlob((blob) => {
    if (blob) FileSaver.saveAs(blob, "graph.png");

    // Cleanup:
    tmpRenderer.kill();
    tmpRoot.remove();
  }, "image/png");
}

document.getElementById("save-as-png").addEventListener("click", () => {
  const layers = ["edges", "nodes", "edgeLabels", "labels"].filter(
      (id) => !!(document.getElementById(`layer-${id}`)).checked,
  );

  saveAsPNG(layers);
});

// 노드 검색
document.getElementById('searchButton').addEventListener('click', function (e) {
  let searchValue = document.getElementById('search').value.toLowerCase();
  graph.nodes().forEach(node => {
    const data = graph.getNodeAttributes(node);
    graph.setNodeAttribute(node, 'hidden', data.label.toLowerCase().indexOf(searchValue) === -1);
  });
  sigmaInstance.refresh();
})

// 노드 초기화
document.getElementById('resetButton').addEventListener('click', function (e) {
  graph.nodes().forEach(node => {
    const data = graph.getNodeAttributes(node);
    graph.setNodeAttribute(node, 'hidden', false);
  });
  sigmaInstance.refresh();
})

// Half 조건 필터
document.getElementById('filter').addEventListener('change', function (e) {
  const isChecked = e.target.checked;
  graph.nodes().forEach(node => {
    graph.setNodeAttribute(node, 'hidden', isChecked && Math.random() > 0.5);
  });
  sigmaInstance.refresh();
});

// 노드 오버시 사이즈 확대
sigmaInstance.on('enterNode', ({node}) => {
  const {label, x, y} = sigmaInstance.graph.getNodeAttributes(node);
  sigmaInstance.graph.setNodeAttribute(node, 'size', 15);
});

// 노드 리브시 사이드 복원
sigmaInstance.on('leaveNode', ({node}) => {
  const {originalSize} = sigmaInstance.graph.getNodeAttributes(node);
  sigmaInstance.graph.setNodeAttribute(node, 'size', originalSize);
});

// 확대 축소 기능
document.getElementById('zoomIn').addEventListener('click', () => {
  sigmaInstance.getCamera().animatedZoom({duration: 400});
});

document.getElementById('zoomOut').addEventListener('click', () => {
  sigmaInstance.getCamera().animatedUnzoom({duration: 400});
});
