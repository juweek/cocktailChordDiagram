import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Dimensions, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { chord, ribbon } from 'd3-chord';
import { select } from 'd3-selection';
import { descending } from 'd3-array';
import { arc } from 'd3-shape';
import { INGREDIENT_MATRIX } from '@/data/ingredientMatrix';
import { INGREDIENT_COUNTS } from '@/data/ingredientCounts';
import { CATEGORY_COLORS } from '@/constants/Ingredients';
import { ThemedText } from '@/components/ThemedText';

interface D3ChordDiagramProps {
  selectedIngredient?: string | null;
}

export function D3ChordDiagram({ selectedIngredient }: D3ChordDiagramProps) {
  const { ingredients, matrix, colors } = INGREDIENT_MATRIX;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width: windowWidth } = Dimensions.get('window');
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
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
  const height = 500;
  const outerRadius = Math.min(width, height) * 0.4;
  const innerRadius = outerRadius * 0.9;

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

  // Create chord layout and filter visible chords
  const { chordData, visibleChords } = useMemo(() => {
    const chordLayout = chord()
      .padAngle(0.05)
      .sortSubgroups(descending);

    const chordData = chordLayout(matrix);

    // Filter visible chords - only show chords where selected ingredient/category is the source
    const visibleChords = chordData.filter(d => {
      if (selectedIngredient) {
        return ingredients[d.source.index].toLowerCase() === selectedIngredient.toLowerCase();
      }
      if (hoveredCategory) {
        const sourceCategory = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
          color === colors[d.source.index]
        )?.[0];
        return sourceCategory === hoveredCategory;
      }
      // For non-selected state, only show stronger connections
      return d.source.value > 1 || d.target.value > 1;
    });

    return { chordData, visibleChords };
  }, [matrix, ingredients, selectedIngredient]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Handle high-DPI displays
    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    context.scale(devicePixelRatio, devicePixelRatio);
    context.translate(width / 2, height / 2);

    try {
      // Clear canvas
      context.clearRect(-width / 2, -height / 2, width, height);

      // Create ribbon generator
      const ribbonGenerator = ribbon().radius(innerRadius);

      // Draw only visible chords
      visibleChords.forEach(d => {
        const sourceCategory = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
          color === colors[d.source.index]
        )?.[0];
        const targetCategory = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
          color === colors[d.target.index]
        )?.[0];

        const belongsToCategory = !hoveredCategory || 
          sourceCategory === hoveredCategory || 
          targetCategory === hoveredCategory;

        context.beginPath();
        ribbonGenerator.context(context)(d);

        // Create gradient for the chord with dynamic ratios
        const gradient = context.createLinearGradient(
          innerRadius * Math.cos(d.source.startAngle),
          innerRadius * Math.sin(d.source.startAngle),
          innerRadius * Math.cos(d.target.startAngle),
          innerRadius * Math.sin(d.target.startAngle)
        );

        // Determine gradient ratios based on selected category
        let firstStop = 0.5;  // Default 50-50 split
        if (hoveredCategory) {
          if (sourceCategory === hoveredCategory) {
            firstStop = 0.75;  // 75-25 split favoring source
          } else if (targetCategory === hoveredCategory) {
            firstStop = 0.25;  // 25-75 split favoring target
          }
        }

        gradient.addColorStop(0, colors[d.source.index]);
        gradient.addColorStop(firstStop, colors[d.source.index]);
        gradient.addColorStop(firstStop, colors[d.target.index]);
        gradient.addColorStop(1, colors[d.target.index]);

        // Set opacity based on selection and category
        const isSelected = selectedIngredient && 
          (ingredients[d.source.index].toLowerCase() === selectedIngredient.toLowerCase() ||
           ingredients[d.target.index].toLowerCase() === selectedIngredient.toLowerCase());

        context.globalAlpha = isSelected ? 0.9 : (belongsToCategory ? 0.6 : 0.1);
        context.fillStyle = gradient;
        context.fill();

        context.lineWidth = isSelected ? 2 : 0.5;
        context.strokeStyle = gradient;
        context.stroke();
      });

      // Draw the outer arcs for categories
      const arcWidth = 40;
      const categoryGroups: { [key: string]: number[] } = {};
      
      ingredients.forEach((_, i) => {
        const category = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
          color === colors[i]
        )?.[0] || 'other';
        
        if (!categoryGroups[category]) {
          categoryGroups[category] = [];
        }
        categoryGroups[category].push(i);
      });

      let currentAngle = -Math.PI / 2;
      Object.entries(categoryGroups).forEach(([category, indices]) => {
        const angleSize = (2 * Math.PI * indices.length) / ingredients.length;
        const isHighlighted = hoveredCategory === category || !hoveredCategory;
        const isSelected = selectedIngredient && 
          indices.some(idx => ingredients[idx].toLowerCase() === selectedIngredient.toLowerCase());

        context.beginPath();
        context.arc(0, 0, outerRadius + arcWidth / 2, currentAngle, currentAngle + angleSize);
        context.lineWidth = arcWidth;
        context.strokeStyle = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#000';
        context.globalAlpha = isHighlighted ? (isSelected ? 0.6 : 0.3) : 0.1;
        context.stroke();

        // Add category labels
        const midAngle = currentAngle + angleSize / 2;
        const labelRadius = outerRadius + arcWidth + 20;
        const x = labelRadius * Math.cos(midAngle);
        const y = labelRadius * Math.sin(midAngle);

        context.save();
        context.translate(x, y);
        context.rotate(midAngle + (midAngle > Math.PI / 2 && midAngle < 3 * Math.PI / 2 ? Math.PI : 0));
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#333';
        context.font = 'bold 16px Arial';
        context.globalAlpha = 1.0;
        context.fillText(category.charAt(0).toUpperCase() + category.slice(1), 0, 0);
        context.restore();

        currentAngle += angleSize;
      });

      // Add click handler for category arcs
      canvas.onclick = (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left - width / 2;
        const y = event.clientY - rect.top - height / 2;
        const clickRadius = Math.sqrt(x * x + y * y);
        let angle = Math.atan2(y, x);
        if (angle < 0) angle += 2 * Math.PI;

        // Check if click is in category arc area
        if (clickRadius >= outerRadius && clickRadius <= outerRadius + arcWidth) {
          let currentAngle = -Math.PI / 2;
          for (const [category, indices] of Object.entries(categoryGroups)) {
            const angleSize = (2 * Math.PI * indices.length) / ingredients.length;
            const endAngle = currentAngle + angleSize;
            
            if (angle >= currentAngle && angle <= endAngle) {
              setHoveredCategory(hoveredCategory === category ? null : category);
              break;
            }
            currentAngle = endAngle;
          }
        }
      };

    } catch (error) {
      console.error('Error creating chord diagram:', error);
    }
  }, [matrix, ingredients, colors, selectedIngredient, width, height, hoveredCategory, visibleChords]);

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <ThemedText style={styles.loadingText}>Updating diagram...</ThemedText>
        </View>
      )}
      
      <canvas
        ref={canvasRef}
        style={{
          width: width,
          height: height,
          backgroundColor: 'transparent',
          opacity: isLoading ? 0.3 : 1,
        }}
      />

      {/* Connections List with Bar Chart */}
      {selectedIngredient && connections.length > 0 && (
        <View style={styles.connectionsContainer}>
          <ThemedText style={styles.connectionsTitle}>
            Connections for {selectedIngredient}:
          </ThemedText>
          <ScrollView 
            style={styles.connectionsList}
            contentContainerStyle={styles.connectionsContent}
          >
            {connections
              .filter((conn): conn is NonNullable<typeof conn> => 
                conn !== null && (!hoveredCategory || conn.category === hoveredCategory)
              )
              .sort((a, b) => b.value - a.value) // Sort by connection strength
              .map((conn, index) => {
                // Calculate relative bar width (max 80% of container)
                const maxValue = Math.max(...connections.map(c => c.value));
                const barWidth = `${(conn.value / maxValue) * 80}%`;
                
                return (
                  <View key={index} style={styles.connectionRow}>
                    <View style={styles.connectionInfo}>
                      <ThemedText style={styles.connectionTarget}>
                        {conn.target}
                      </ThemedText>
                      <ThemedText style={styles.connectionValue}>
                        ({conn.value})
                      </ThemedText>
                    </View>
                    <View style={styles.barContainer}>
                      <View 
                        style={[
                          styles.bar,
                          { 
                            backgroundColor: CATEGORY_COLORS[conn.category as keyof typeof CATEGORY_COLORS],
                            width: barWidth,
                          }
                        ]}
                      />
                    </View>
                  </View>
                );
            })}
          </ScrollView>
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
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  connectionsContainer: {
    width: '100%',
    maxHeight: 200,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 10,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  connectionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  connectionsList: {
    flex: 1,
  },
  connectionsContent: {
    paddingHorizontal: 10,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '40%',
  },
  connectionTarget: {
    fontSize: 12,
    marginRight: 4,
  },
  connectionValue: {
    fontSize: 12,
    color: '#666',
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    opacity: 0.8,
  },
});