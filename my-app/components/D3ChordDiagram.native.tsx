import React, { useMemo, memo, useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Platform, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Svg, { Path, G, Text, Defs, LinearGradient, Stop } from 'react-native-svg';
import { chord, ribbon, Chord, ChordGroup } from 'd3-chord';
import { arc, DefaultArcObject } from 'd3-shape';
import { descending } from 'd3-array';
import { useRouter } from 'expo-router';
import { INGREDIENT_MATRIX } from '@/data/ingredientMatrix';
import { CATEGORY_COLORS } from '@/constants/Ingredients';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface D3ChordDiagramProps {
  selectedIngredient?: string | undefined;
}

// Memoized chord component
interface ChordRibbonProps {
  d: string;
  colors: string[];
  isSelected: boolean;
  selectedIngredient?: string | undefined;
  selectedCategory?: string | undefined;
  value: number;
  maxValue: number;
}

interface ChordData {
  source: { value: number };
  target: { value: number };
}

const ChordRibbon = memo(({ d, colors, isSelected, selectedIngredient, selectedCategory, value, maxValue }: ChordRibbonProps) => {
  // Get categories for source and target
  const sourceCategory = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
    color === colors[0]
  )?.[0];
  const targetCategory = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
    color === colors[1]
  )?.[0];

  // Check if chord belongs to selected category
  const belongsToCategory = (category: string) => {
    if (!category) return true;
    return sourceCategory === category || targetCategory === category;
  };

  // Determine gradient ratios based on selected category
  const getGradientStops = () => {
    if (!selectedCategory) {
      // Default view: 50-50 split
      return {
        firstStop: "20%",
        secondStop: "80%"
      };
    }
    
    if (sourceCategory === selectedCategory) {
      // Source category is selected: 75-25 split favoring source
      return {
        firstStop: "20%",
        secondStop: "20%"
      };
    }
    
    if (targetCategory === selectedCategory) {
      // Target category is selected: 25-75 split favoring target
      return {
        firstStop: "80%",
        secondStop: "80%"
      };
    }

    // Category is selected but doesn't match either end: 50-50 split
    return {
      firstStop: "80%",
      secondStop: "20%"
    };
  };

  const isHighlighted = !selectedCategory || belongsToCategory(selectedCategory);
  const opacity = isSelected ? 0.9 : 
                 (selectedIngredient ? (isHighlighted ? 0.6 : 0.1) : 
                 (isHighlighted ? 0.6 : 0.1));

  // Create a unique gradient ID for this chord
  const gradientId = `gradient-${colors[0]}-${colors[1]}`.replace(/#/g, '');

  return (
    <>
      <Defs>
         <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            {(() => {
              const { firstStop, secondStop } = getGradientStops();
              return [
                <Stop key="start" offset="0%" stopColor={colors[1]} stopOpacity={opacity} />,
                <Stop key="first" offset={firstStop} stopColor={colors[1]} stopOpacity={opacity} />,
                <Stop key="second" offset={secondStop} stopColor={colors[0]} stopOpacity={opacity} />,
                <Stop key="end" offset="100%" stopColor={colors[0]} stopOpacity={opacity} />
              ];
            })()}
          </LinearGradient>
      </Defs>
                  <Path
                    d={d}
                    fill={`url(#${gradientId})`}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={isSelected ? Math.max(0.5, 8 * value / maxValue) : Math.max(0.1, 6.5 * value / maxValue)}
                    strokeOpacity={isSelected ? 1 : 0.7}
      />
    </>
  );
});

