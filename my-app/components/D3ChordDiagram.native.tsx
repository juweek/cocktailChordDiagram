import React, { useMemo, memo, useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Platform, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Svg, { Path, G, Text } from 'react-native-svg';
import { chord, ribbon } from 'd3-chord';
import { arc } from 'd3-shape';
import { descending } from 'd3-array';
import { useRouter } from 'expo-router';
import { INGREDIENT_MATRIX } from '@/data/ingredientMatrix';
import { CATEGORY_COLORS } from '@/constants/Ingredients';
import { ThemedText } from '@/components/ThemedText';

interface D3ChordDiagramProps {
  selectedIngredient?: string | null;
}

// Memoized chord component
const ChordRibbon = memo(({ d, colors, isSelected, selectedIngredient, selectedCategory }: any) => {
  // Check if chord belongs to selected category
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

  const isHighlighted = !selectedCategory || belongsToCategory(selectedCategory);
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
  const router = useRouter();
  const { width: windowWidth } = Dimensions.get('window');
  const { matrix, ingredients, colors } = INGREDIENT_MATRIX;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prevSelectedIngredient, setPrevSelectedIngredient] = useState(selectedIngredient);

  const handleIngredientPress = (ingredient: string) => {
    router.push({
      pathname: '/modal/ingredient-details',
      params: { 
        ingredient: encodeURIComponent(ingredient),
        filteredIngredient: selectedIngredient ? encodeURIComponent(selectedIngredient) : undefined
      }
    });
  };
  
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
      // Get categories for source and target
      const sourceCategory = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
        color === colors[d.source.index]
      )?.[0];
      const targetCategory = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
        color === colors[d.target.index]
      )?.[0];

      // Check if either source or target belongs to selected category (from filter buttons)
      const belongsToSelectedCategory = !selectedCategory || 
        sourceCategory === selectedCategory || 
        targetCategory === selectedCategory;

      // Must pass category filter
      if (!belongsToSelectedCategory) {
        return false;
      }

      if (selectedIngredient) {
        return ingredients[d.source.index].toLowerCase() === selectedIngredient.toLowerCase() ||
               ingredients[d.target.index].toLowerCase() === selectedIngredient.toLowerCase();
      }
      
      // For non-selected state, only show stronger connections
      return d.source.value > 1 || d.target.value > 1;
    });
  }, [chordData, selectedIngredient, ingredients, selectedCategory, colors]);

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

  // Calculate connection counts for each ingredient
  const ingredientConnections = useMemo(() => {
    return ingredients.map((ingredient, idx) => {
      // Count non-zero connections for this ingredient
      const connectionCount = matrix[idx].reduce((count, value) => 
        count + (value > 0 ? 1 : 0), 0);
      
      // Get category for the ingredient
      const category = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
        color === colors[idx]
      )?.[0] || 'other';

      return {
        ingredient,
        connectionCount,
        category
      };
    }).sort((a, b) => b.connectionCount - a.connectionCount); // Sort by connection count
  }, [matrix, ingredients, colors]);

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
            const isHighlighted = selectedCategory === categoryArc.category || !selectedCategory;
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
                  onPress={() => setSelectedCategory(
                    selectedCategory === categoryArc.category ? null : categoryArc.category
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
                selectedCategory={selectedCategory}
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
            const isHighlighted = !selectedCategory || category === selectedCategory;

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

      {/* All Ingredients List */}
      {!selectedIngredient && (
        <View style={styles.connectionsContainer}>
          <ThemedText style={styles.connectionsTitle}>
            All Ingredients by Connection Count
          </ThemedText>
          <ScrollView style={styles.connectionsList}>
            {ingredientConnections
              .filter(item => !selectedCategory || item.category === selectedCategory)
              .map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.connectionRow}
                onPress={() => handleIngredientPress(item.ingredient)}
              >
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.connectionText}>
                    {item.ingredient} ({item.connectionCount} connections)
                  </ThemedText>
                </View>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar,
                      { 
                        flex: item.connectionCount / ingredientConnections[0].connectionCount,
                        backgroundColor: CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS]
                      }
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Connections List */}
      {selectedIngredient && connections.length > 0 && (
        <View style={styles.connectionsContainer}>
          <ThemedText style={styles.connectionsTitle}>
            Connections for {selectedIngredient}:
          </ThemedText>
          
          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilterContainer}
          >
            <TouchableOpacity
              style={[
                styles.categoryFilterButton,
                !selectedCategory && styles.categoryFilterButtonSelected
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <ThemedText style={styles.categoryFilterText}>All</ThemedText>
            </TouchableOpacity>
            {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryFilterButton,
                  { borderColor: color },
                  selectedCategory === category && styles.categoryFilterButtonSelected,
                  selectedCategory === category && { backgroundColor: color }
                ]}
                onPress={() => setSelectedCategory(
                  selectedCategory === category ? null : category
                )}
              >
                <ThemedText 
                  style={[
                    styles.categoryFilterText,
                    selectedCategory === category && styles.categoryFilterTextSelected
                  ]}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ flex: 6, width: '100%' }}>
            <ScrollView 
              style={styles.connectionsList}
              contentContainerStyle={styles.connectionsContent}
            >
              {connections
                .filter(conn => !selectedCategory || conn.category === selectedCategory)
                .map((conn: any, index) => {
                  // Always use full set for max value calculation
                  const maxValue = Math.max(...connections.map(c => c.value));
                  const barFlex = conn.value / maxValue;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.connectionRow}
                    onPress={() => handleIngredientPress(conn.target)}
                  >
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
                  </TouchableOpacity>
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
  categoryFilterContainer: {
    marginBottom: 0,
    height: 0,
  },
  categoryFilterContent: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  categoryFilterButton: {
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryFilterButtonSelected: {
    backgroundColor: '#666',
  },
  categoryFilterText: {
    fontSize: 12,
  },
  categoryFilterTextSelected: {
    color: '#fff',
  },
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
    height: Platform.select({ ios: 300, android: 300, default: 300 }),
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 40,
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
