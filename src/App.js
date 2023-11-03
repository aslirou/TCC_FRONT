import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';

function ImageAnalysis() {
  const [classes, setClasses] = useState([]);
  const [data, setData] = useState({ nodes: [], links: [] });
  const [images, setImages] = useState({});
  const [imageSize, setImageSize] = useState(0);

  const fetchClasses = async () => {
    try {
      const result = await axios('http://127.0.0.1:8000/get_distinct_classes/');
      if (result.data && Array.isArray(result.data)) {
        setClasses(result.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchImagesByClass = async (class_label) => {
    try {
      const result = await axios(`http://127.0.0.1:8000/get_images_by_class/?class_label=${class_label}`);
      if (result.data && Array.isArray(result.data)) {
        const nodes = result.data.map((node) => ({
          id: node.id,
          url: `/images/${node.id}`, // Modify this with actual path of images
        }));
        const links = nodes.map((node, i) => ({
          source: node.id,
          target: nodes[(i + 1) % nodes.length].id,
        }));

        setData({ nodes, links });
        setImageSize(Math.min(window.innerWidth, window.innerHeight) / (2 * Math.sqrt(nodes.length)));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    data.nodes.forEach((node) => {
      if (!images[node.id]) {
        const img = new Image();
        img.src = node.url;
        img.onload = () => setImages((images) => ({ ...images, [node.id]: img }));
      }
    });
  }, [data]);

  return (
      <div className="image-analysis">
        <h1 className="title">Análise de imagens</h1>
        <button onClick={fetchClasses}>Buscar classes</button>
        {classes.length > 0 && (
            <div>
              {classes.map((item, index) => (
                  <button key={index} onClick={() => fetchImagesByClass(item)}>{item}</button>
              ))}
            </div>
        )}
        <ForceGraph2D
            graphData={data}
            linkDistance={300} // Aumente para ocupar mais espaço
            nodeCanvasObject={(node, ctx, globalScale) => {
              const img = images[node.id];
              if (img) {
                const size = imageSize / globalScale;
                ctx.drawImage(img, node.x - size / 2, node.y - size / 2, size, size);
              }
            }}
        />
      </div>
  );
}

export default ImageAnalysis;