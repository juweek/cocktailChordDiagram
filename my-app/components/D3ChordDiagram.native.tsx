import React, { useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { chord, ribbon } from 'd3-chord';
import { arc } from 'd3-shape';
import { descending } from 'd3-array';

interface D3ChordDiagramProps {
  data: {
    matrix: number[][];
    names: string[];
    colors: string[];
  };
  selectedIngredient?: string;
}

export function D3ChordDiagram({ data, selectedIngredient }: D3ChordDiagramProps) {
  const { width: windowWidth } = Dimensions.get('window');
  
  // Set dimensions
  const width = windowWidth;
  const height = 500;
  const outerRadius = Math.min(width, height) * 0.4;
  const innerRadius = outerRadius * 0.9;

  // Calculate the chord layout
  const chordLayout = useMemo(() => {
    console.log('Calculating chord layout');
    try {
      const chordGen = chord()
        .padAngle(0.05)
        .sortSubgroups(descending);
      
      return chordGen(data.matrix);
    } catch (error) {
      console.error('Error calculating chord layout:', error);
      return null;
    }
  }, [data.matrix]);

  // Generate arc paths
  const arcGenerator = arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

  // Generate ribbon paths
  const ribbonGenerator = ribbon()
    .radius(innerRadius);

  if (!chordLayout) {
    return null;
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={width} height={height}>
        <G x={width / 2} y={height / 2}>
          {/* Draw the outer arcs */}
          {chordLayout.groups.map((group, i) => {
            const path = arcGenerator(group);
            const angle = (group.startAngle + group.endAngle) / 2;
            const labelRadius = outerRadius + 20;
            const labelX = Math.cos(angle - Math.PI / 2) * labelRadius;
            const labelY = Math.sin(angle - Math.PI / 2) * labelRadius;
            
            return (
              <G key={`group-${i}`}>
                <Path
                  d={path || ''}
                  fill={data.colors[i]}
                  stroke="none"
                />
                <SvgText
                  x={labelX}
                  y={labelY}
                  fill="#000"
                  fontSize="12"
                  textAnchor={angle > Math.PI ? 'end' : 'start'}
                  alignmentBaseline="middle"
                >
                  {data.names[i]}
                </SvgText>
              </G>
            );
          })}

          {/* Draw the chords */}
          {chordLayout.map((chord, i) => {
            const path = ribbonGenerator(chord);
            const opacity = selectedIngredient
              ? (data.names[chord.source.index] === selectedIngredient ||
                 data.names[chord.target.index] === selectedIngredient)
                ? 0.8
                : 0.1
              : 0.6;

            return (
              <Path
                key={`chord-${i}`}
                d={path || ''}
                fill={data.colors[chord.source.index]}
                fillOpacity={opacity}
                stroke="#000"
                strokeOpacity={0.2}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}