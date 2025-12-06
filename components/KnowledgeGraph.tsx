import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphData } from '../types';

interface KnowledgeGraphProps {
  data: GraphData;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Defensive check for data integrity
    if (!svgRef.current || !data || !Array.isArray(data.nodes) || data.nodes.length === 0) return;

    const width = 800;
    const height = 500;
    
    // Pharma Strategy palette
    const colors = {
        1: '#0d9488', // Drug/Product: Teal
        2: '#6366f1', // Company: Indigo
        3: '#ef4444', // Disease: Red
        4: '#f59e0b', // Patent/Trial: Amber
    };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    // Safe mapping and validation
    // 1. Create nodes array
    const nodes = (data.nodes || []).map(d => ({ ...d }));
    
    // 2. Create a Set of valid Node IDs for O(1) lookup
    const nodeIds = new Set(nodes.map((n: any) => n.id));

    // 3. Filter links to ensure both source and target exist in the node list
    const links = (data.links || [])
        .filter((l: any) => nodeIds.has(l.source) && nodeIds.has(l.target))
        .map(d => ({ ...d }));

    // Create a group for zoomable content
    const g = svg.append("g");

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(30));

    // Links
    const link = g.append("g")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-opacity", 0.8)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5);

    // Arrow markers
    svg.append("defs").selectAll("marker")
        .data(["end"])
        .enter().append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 18) 
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", "#cbd5e1")
        .attr("d", "M0,-5L10,0L0,5");

    link.attr("marker-end", "url(#arrow)");

    // Nodes
    const nodeGroup = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(drag(simulation) as any);

    nodeGroup.append("circle")
      .attr("r", 10)
      .attr("fill", (d: any) => (colors as any)[d.group] || '#94a3b8')
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("class", "shadow-sm cursor-grab active:cursor-grabbing");

    // Labels
    nodeGroup.append("text")
      .text((d: any) => d.label)
      .attr("font-size", "11px")
      .attr("font-family", "Inter, sans-serif")
      .attr("font-weight", "500")
      .attr("dx", 14)
      .attr("dy", 4)
      .attr("fill", "#1e293b")
      .style("pointer-events", "none")
      .call(getBBox);

    // Add background rect to text for readability (optional simplified version)
    function getBBox(selection: any) {
        selection.each(function(this: any) {
            // Placeholder for bounding box logic if needed
        });
    }

    // Link Relation Labels
    const linkLabels = g.append("g")
        .selectAll("text")
        .data(links)
        .join("text")
        .text((d: any) => d.relation)
        .attr("font-size", "9px")
        .attr("font-family", "Inter, sans-serif")
        .attr("fill", "#64748b")
        .attr("text-anchor", "middle")
        .attr("dy", -3);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);

      linkLabels
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);
    });

    // Zoom and Pan functionality
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

  }, [data]);

  if (!data || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
              <p>No knowledge graph data extracted.</p>
          </div>
      );
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
       <div className="flex-1 overflow-hidden flex items-center justify-center relative">
         <svg ref={svgRef} viewBox="0 0 800 500" className="w-full h-full" preserveAspectRatio="xMidYMid meet"></svg>
         
         <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-lg border border-slate-200 shadow-sm text-xs space-y-2 backdrop-blur-sm">
            <div className="font-semibold text-slate-800 mb-1">Graph Legend</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> Drug/Product</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Company/Sponsor</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Disease/Indication</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Patent/Trial</div>
         </div>

         <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded-lg border border-slate-200 shadow-sm text-xs backdrop-blur-sm text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">Controls</div>
            <div>Scroll to zoom</div>
            <div>Drag to pan</div>
            <div>Click & drag nodes to move</div>
         </div>
       </div>
    </div>
  );
};

export default KnowledgeGraph;