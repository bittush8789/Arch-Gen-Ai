import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ArchitectureJSON } from '../lib/gemini';

interface Props {
  data: ArchitectureJSON;
}

export const Architecture2D: React.FC<Props> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const width = 800;
    const height = 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const nodes = [
      ...data.services.map(s => ({ id: s.name, group: 'service', type: s.type })),
      ...data.databases.map(d => ({ id: d.name, group: 'database', type: d.type })),
      ...data.apis.map(a => ({ id: a.name, group: 'api', type: a.method }))
    ];

    const links = data.flows.map(f => ({
      source: f.from,
      target: f.to,
      label: f.label
    })).filter(l => nodes.find(n => n.id === l.source) && nodes.find(n => n.id === l.target));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const g = svg.append("g");

    // Arrow markers
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#999")
      .style("stroke", "none");

    const link = g.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)");

    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", (d: any) => d.group === 'service' ? 25 : 20)
      .attr("fill", (d: any) => {
        if (d.group === 'service') return "#3b82f6";
        if (d.group === 'database') return "#ef4444";
        return "#10b981";
      });

    node.append("text")
      .text((d: any) => d.id)
      .attr("x", 0)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#374151")
      .attr("font-weight", "bold");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

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

    // Zoom
    svg.call(d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 8])
      .on("zoom", ({ transform }) => {
        g.attr("transform", transform);
      }));

  }, [data]);

  return (
    <div className="w-full h-[600px] bg-white rounded-xl border border-gray-200 overflow-hidden relative">
      <div className="absolute top-4 left-4 flex gap-4 text-xs">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500" /> Service</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /> Database</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500" /> API</div>
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-move" viewBox="0 0 800 600" />
    </div>
  );
};
