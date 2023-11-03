import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Graph } from 'react-d3-graph';
import * as d3 from 'd3';

function ImageAnalysis() {
  const [data, setData] = useState({ nodes: [], links: [] });
  const graphContainer = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const path = 'C:\\Users\\aslir\\Documents\\Faculdade\\TCC\\front\\image-analysis\\public\\images';
        const result = await axios(`http://127.0.0.1:8000/analyze_images/?folder_path=${path}`);

        const nodes = result.data.nodes.map(node => ({
          id: node.id,
          symbolType: 'image',
          url: `/images/${node.id}`,
          size: 400,
        }));
        const links = result.data.edges.map(edge => ({
          source: edge.source,
          target: edge.target,
          color: 'black',
        }));

        setData({ nodes, links });
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (graphContainer.current) {
      d3.select(graphContainer.current)
          .select('#graph-id')
          .attr('pointer-events', 'all')
          .call(d3.zoom().scaleExtent([0.1, 2]));
    }
  }, [graphContainer]);

  const myConfig = {
    nodeHighlightBehavior: true,
    node: {
      color: 'lightgray',
      size: 800,
      highlightStrokeColor: 'blue',
      renderLabel: false,
      viewGenerator: node => <img src={node.url} alt={node.id} style={{ height: "100px", width: "100px" }}/>
    },
    link: {
      highlightColor: 'lightblue',
    },
    d3: {
      gravity: -400,
    },
    width: window.innerWidth * 0.8,
    height: window.innerHeight - 200
  };

  return (
      <div className="image-analysis">
        <h1 className="title">Análise de imagens</h1>
        <div ref={graphContainer}>
          <Graph id="graph-id" data={data} config={myConfig} />
        </div>
      </div>
  );
}

export default ImageAnalysis;