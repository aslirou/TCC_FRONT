import React, {useEffect, useState} from 'react';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';

function ImageAnalysis() {
  const [classes, setClasses] = useState([]);
  const [data, setData] = useState({ nodes: [], links: [] });
  const [images, setImages] = useState({});
  const [imageSize, setImageSize] = useState(0);
  const [weight, setWeight] = useState(0);

  const btnStyle = {
    backgroundColor: '#FFFFFF',
    color: '#000000',
    borderRadius: '10px',
    border: '1px solid grey',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '10px 20px',
    margin: '20px 0',
    cursor: 'pointer'
  };
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

  const fetchAllImagesAndClasses = async () => {
    try {
      const response = await axios(`http://127.0.0.1:8000/get_all_images/`);
      if (response.data && Array.isArray(response.data)) {

        let classNodes = [];
        let imageNodes = new Map();

        for (const item of response.data) {
          const className = item.class_label;

          const classNode = {
            id: className,
            url: `/classes/${className}`,
            name: className,
          };

          if (!classNodes.find(n => n.id === className)) {
            classNodes.push(classNode);
          }

          const imagePath = item.img_path;

          const imageNode = {
            id: imagePath,
            url: `/images/${item.img_path}`,
          };

          if (!imageNodes.has(imageNode.id)) {
            imageNodes.set(imageNode.id, imageNode);
          }
        }

        const nodes = [...classNodes, ...Array.from(imageNodes.values())];

        const links = response.data.map(item => ({
          source: item.img_path,
          target: item.class_label,
        }));

        setData({nodes, links});
        setImageSize(Math.min(window.innerWidth, window.innerHeight) / (2 * Math.sqrt(nodes.length)));
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
          url: `/images/${node.img_path}`,
        }));

        const classNode = {
          id: class_label,
          url: `/classes/${class_label}`,
          name: class_label     // << Adiciona campo de nome que contém o valor do rótulo da classe
        };

        nodes.push(classNode);
        nodes.push(classNode);

        // Agora, todos os links apontam para o nó da classe, em vez de apontar de um nó da imagem para outro
        const links = nodes.map((node) => node.id !== classNode.id && {
          source: node.id,
          target: classNode.id,
        }).filter(Boolean);  // filter(Boolean) para ignorar o elemento indefinido que vem do próprio nó da classe

        setData({nodes, links});
        setImageSize(Math.min(window.innerWidth, window.innerHeight) / (2 * Math.sqrt(nodes.length)));
      }
    } catch (error) {
      console.error(error);
    }
  };
  const fetchEdgesByWeight = async () => {
    try {
      const result = await axios(`http://127.0.0.1:8000/get_all_edges_by_weight/?weight=${weight}`);
      if (result.data && Array.isArray(result.data)) {
        const nodes = [];
        const links = [];

        result.data.forEach(edge => {
          if (!nodes.find(node => node.id === edge.source)) {
            nodes.push({id: edge.source, url: `/images/${edge.source}`});
          }
          if (!nodes.find(node => node.id === edge.target)) {
            nodes.push({id: edge.target, url: `/images/${edge.target}`});
          }
          links.push({source: edge.source, target: edge.target, weight: edge.weight});
        });

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
      <div className="image-analysis" style={{ margin: '20px' }}>
        <div style={{ backgroundColor: '#123142', color: 'white', padding: '10px', textAlign: 'center' }}>
          <h1 className="title">Análise de imagens</h1>
        </div>
        <button style={btnStyle} onClick={fetchClasses}>Buscar classes</button>
        {classes.length > 0 && (
            <div>
              {classes.map((item, index) => (
                  <button style={btnStyle} key={index} onClick={() => fetchImagesByClass(item)}>{item}</button>
              ))}
            </div>
        )}
        <br/>
        <button style={btnStyle} onClick={fetchAllImagesAndClasses}>Buscar tudo</button>
        <br/>
        <button style={btnStyle} onClick={fetchEdgesByWeight}>Buscar arestas</button>
        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Peso"/>
        <ForceGraph2D
            graphData={data}
            linkDistance={(link) => 300 / link.weight}
            nodeCanvasObject={(node, ctx, globalScale) => {
              if (node.id in images) {
                const img = images[node.id];
                if (img) {
                  const size = imageSize / globalScale;
                  ctx.drawImage(img, node.x - size / 2, node.y - size / 2, size, size);
                }
              } else {
                const size = 30 / globalScale;
                ctx.beginPath();
                ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                ctx.fillStyle = 'blue';
                ctx.fill();
              }
            }}
        />
      </div>
  );
}


export default ImageAnalysis;