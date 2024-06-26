document.addEventListener('DOMContentLoaded', function() {
  var cy = cytoscape({
    container: document.getElementById('cy'),

    elements: generateElements(3000),

    // 노드와 엣지 스타일 설정
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#666',
          'label': 'data(id)',
          'width': 'mapData(weight, 0, 10, 10, 40)',
          'height': 'mapData(weight, 0, 10, 10, 40)'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 1,
          'line-color': '#ccc'
        }
      },
      {
        selector: ':selected',
        style: {
          'background-color': 'blue',
          'line-color': 'blue'
        }
      }
    ],

    layout: {
      name: 'random'
    }
  });

  // 노드 갯수, id 지정
  function generateElements(count) {
    let elements = [];
    for (let i = 0; i < count; i++) {
      elements.push({ data: { id: 'node' + i, weight: Math.round(Math.random() * 10) } });
      if (i > 0 && Math.random() > 0.5) {
        elements.push({ data: { source: 'node' + (i - 1), target: 'node' + i } });
      }
    }
    return elements;
  }

  // 노드 검색
  document.getElementById('search').addEventListener('keyup', function(e) {
    var query = e.target.value.toLowerCase();
    cy.nodes().forEach(node => {
      node.style('display', node.data('id').toLowerCase().includes(query) ? 'element' : 'none');
    });
  });

  // 노드 갯수 Half 만 보여주도록 필터
  document.getElementById('filter').addEventListener('change', function(e) {
    var isChecked = e.target.checked;
    cy.nodes().forEach(node => {
      if (isChecked && Math.random() > 0.5) {
        node.style('display', 'none');
      } else {
        node.style('display', 'element');
      }
    });
  });

  // 마우스 오버
  cy.on('mouseover', 'node', function(event) {
    var node = event.target;
    document.getElementById('tooltip').textContent = 'Node: ' + node.data('id');
    document.getElementById('tooltip').style.display = 'block';
    document.getElementById('tooltip').style.top = event.renderedPosition.y + 20 + 'px';
    document.getElementById('tooltip').style.left = event.renderedPosition.x + 20 + 'px';
  });

  // 마우스 아웃
  cy.on('mouseout', 'node', function(event) {
    document.getElementById('tooltip').style.display = 'none';
  });

  // 줌 인 줌 아웃
  document.getElementById('zoomIn').addEventListener('click', function() {
    cy.zoom(cy.zoom() * 1.2);
  });

  document.getElementById('zoomOut').addEventListener('click', function() {
    cy.zoom(cy.zoom() / 1.2);
  });
});
