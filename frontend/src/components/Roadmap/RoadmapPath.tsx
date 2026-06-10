'use client';

import React from 'react';

export interface PathNode {
  id: string;
  x: number; // percentage
  y: number; // pixels
  status: 'completed' | 'current' | 'locked';
}

interface RoadmapPathProps {
  nodes: PathNode[];
  width: number;
}

export const RoadmapPath: React.FC<RoadmapPathProps> = ({ nodes, width }) => {
  if (nodes.length < 2) return null;

  // Build individual curves between consecutive nodes in the predefined sequence
  const segments = nodes.slice(0, -1).map((startNode, index) => {
    const endNode = nodes[index + 1];
    
    // Convert percentage X to actual pixels
    const x1 = (startNode.x / 100) * width;
    const y1 = startNode.y;
    const x2 = (endNode.x / 100) * width;
    const y2 = endNode.y;

    const dy = Math.abs(y2 - y1);
    
    // Always use vertical tangents for a winding vertical river path (Duolingo style)
    const offset = dy * 0.5;
    const cp1x = x1;
    const cp1y = y1 + offset;
    const cp2x = x2;
    const cp2y = y2 - offset;

    const pathData = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

    // Determine segment status:
    // Completed: Both start and end are completed/current.
    // Active: From current/completed to locked.
    // Locked: Otherwise.
    let segmentStatus: 'completed' | 'active' | 'locked' = 'locked';
    
    if (startNode.status === 'completed' && endNode.status === 'completed') {
      segmentStatus = 'completed';
    } else if (startNode.status === 'completed' && endNode.status === 'current') {
      segmentStatus = 'completed';
    } else if (startNode.status === 'current' && endNode.status === 'locked') {
      segmentStatus = 'active';
    } else {
      segmentStatus = 'locked';
    }

    return {
      id: `${startNode.id}-${endNode.id}`,
      pathData,
      status: segmentStatus
    };
  });

  return (
    <svg 
      className="absolute top-0 left-0 pointer-events-none select-none z-15" 
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        {/* Glow Filters */}
        <filter id="path-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Gradients */}
        <linearGradient id="path-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* Draw Segments */}
      {segments.map((seg) => {
        if (seg.status === 'completed') {
          return (
            <g key={seg.id}>
              {/* Glow overlay */}
              <path
                d={seg.pathData}
                fill="none"
                stroke="#10B981"
                strokeWidth="8"
                className="opacity-30 blur-[4px]"
                filter="url(#path-glow)"
              />
              {/* Core dashed path */}
              <path
                d={seg.pathData}
                fill="none"
                stroke="url(#path-cyan)"
                strokeWidth="4"
                strokeDasharray="6 8"
                strokeLinecap="round"
              />
            </g>
          );
        }

        if (seg.status === 'active') {
          return (
            <g key={seg.id}>
              {/* Glow overlay */}
              <path
                d={seg.pathData}
                fill="none"
                stroke="#06B6D4"
                strokeWidth="10"
                className="opacity-40 blur-[5px]"
                filter="url(#path-glow)"
              />
              {/* Core active path (Flowing) */}
              <path
                d={seg.pathData}
                fill="none"
                stroke="#22D3EE"
                strokeWidth="4"
                strokeDasharray="8 8"
                strokeLinecap="round"
                className="animate-[roadDash_2s_linear_infinite]"
              />
            </g>
          );
        }

        // Locked Connection (Faint dashed path)
        return (
          <g key={seg.id}>
            <path
              d={seg.pathData}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2.5"
              strokeDasharray="4 8"
              strokeLinecap="round"
              className="opacity-35"
            />
          </g>
        );
      })}

      <style jsx global>{`
        @keyframes roadDash {
          to {
            stroke-dashoffset: -32;
          }
        }
      `}</style>
    </svg>
  );
};
