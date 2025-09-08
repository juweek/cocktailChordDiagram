import React, { useEffect, useRef } from 'react';
import { View, Dimensions } from 'react-native';
import { chord, ribbon } from 'd3-chord';
import { select } from 'd3-selection';
import { descending } from 'd3-array';
import { arc } from 'd3-shape';
import { INGREDIENT_MATRIX } from '@/data/ingredientMatrix';
import { CATEGORY_COLORS } from '@/constants/Ingredients';

interface D3ChordDiagramProps {
  selectedIngredient?: string | null;
}

export function D3ChordDiagram({ selectedIngredient }: D3ChordDiagramProps) {
  const { ingredients, matrix, colors } = INGREDIENT_MATRIX;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width: windowWidth } = Dimensions.get('window');
  
  // Set dimensions
  const width = windowWidth;
  const height = 500;
  const outerRadius = Math.min(width, height) * 0.4;
  const innerRadius = outerRadius * 0.9;

  // Calculate group angles based on ingredients
  function calculateGroupAngles(names: string[]) {
    const groupAngles: { group: string; startAngle: number; endAngle: number }[] = [];
    const totalIngredients = names.length;
    let currentAngle = -Math.PI / 2; // Start at top

    // Group ingredients by category
    const groupedIngredients = ingredients.reduce((acc, ing, i) => {
      const category = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
        colors[i] === color
      )?.[0] || 'other';
      
      if (!acc[category]) acc[category] = [];
      acc[category].push(i);
      return acc;
    }, {} as Record<string, number[]>);

    // Create angle ranges for each group
    Object.entries(groupedIngredients).forEach(([group, indices]) => {
      if (indices.length === 0) return;
      
      const angleSize = (2 * Math.PI * indices.length) / totalIngredients;
      groupAngles.push({
        group,
        startAngle: currentAngle,
        endAngle: currentAngle + angleSize
      });
      currentAngle += angleSize;
    });

    return groupAngles;
  }

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
      // Create chord layout
      const chordLayout = chord()
        .padAngle(0.05)
        .sortSubgroups(descending);

      const chordData = chordLayout(matrix);

      // Clear canvas
      context.clearRect(-width / 2, -height / 2, width, height);

      // Create ribbon generator
      const ribbonGenerator = ribbon().radius(innerRadius);

      // Draw the chords
      chordData.forEach(d => {
        context.beginPath();
        ribbonGenerator.context(context)(d);

        // Create gradient for the chord
        const gradient = context.createLinearGradient(
          innerRadius * Math.cos(d.source.startAngle),
          innerRadius * Math.sin(d.source.startAngle),
          innerRadius * Math.cos(d.target.startAngle),
          innerRadius * Math.sin(d.target.startAngle)
        );
        gradient.addColorStop(0, colors[d.source.index]);
        gradient.addColorStop(1, colors[d.target.index]);

        // Set opacity based on selection
        const isSelected = selectedIngredient && 
          (ingredients[d.source.index].toLowerCase() === selectedIngredient.toLowerCase() ||
           ingredients[d.target.index].toLowerCase() === selectedIngredient.toLowerCase());

        context.globalAlpha = isSelected ? 0.9 : (selectedIngredient ? 0.1 : 0.6);
        context.fillStyle = gradient;
        context.fill();

        context.lineWidth = isSelected ? 2 : 0.5;
        context.strokeStyle = gradient;
        context.stroke();
      });

      // Draw the outer arcs for categories
      const groupAngles = calculateGroupAngles(ingredients);
      const arcWidth = 40;

      groupAngles.forEach(group => {
        const isHighlighted = selectedIngredient && 
          ingredients.some((ing, i) => 
            colors[i] === CATEGORY_COLORS[group.group as keyof typeof CATEGORY_COLORS] &&
            ing.toLowerCase() === selectedIngredient.toLowerCase()
          );

        context.beginPath();
        context.arc(0, 0, outerRadius + arcWidth / 2, group.startAngle, group.endAngle);
        context.lineWidth = arcWidth;
        context.strokeStyle = CATEGORY_COLORS[group.group as keyof typeof CATEGORY_COLORS] || '#000';
        context.globalAlpha = isHighlighted ? 0.6 : 0.3;
        context.stroke();

        // Add category labels
        const midAngle = (group.startAngle + group.endAngle) / 2;
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
        context.fillText(group.group.charAt(0).toUpperCase() + group.group.slice(1), 0, 0);
        context.restore();
      });

    } catch (error) {
      console.error('Error creating chord diagram:', error);
    }
  }, [matrix, ingredients, colors, selectedIngredient, width, height]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: width,
          height: height,
          backgroundColor: 'transparent',
        }}
      />
    </View>
  );
}