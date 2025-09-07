import React from 'react';
import { Dimensions } from 'react-native';
import Svg, { Path, G, Circle, Text } from 'react-native-svg';

// Simple test data - connections between 4 nodes
const SAMPLE_DATA = [
  { from: 0, to: 1, value: 1 }, // vodka to juice
  { from: 1, to: 2, value: 1 }, // juice to mixer
  { from: 0, to: 3, value: 1 }, // vodka to garnish
];

const NODES = [
  { name: 'Vodka', color: '#8B0000' },    // Dark red for alcohol
  { name: 'Juice', color: '#006400' },     // Dark green for non-alcoholic
  { name: 'Mixer', color: '#00008B' },     // Dark blue for mixers
  { name: 'Garnish', color: '#8B008B' },   // Purple for garnish
];

export function SimpleChordDiagram() {
  const width = Dimensions.get('window').width;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;

  // Calculate node positions in a circle
  const nodePositions = NODES.map((_, index) => {
    const angle = (index / NODES.length) * 2 * Math.PI - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      angle
    };
  });

  // Create Bezier curves between connected nodes
  const connections = SAMPLE_DATA.map(({ from, to }) => {
    const fromPos = nodePositions[from];
    const toPos = nodePositions[to];
    
    // Calculate control points for the curve
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;
    const controlX = midX + (centerY - midY) * 0.5;
    const controlY = midY - (centerX - midX) * 0.5;

    return `M ${fromPos.x} ${fromPos.y} Q ${controlX} ${controlY} ${toPos.x} ${toPos.y}`;
  });

  return (
    <Svg width={width} height={height}>
      {/* Draw connections */}
      {connections.map((path, index) => (
        <Path
          key={`connection-${index}`}
          d={path}
          stroke="#666"
          strokeWidth="2"
          fill="none"
          opacity={0.5}
        />
      ))}

      {/* Draw nodes */}
      {NODES.map((node, index) => {
        const pos = nodePositions[index];
        return (
          <G key={`node-${index}`}>
            <Circle
              cx={pos.x}
              cy={pos.y}
              r={30}
              fill={node.color}
              opacity={0.7}
            />
            <Text
              x={pos.x}
              y={pos.y}
              fill="white"
              fontSize="12"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {node.name}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
}
