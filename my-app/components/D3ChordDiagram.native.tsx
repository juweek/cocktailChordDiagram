import React, { useMemo, memo } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import Svg, { Path, G, Text } from 'react-native-svg';
import { chord, ribbon } from 'd3-chord';
import { arc } from 'd3-shape';
import { descending } from 'd3-array';
import { INGREDIENT_MATRIX } from '@/data/ingredientMatrix';
import { CATEGORY_COLORS } from '@/constants/Ingredients';

interface D3ChordDiagramProps {
  selectedIngredient?: string | null;
}

// Memoized chord component with significance threshold
const ChordRibbon = memo(({ d, colors, isSelected, selectedIngredient, value }: any) => {
  // Only render significant connections
  const threshold = selectedIngredient ? 0 : 2; // Show all connections for selected ingredient
  if (value < threshold) return null;

  return (
    <Path
      d={d}
      fill={colors[0]}
      fillOpacity={isSelected ? 0.9 : (selectedIngredient ? 0.1 : 0.4)}
      stroke={colors[0]}
      strokeWidth={isSelected ? 2 : 0.5}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return prevProps.isSelected === nextProps.isSelected &&
         prevProps.selectedIngredient === nextProps.selectedIngredient &&
         prevProps.d === nextProps.d;
});

export function D3ChordDiagram({ selectedIngredient }: D3ChordDiagramProps) {
  const { width: windowWidth } = Dimensions.get('window');
  const { matrix, ingredients, colors } = INGREDIENT_MATRIX;
  
  // Adjust dimensions based on device
  const width = windowWidth;
  const height = Platform.select({ ios: 400, android: 400, default: 500 }); // Smaller height for mobile
  const outerRadius = Math.min(width, height) * 0.35; // Slightly smaller radius
  const innerRadius = outerRadius * 0.9;
  const categoryArcWidth = 30; // Smaller category arc width

  // Memoize and optimize matrix calculations
  const { chordData, categoryArcs } = useMemo(() => {
    // Simplify matrix for mobile (reduce number of connections)
    const mobileMatrix = matrix.map(row => 
      row.map(value => value > 0 ? Math.ceil(value / 2) : 0)
    );

    // Create chord layout
    const chordLayout = chord()
      .padAngle(0.04) // Slightly larger padding
      .sortSubgroups(descending);

    const chordData = chordLayout(mobileMatrix);

    // Group ingredients by category
    const categoryGroups: { [key: string]: number[] } = {};
    ingredients.forEach((ingredient, index) => {
      const category = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
        colors[index] === color
      )?.[0] || 'other';
      
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(index);
    });

    // Calculate angles for each category
    const totalIngredients = ingredients.length;
    let currentAngle = -Math.PI / 2;
    
    const categoryArcs = Object.entries(categoryGroups).map(([category, indices]) => {
      const angleSize = (2 * Math.PI * indices.length) / totalIngredients;
      const arc = {
        category,
        color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
        startAngle: currentAngle,
        endAngle: currentAngle + angleSize,
        midAngle: currentAngle + angleSize / 2,
        indices
      };
      currentAngle += angleSize;
      return arc;
    });

    return { chordData, categoryArcs };
  }, [matrix, ingredients, colors]);

  // Memoize path generators
  const generators = useMemo(() => {
    const arcGenerator = arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ribbonGenerator = ribbon()
      .radius(innerRadius);

    const categoryArcGenerator = arc()
      .innerRadius(outerRadius + 5)
      .outerRadius(outerRadius + categoryArcWidth);

    return { arcGenerator, ribbonGenerator, categoryArcGenerator };
  }, [innerRadius, outerRadius, categoryArcWidth]);

  // Center point for the diagram
  const centerX = width / 2;
  const centerY = height / 2;

  // Only render visible chords
  const visibleChords = useMemo(() => {
    return chordData.filter(d => {
      if (selectedIngredient) {
        return ingredients[d.source.index].toLowerCase() === selectedIngredient.toLowerCase() ||
               ingredients[d.target.index].toLowerCase() === selectedIngredient.toLowerCase();
      }
      // For non-selected state, only show stronger connections
      return d.source.value > 1 || d.target.value > 1;
    });
  }, [chordData, selectedIngredient]);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <G transform={`translate(${centerX},${centerY})`}>
          {/* Draw category arcs */}
          {categoryArcs.map((categoryArc, i) => {
            const isHighlighted = selectedIngredient && 
              categoryArc.indices.some(idx => ingredients[idx].toLowerCase() === selectedIngredient.toLowerCase());
            
            // Calculate label position
            const labelRadius = outerRadius + categoryArcWidth + 15;
            const labelX = Math.cos(categoryArc.midAngle) * labelRadius;
            const labelY = Math.sin(categoryArc.midAngle) * labelRadius;
            
            return (
              <G key={`category-${i}`}>
                <Path
                  d={generators.categoryArcGenerator({
                    startAngle: categoryArc.startAngle,
                    endAngle: categoryArc.endAngle
                  } as any)}
                  fill={categoryArc.color}
                  fillOpacity={isHighlighted ? 0.6 : 0.3}
                  stroke={categoryArc.color}
                  strokeWidth={isHighlighted ? 2 : 1}
                />
                <Text
                  x={labelX}
                  y={labelY}
                  fill="#333"
                  fontSize={10} // Smaller font size
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  rotation={(categoryArc.midAngle * 180 / Math.PI) + (categoryArc.midAngle > Math.PI / 2 && categoryArc.midAngle < 3 * Math.PI / 2 ? 180 : 0)}
                >
                  {categoryArc.category.charAt(0).toUpperCase() + categoryArc.category.slice(1)}
                </Text>
              </G>
            );
          })}

          {/* Draw only visible chords */}
          {visibleChords.map((d, i) => {
            const isSelected = selectedIngredient && 
              (ingredients[d.source.index].toLowerCase() === selectedIngredient.toLowerCase() ||
               ingredients[d.target.index].toLowerCase() === selectedIngredient.toLowerCase());

            return (
              <ChordRibbon
                key={`chord-${i}`}
                d={generators.ribbonGenerator(d) || ''}
                colors={[colors[d.source.index], colors[d.target.index]]}
                isSelected={isSelected}
                selectedIngredient={selectedIngredient}
                value={d.source.value}
              />
            );
          })}

          {/* Draw group arcs */}
          {chordData.groups.map((group, i) => {
            const isSelected = selectedIngredient && 
              ingredients[group.index].toLowerCase() === selectedIngredient.toLowerCase();

            return (
              <Path
                key={`group-${i}`}
                d={generators.arcGenerator(group) || ''}
                fill={colors[group.index]}
                fillOpacity={isSelected ? 0.9 : (selectedIngredient ? 0.3 : 0.7)}
                stroke={colors[group.index]}
                strokeWidth={isSelected ? 2 : 0.5}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});