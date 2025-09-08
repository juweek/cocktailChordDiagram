import React, { useMemo, memo, useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Platform, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Svg, { Path, G, Text } from 'react-native-svg';
import { chord, ribbon } from 'd3-chord';
import { arc } from 'd3-shape';
import { descending } from 'd3-array';
import { INGREDIENT_MATRIX } from '@/data/ingredientMatrix';
import { CATEGORY_COLORS } from '@/constants/Ingredients';
import { ThemedText } from '@/components/ThemedText';

interface D3ChordDiagramProps {
  selectedIngredient?: string | null;
}

// Memoized chord component
const ChordRibbon = memo(({ d, colors, isSelected, selectedIngredient, hoveredCategory }: any) => {
  // Check if chord belongs to hovered category
  const belongsToCategory = (category: string) => {
    if (!category) return true;
    const sourceCategory = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
      color === colors[0]
    )?.[0];
    const targetCategory = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
      color === colors[1]
    )?.[0];
    return sourceCategory === category || targetCategory === category;
  };

  const isHighlighted = !hoveredCategory || belongsToCategory(hoveredCategory);
  const opacity = isSelected ? 0.9 : 
                 (selectedIngredient ? (isHighlighted ? 0.6 : 0.1) : 
                 (isHighlighted ? 0.6 : 0.1));

  return (
    <Path
      d={d}
      fill={colors[0]}
      fillOpacity={opacity}
      stroke={colors[0]}
      strokeWidth={isSelected ? 2 : 0.5}
    />
  );
});

