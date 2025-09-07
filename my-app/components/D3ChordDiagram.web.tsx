import React, { useEffect, useRef } from 'react';
import { View, Dimensions } from 'react-native';
import { chord, ribbon } from 'd3-chord';
import { select } from 'd3-selection';
import { descending } from 'd3-array';
import { arc } from 'd3-shape';

interface D3ChordDiagramProps {
  data: {
    matrix: number[][];
    names: string[];
    colors: string[];
  };
  selectedIngredient?: string;
}

export function D3ChordDiagram({ data, selectedIngredient }: D3ChordDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { width: windowWidth } = Dimensions.get('window');
  
  // Set dimensions
  const width = windowWidth;
  const height = 500;
  const outerRadius = Math.min(width, height) * 0.4;
  const innerRadius = outerRadius * 0.9;

  useEffect(() => {
    console.log('Initializing D3 chord diagram');
    console.log('Data:', data);
    
    if (!svgRef.current || !data.matrix) return;

    // Clear existing content
    select(svgRef.current).selectAll('*').remove();

    try {
      // Create SVG
      const svg = select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      // Create chord layout
      const chordLayout = chord()
        .padAngle(0.05)
        .sortSubgroups(descending);

      console.log('Creating chord with matrix:', data.matrix);
      const chordData = chordLayout(data.matrix);
      console.log('Chord data created:', chordData);

      // Create arc generator
      const arcGenerator = arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

      // Draw the outer arcs
      svg.append('g')
        .selectAll('path')
        .data(chordData.groups)
        .join('path')
        .attr('fill', (d) => data.colors[d.index])
        .attr('d', arcGenerator as any);

      // Add labels
      svg.append('g')
        .selectAll('text')
        .data(chordData.groups)
        .join('text')
        .each((d, i, nodes) => {
          const angle = (d.startAngle + d.endAngle) / 2;
          const radius = outerRadius + 10;
          const x = Math.cos(angle - Math.PI / 2) * radius;
          const y = Math.sin(angle - Math.PI / 2) * radius;
          
          select(nodes[i])
            .attr('transform', `translate(${x},${y})`)
            .attr('text-anchor', angle > Math.PI ? 'end' : 'start')
            .attr('dominant-baseline', 'middle')
            .text(data.names[i]);
        });

      // Create ribbon generator
      const ribbonGenerator = ribbon()
        .radius(innerRadius);

      // Draw the chords
      svg.append('g')
        .selectAll('path')
        .data(chordData)
        .join('path')
        .attr('d', ribbonGenerator as any)
        .attr('fill', d => data.colors[d.source.index])
        .attr('opacity', d => {
          if (!selectedIngredient) return 0.6;
          return (data.names[d.source.index] === selectedIngredient ||
                  data.names[d.target.index] === selectedIngredient) ? 0.8 : 0.1;
        })
        .attr('stroke', '#000')
        .attr('stroke-opacity', 0.2);

    } catch (error) {
      console.error('Error creating chord diagram:', error);
    }
  }, [data, selectedIngredient, width, height]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 500,
          backgroundColor: 'transparent',
        }}
      />
    </View>
  );
}