export function D3ChordDiagram({ selectedIngredient }: D3ChordDiagramProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() as 'light' | 'dark';
  const { width: windowWidth } = Dimensions.get('window');
  const { matrix, ingredients, colors } = INGREDIENT_MATRIX;

  // Validate matrix data
  if (!matrix || !ingredients || !colors || 
      matrix.length !== ingredients.length || 
      matrix.some(row => !row || row.length !== ingredients.length)) {
    console.error('Invalid matrix data:', { 
      matrixSize: matrix?.length, 
      ingredientsSize: ingredients?.length,
      colorsSize: colors?.length 
    });
    return null;
  }
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
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

  const handleCategoryChange = (newCategory: string | undefined) => {
    setIsLoading(true);
    setSelectedCategory(newCategory);
    // Add a small delay to ensure the loading state is visible
    setTimeout(() => setIsLoading(false), 100);
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
  // Scale down the diagram size to fit with padding
  const scaleFactor = 0.85; // Reduce size by 25%
  const outerRadius = Math.min(width, height) * 0.38 * scaleFactor;
  const innerRadius = outerRadius * 0.9;
  const categoryArcWidth = 35; // Slightly smaller arc width to match scale

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
    // Define category order to match clockwise direction of arcs
    const categoryOrder = ['other', 'mixers', 'spices', 'fruits', 'nonalcoholic', 'alcoholic'];
    
    // Map ingredients to their categories and sort
    const categorizedIngredients = ingredients.map((ingredient, index) => {
      const category = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
        colors[index] === color
      )?.[0] || 'other';
      return { ingredient, index, category };
    });

    // Sort ingredients by category order
    const sortedIngredients = categorizedIngredients.sort((a, b) => {
      const categoryA = categoryOrder.indexOf(a.category);
      const categoryB = categoryOrder.indexOf(b.category);
      return categoryA - categoryB;
    });

    // Get the sorted indices
    const orderedIndices = sortedIngredients.map(item => item.index);

    // Reorder matrix based on new order
    const orderedMatrix = orderedIndices.map(i => 
      orderedIndices.map(j => matrix[i][j])
    );

    // Create chord layout with custom sorting
    const rotationAngle = -Math.PI * 18 / 180; // Convert -30 degrees to radians for counterclockwise rotation
    const chordLayout = chord()
      .padAngle(0.04)
      .sortSubgroups(descending)
      // Sort chords to group them by source category
      .sortChords((a: any, b: any) => {
        if (!a || !b || !a.source || !b.source) return 0;
        
        // Get the original indices
        const sourceIndexA = orderedIndices[a.source.index];
        const sourceIndexB = orderedIndices[b.source.index];
        
        if (sourceIndexA === undefined || sourceIndexB === undefined) return 0;
        
        // Get categories for the source of each chord
        const categoryA = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
          colors[sourceIndexA] === color
        )?.[0] || 'other';
        const categoryB = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
          colors[sourceIndexB] === color
        )?.[0] || 'other';
        
        // Sort by category order first
        const categoryOrderA = categoryOrder.indexOf(categoryA);
        const categoryOrderB = categoryOrder.indexOf(categoryB);
        
        if (categoryOrderA === -1 || categoryOrderB === -1) return 0;
        return categoryOrderB - categoryOrderA;
      });

    // Create a mapping function to convert back to original indices
    const mapToOriginal = (index: number) => orderedIndices[index];
    const mapFromOriginal = (index: number) => orderedIndices.indexOf(index);

    const chordData = chordLayout(orderedMatrix);

    // Rotate all chords by the rotation angle
    chordData.forEach((chord: any) => {
      chord.source.startAngle += rotationAngle;
      chord.source.endAngle += rotationAngle;
      chord.target.startAngle += rotationAngle;
      chord.target.endAngle += rotationAngle;
    });

    // Map the indices in the chord data back to original indices
    chordData.groups = chordData.groups.map(group => ({
      ...group,
      index: mapToOriginal(group.index)
    }));

    chordData.forEach(chord => {
      chord.source.index = mapToOriginal(chord.source.index);
      chord.target.index = mapToOriginal(chord.target.index);
    });

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

  // Calculate max value for scaling
  const maxValue = useMemo(() => Math.max(...matrix.flat()), [matrix]);

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

    // Find max value in matrix for scaling
    const maxValue = Math.max(...matrix.flat());
    
    const ribbonGenerator = ribbon()
      .radius(innerRadius);

    const categoryArcGenerator = arc()
      .innerRadius(outerRadius + 5)
      .outerRadius(outerRadius + categoryArcWidth);
 
    return { arcGenerator, ribbonGenerator, categoryArcGenerator };
  }, [innerRadius, outerRadius, categoryArcWidth]);

  const centerX = width * 0.46;  // Center of the SVG
  const centerY = height * 0.43;  // Slightly above center to account for category labels

  // Calculate connection counts for each ingredient
  const ingredientConnections = useMemo(() => {
    return ingredients.map((ingredient, idx) => {
      // Count non-zero connections for this ingredient
      const connectionCount = matrix[idx].reduce((sum, value) => sum + value, 0);
      
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
        width={width * 0.9} 
        height={height * 0.9}
        style={{ 
          opacity: isLoading ? 0.3 : 1,
          marginHorizontal: width * 0.05,
          marginVertical: height * 0.05
        }}
      >
        <G transform={`translate(${centerX},${centerY})`}>
          {/* Draw category arcs */}
          {categoryArcs.map((categoryArc, i) => {
            const isHighlighted = selectedCategory === categoryArc.category || !selectedCategory;
            const isSelected = Boolean(selectedIngredient && 
              categoryArc.indices.some(idx => ingredients[idx].toLowerCase() === selectedIngredient.toLowerCase()));
            
            const opacity = isSelected ? 0.65 : 
                          (isHighlighted ? 0.7 : 0.1);
            
            return (
              <G key={`category-${i}`}>
                <Path
                  d={String(generators.categoryArcGenerator({
                    startAngle: categoryArc.startAngle,
                    endAngle: categoryArc.endAngle,
                    innerRadius: outerRadius + 5,
                    outerRadius: outerRadius + categoryArcWidth
                  } as DefaultArcObject))}
                  fill={categoryArc.color}
                  fillOpacity={opacity}
                  stroke={categoryArc.color}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeOpacity={isSelected ? 1 : 0.6}
                  onPress={() => handleCategoryChange(
                    selectedCategory === categoryArc.category ? undefined : categoryArc.category
                  )}
                />
                {/* Add a quarter turn (π/2) to the positioning angle */}
                <G
                  transform={`
                    translate(
                      ${Math.sin(categoryArc.midAngle + (categoryArc.category === 'alcoholic' ? -Math.PI/3 : 
                                                        categoryArc.category === 'nonalcoholic' ? Math.PI/4 :
                                                        categoryArc.category === 'other' ? Math.PI/2.5:
                                                        categoryArc.category === 'spices' ? Math.PI/1.1:
                                                        categoryArc.category === 'fruits' ? 3*Math.PI/5 :
                                                        categoryArc.category === 'mixers' ? -Math.PI/40 : 0)) * (outerRadius + categoryArcWidth + 15)},
                      ${Math.cos(categoryArc.midAngle + (categoryArc.category === 'alcoholic' ? -Math.PI/3 : 
                                                        categoryArc.category === 'nonalcoholic' ? Math.PI/4 :
                                                        categoryArc.category === 'other' ? Math.PI/2.5 :
                                                        categoryArc.category === 'spices' ? Math.PI :
                                                        categoryArc.category === 'fruits' ? Math.PI :
                                                        categoryArc.category === 'mixers' ? 4*Math.PI/4 : 0)) * (outerRadius + categoryArcWidth + 15)}
                    )
                    rotate(${(categoryArc.midAngle * 180 / Math.PI) + 
                      (categoryArc.category === 'fruits' ? 180 :  // Keep as is
                       categoryArc.category === 'spices' || categoryArc.category === 'mixers' ? 180 :  // Keep as is
                       categoryArc.category === 'alcoholic' ? 0 :  // 90 deg left
                       categoryArc.category === 'nonalcoholic' ? 180 :  // 90 deg right
                       categoryArc.category === 'other' ? 315 :  // Keep as is
                       90)  // Default
                    })
                  `}
                >
                  <Text
                    fill={useColorScheme() === 'dark' ? '#fff' : '#333'}
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
            const isSelected = Boolean(selectedIngredient && 
              (ingredients[d.source.index].toLowerCase() === selectedIngredient.toLowerCase() ||
               ingredients[d.target.index].toLowerCase() === selectedIngredient.toLowerCase()));

            return (
              <ChordRibbon
                key={`chord-${i}`}
                d={String(generators.ribbonGenerator({
                  ...d,
                  source: { ...d.source, radius: innerRadius },
                  target: { ...d.target, radius: innerRadius }
                } as any))}
                colors={[colors[d.source.index], colors[d.target.index]]}
                isSelected={isSelected}
                selectedIngredient={selectedIngredient}
                selectedCategory={selectedCategory}
                value={d.source.value}
                maxValue={maxValue}
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

            // Calculate tick mark for this group
            const midAngle = (group.startAngle + group.endAngle) / 2;
            const tickLength = 12; // Increased length of the tick mark
            const tickStart = innerRadius + 1; // Start just slightly outside the inner radius
            
            // Adjust angle to match the arc orientation (clockwise from top)
            const adjustedAngle = midAngle - Math.PI / 2 - 0.29; // Start from top and rotate 4 degrees left
            const x1 = Math.cos(adjustedAngle) * tickStart;
            const y1 = Math.sin(adjustedAngle) * tickStart;
            const x2 = Math.cos(adjustedAngle) * (innerRadius - tickLength);
            const y2 = Math.sin(adjustedAngle) * (innerRadius - tickLength);

            return (
              <G key={`group-${i}`}>
                <Path
                  d={generators.arcGenerator({
                    ...group,
                    innerRadius,
                    outerRadius
                  } as DefaultArcObject) || ''}
                  fill={colors[group.index]}
                  fillOpacity={opacity}
                  stroke="none"
                />
                <Path
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke={colors[group.index]}
                  strokeWidth={1}
                  opacity={opacity * 0.8}
                  strokeLinecap="round"
                />
              </G>
            );
          })}
        </G>
      </Svg>

      {/* Category Filters */}
      <View style={[
        styles.categoryFilterWrapper,
        { backgroundColor: Colors[useColorScheme() ?? 'light'].chartBackground }
      ]}>
        <View style={styles.categoryFilterContainer}>
          <TouchableOpacity
            style={[
              styles.categoryFilterButton,
              !selectedCategory ? styles.categoryFilterButtonSelected : undefined
            ]}
            onPress={() => handleCategoryChange(undefined)}
          >
            <ThemedText style={styles.categoryFilterText}>All</ThemedText>
          </TouchableOpacity>
          {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryFilterButton,
                { borderColor: color },
                selectedCategory === category ? styles.categoryFilterButtonSelected : undefined,
                selectedCategory === category ? { backgroundColor: color } : undefined
              ]}
                  onPress={() => handleCategoryChange(
                    selectedCategory === category ? undefined : category
                  )}
            >
              <ThemedText 
                style={[
                  styles.categoryFilterText,
                  selectedCategory === category ? styles.categoryFilterTextSelected : undefined
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>


      {/* All Ingredients List */}
      {!selectedIngredient && (
        <View style={[
          styles.connectionsContainer,
          { backgroundColor: Colors[useColorScheme() ?? 'light'].searchBackground }
        ]}>
          <ThemedText style={styles.connectionsTitle}>
            All Ingredients by Total Cocktail Count
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
                      {item.ingredient} ({item.connectionCount} cocktails)
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
        <View style={[
          styles.connectionsContainer,
          { backgroundColor: Colors[useColorScheme() ?? 'light'].searchBackground }
        ]}>
          <ThemedText style={styles.connectionsTitle}>
            Connections for {selectedIngredient}:
          </ThemedText>
          
          <View style={{ flex: 6, width: '100%' }}>
            <ScrollView 
              style={styles.connectionsList}
              contentContainerStyle={styles.connectionsContent}
            >
              {connections
                .filter((conn): conn is NonNullable<typeof conn> => 
                  conn !== null && (!selectedCategory || conn.category === selectedCategory)
                )
                .map((conn, index) => {
                  // Always use full set for max value calculation
                  const maxValue = Math.max(...connections
                    .filter((c): c is NonNullable<typeof c> => c !== null)
                    .map(c => c.value)
                  );
                  const barFlex = conn.value / maxValue;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.connectionRow}
                    onPress={() => handleIngredientPress(conn.target)}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.connectionText}>
                        {conn.target} ({conn.value} cocktails in common)
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
  categoryFilterWrapper: {
    width: '100%',
    marginTop: 30,
    marginBottom: 0,
    borderRadius: 8,
    padding: 8,
  },
  categoryFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  categoryFilterContent: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  categoryFilterButton: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
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
    fontSize: 14,
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
    borderRadius: 8,
    marginTop: 16,
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
