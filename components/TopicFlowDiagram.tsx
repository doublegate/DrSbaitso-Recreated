/**
 * Topic Flow Diagram Component (v1.11.0 - Option C3)
 *
 * D3.js-powered visualization of conversation topics and their transitions.
 * Shows topic clusters, dominant topics, and conversation flow.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  analyzeTopics,
  getTopicColor,
  formatTopicName,
  type ConversationAnalysis,
  type Topic
} from '@/utils/topicAnalysis';

interface TopicFlowDiagramProps {
  messages: Array<{ author: string; text: string }>;
  theme?: {
    colors: {
      background: string;
      text: string;
      border: string;
      accent: string;
    };
  };
}

export function TopicFlowDiagram({
  messages,
  theme
}: TopicFlowDiagramProps): JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);
  const [analysis, setAnalysis] = useState<ConversationAnalysis | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Analyze topics when messages change
  useEffect(() => {
    const result = analyzeTopics(messages);
    setAnalysis(result);
  }, [messages]);

  // Draw D3 visualization
  useEffect(() => {
    if (!svgRef.current || !analysis || analysis.topics.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = 600;
    const height = 400;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create force simulation
    const nodes = analysis.topics.map(topic => ({
      id: topic.id,
      name: formatTopicName(topic.id),
      frequency: topic.frequency,
      sentiment: topic.sentiment,
      radius: Math.sqrt(topic.frequency) * 8 + 10
    }));

    const links = analysis.transitions.map(t => ({
      source: t.from,
      target: t.to,
      count: t.count
    }));

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(80)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 5));

    // Create arrow markers
    svg.append('defs').selectAll('marker')
      .data(['arrow'])
      .enter().append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', theme?.colors.border || '#666');

    // Draw links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', theme?.colors.border || '#666')
      .attr('stroke-width', (d: any) => Math.sqrt(d.count) * 0.5 + 1)
      .attr('stroke-opacity', 0.4)
      .attr('marker-end', 'url(#arrow)');

    // Draw nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('cursor', 'pointer')
      .on('click', (event, d: any) => {
        const topic = analysis.topics.find(t => t.id === d.id);
        setSelectedTopic(topic || null);
      })
      .call(d3.drag<any, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Add circles
    node.append('circle')
      .attr('r', (d: any) => d.radius)
      .attr('fill', (d: any) => getTopicColor(d.id, d.sentiment))
      .attr('stroke', theme?.colors.text || '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.8)
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 1).attr('stroke-width', 3);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8).attr('stroke-width', 2);
      });

    // Add labels
    node.append('text')
      .text((d: any) => d.name.length > 12 ? d.name.substring(0, 10) + '...' : d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', theme?.colors.text || '#fff')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none');

    // Add frequency badge
    node.append('circle')
      .attr('cx', (d: any) => d.radius * 0.6)
      .attr('cy', (d: any) => -d.radius * 0.6)
      .attr('r', 10)
      .attr('fill', theme?.colors.accent || '#fbbf24')
      .attr('stroke', theme?.colors.background || '#1e3a8a')
      .attr('stroke-width', 2);

    node.append('text')
      .attr('x', (d: any) => d.radius * 0.6)
      .attr('y', (d: any) => -d.radius * 0.6)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', theme?.colors.background || '#1e3a8a')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text((d: any) => d.frequency);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [analysis, theme]);

  if (!analysis || analysis.topics.length === 0) {
    return (
      <div
        className="p-4 border-2 rounded"
        style={{
          borderColor: theme?.colors.border || '#4b5563',
          backgroundColor: theme?.colors.background || '#1e3a8a'
        }}
      >
        <p className="text-sm" style={{ color: theme?.colors.text || '#ffffff' }}>
          Have a conversation to see topic flow analysis
        </p>
      </div>
    );
  }

  return (
    <div
      className="topic-flow-diagram p-4 border-2 rounded"
      style={{
        borderColor: theme?.colors.border || '#4b5563',
        backgroundColor: theme?.colors.background || '#1e3a8a'
      }}
    >
      <h3 className="text-lg font-bold mb-3" style={{ color: theme?.colors.text || '#ffffff' }}>
        🔀 Topic Flow Diagram
      </h3>

      {/* Statistics */}
      <div className="mb-4 grid grid-cols-3 gap-2 text-xs">
        <div className="p-2 border rounded" style={{ borderColor: theme?.colors.border }}>
          <p className="text-gray-400">Topics</p>
          <p className="text-xl font-bold" style={{ color: theme?.colors.text }}>
            {analysis.topics.length}
          </p>
        </div>
        <div className="p-2 border rounded" style={{ borderColor: theme?.colors.border }}>
          <p className="text-gray-400">Transitions</p>
          <p className="text-xl font-bold" style={{ color: theme?.colors.text }}>
            {analysis.transitions.length}
          </p>
        </div>
        <div className="p-2 border rounded" style={{ borderColor: theme?.colors.border }}>
          <p className="text-gray-400">Diversity</p>
          <p className="text-xl font-bold" style={{ color: theme?.colors.text }}>
            {(analysis.topicDiversity * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* D3 Visualization */}
      <div className="border rounded p-2 mb-4" style={{
        borderColor: theme?.colors.border,
        backgroundColor: theme?.colors.background,
        overflow: 'hidden'
      }}>
        <svg
          ref={svgRef}
          width="100%"
          height="400"
          viewBox="0 0 600 400"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxWidth: '100%' }}
        />
      </div>

      {/* Legend */}
      <div className="mb-3">
        <p className="text-xs font-bold mb-2" style={{ color: theme?.colors.text }}>
          Legend:
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            <span style={{ color: theme?.colors.text }}>Positive</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
            <span style={{ color: theme?.colors.text }}>Neutral</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            <span style={{ color: theme?.colors.text }}>Negative</span>
          </div>
        </div>
      </div>

      {/* Topic Details */}
      {selectedTopic && (
        <div
          className="p-3 border rounded"
          style={{
            borderColor: getTopicColor(selectedTopic.id, selectedTopic.sentiment),
            backgroundColor: `${getTopicColor(selectedTopic.id, selectedTopic.sentiment)}22`
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold capitalize" style={{ color: theme?.colors.text }}>
              {formatTopicName(selectedTopic.id)}
            </h4>
            <button
              onClick={() => setSelectedTopic(null)}
              className="text-sm px-2 py-1 border rounded hover:bg-opacity-20"
              style={{ borderColor: theme?.colors.border, color: theme?.colors.text }}
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 text-xs" style={{ color: theme?.colors.text }}>
            <p>Frequency: {selectedTopic.frequency} mentions</p>
            <p>Sentiment: <span className="capitalize">{selectedTopic.sentiment}</span></p>
            <p>Keywords: {selectedTopic.keywords.slice(0, 5).join(', ')}</p>
            <p>First mentioned: Message #{selectedTopic.firstMention + 1}</p>
            <p>Last mentioned: Message #{selectedTopic.lastMention + 1}</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs mt-3 text-gray-400">
        💡 Click nodes for details • Drag to rearrange • Node size = frequency
      </p>
    </div>
  );
}

export default TopicFlowDiagram;