export function D3ChordDiagram({ selectedIngredient }: D3ChordDiagramProps) {
  const { width: windowWidth } = Dimensions.get('window');
  const { matrix, ingredients, colors } = INGREDIENT_MATRIX;
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prevSelectedIngredient, setPrevSelectedIngredient] = useState(selectedIngredient);
  
  // Show loading when selection changes
  useEffect(() => {
    if (selectedIngredient !== prevSelectedIngredient) {
      setIsLoading(true);
      setPrevSelectedIngredient(selectedIngredient);
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [selectedIngredient]);

  // Set dimensions
  const width = windowWidth;
  const height = Platform.select({ ios: 400, android: 400, default: 500 });
  const outerRadius = Math.min(width, height) * 0.4;
  const innerRadius = outerRadius * 0.9;
  const categoryArcWidth = 40;

  // Get connections for selected ingredient
  const connections = useMemo(() => {
    if (!selectedIngredient) return [];
    
    const sourceIdx = ingredients.findIndex(i => i.toLowerCase() === selectedIngredient.toLowerCase());
    if (sourceIdx === -1) return [];

    return matrix[sourceIdx].map((value, targetIdx) => {
      if (value === 0 || sourceIdx === targetIdx) return null;
      return {
        source: ingredients[sourceIdx],
        target: ingredients[targetIdx],
        value,
        category: Object.entries(CATEGORY_COLORS).find(([_, color]) => 
          color === colors[targetIdx]
        )?.[0] || 'other'
      };
    }).filter(Boolean);
  }, [selectedIngredient, matrix, ingredients]);

  // Memoize calculations
  const { chordData, categoryArcs } = useMemo(() => {
    // Create chord layout
    const chordLayout = chord()
      .padAngle(0.04)
      .sortSubgroups(descending);

    const chordData = chordLayout(matrix);

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

  // Filter visible chords
  const visibleChords = useMemo(() => {
    return chordData.filter(d => {
      if (selectedIngredient) {
        return ingredients[d.source.index].toLowerCase() === selectedIngredient.toLowerCase() ||
               ingredients[d.target.index].toLowerCase() === selectedIngredient.toLowerCase();
      }
      // For non-selected state, only show stronger connections
      return d.source.value > 1 || d.target.value > 1;
    });
  }, [chordData, selectedIngredient, ingredients]);

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

  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <ThemedText style={styles.loadingText}>Updating diagram...</ThemedText>
        </View>
      )}
      
      <Svg 
        width={width} 
        height={height}
        style={{ opacity: isLoading ? 0.3 : 1 }}
      >
        <G transform={`translate(${centerX},${centerY})`}>
          {/* Draw category arcs */}
          {categoryArcs.map((categoryArc, i) => {
            const isHighlighted = hoveredCategory === categoryArc.category || !hoveredCategory;
            const isSelected = selectedIngredient && 
              categoryArc.indices.some(idx => ingredients[idx].toLowerCase() === selectedIngredient.toLowerCase());
            
            const opacity = isSelected ? 0.6 : 
                          (isHighlighted ? 0.3 : 0.1);
            
            return (
              <G key={`category-${i}`}>
                <Path
                  d={generators.categoryArcGenerator({
                    startAngle: categoryArc.startAngle,
                    endAngle: categoryArc.endAngle
                  } as any)}
                  fill={categoryArc.color}
                  fillOpacity={opacity}
                  stroke={categoryArc.color}
                  strokeWidth={isSelected ? 2 : 1}
                  onPress={() => setHoveredCategory(
                    hoveredCategory === categoryArc.category ? null : categoryArc.category
                  )}
                />
                <G
                  transform={`
                    translate(
                      ${Math.cos(categoryArc.midAngle) * (outerRadius + categoryArcWidth + 20)},
                      ${Math.sin(categoryArc.midAngle) * (outerRadius + categoryArcWidth + 20)}
                    )
                    rotate(${(categoryArc.midAngle * 180 / Math.PI) + (categoryArc.midAngle > Math.PI / 2 && categoryArc.midAngle < 3 * Math.PI / 2 ? 180 : 0)})
                  `}
                >
                  <Text
                    fill="#333"
                    fontSize={12}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {categoryArc.category.charAt(0).toUpperCase() + categoryArc.category.slice(1)}
                  </Text>
                </G>
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
                hoveredCategory={hoveredCategory}
              />
            );
          })}

          {/* Draw group arcs */}
          {chordData.groups.map((group, i) => {
            const isSelected = selectedIngredient && 
              ingredients[group.index].toLowerCase() === selectedIngredient.toLowerCase();
            const category = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
              color === colors[group.index]
            )?.[0];
            const isHighlighted = !hoveredCategory || category === hoveredCategory;

            const opacity = isSelected ? 0.9 : 
                          (selectedIngredient ? (isHighlighted ? 0.7 : 0.3) : 
                          (isHighlighted ? 0.7 : 0.3));

            return (
              <Path
                key={`group-${i}`}
                d={generators.arcGenerator(group) || ''}
                fill={colors[group.index]}
                fillOpacity={opacity}
                stroke={colors[group.index]}
                strokeWidth={isSelected ? 2 : 0.5}
              />
            );
          })}
        </G>
      </Svg>
 {/* Connections List */}
 {selectedIngredient && connections.length > 0 && (
        <View style={styles.connectionsContainer}>
          <ThemedText style={styles.connectionsTitle}>
            Connections for {selectedIngredient}:
          </ThemedText>
          <View style={{ flex: 1, width: '100%' }}>
            <ScrollView 
              style={styles.connectionsList}
              contentContainerStyle={styles.connectionsContent}
            >
              {connections.map((conn: any, index) => {
                console.log('Rendering connection:', conn);
                const maxValue = Math.max(...connections.map(c => c.value));
                const barFlex = conn.value / maxValue;
                console.log('Bar flex:', barFlex);
                
                return (
                  <View key={index} style={styles.connectionRow}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.connectionText}>
                        {conn.target} ({conn.value})
                      </ThemedText>
                    </View>
                    <View style={styles.barContainer}>
                      <View 
                        style={[
                          styles.bar,
                          { 
                            flex: barFlex,
                            backgroundColor: CATEGORY_COLORS[conn.category as keyof typeof CATEGORY_COLORS]
                          }
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  connectionsContainer: {
    width: '100%',
    height: 200,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 10,
  },
  connectionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  connectionsList: {
    flex: 1,
    width: '100%',
  },
  connectionsContent: {
    paddingHorizontal: 10,
    width: '100%',
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
    width: '100%',
  },
  connectionText: {
    fontSize: 14,
    marginRight: 10,
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  bar: {
    height: '100%',
  },
});
