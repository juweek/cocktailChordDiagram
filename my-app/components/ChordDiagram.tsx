import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { CATEGORY_COLORS } from '@/constants/Ingredients';

interface ChordData {
  columns: string[];
  data: Array<{ [key: string]: number | string }>;
}

interface ChordDiagramProps {
  selectedIngredient?: string;
  data: ChordData;
}

export function ChordDiagram({ selectedIngredient, data }: ChordDiagramProps) {
  const webViewRef = useRef<WebView>(null);

  // This will be our D3 visualization HTML
  const getHtml = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://d3js.org/d3.v7.min.js"></script>
        <style>
          body { 
            margin: 0; 
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          #canvas { 
            width: 100%; 
            height: 100%;
            touch-action: none;
          }
          #tooltip {
            position: absolute;
            opacity: 0;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            pointer-events: none;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <canvas id="canvas"></canvas>
        <div id="tooltip"></div>
        <script>
          // Constants and Setup
          const width = ${Dimensions.get('window').width};
          const height = ${Dimensions.get('window').height};
          const categoryColors = ${JSON.stringify(CATEGORY_COLORS)};
          
          // Set up the canvas with device pixel ratio support
          const canvas = document.getElementById('canvas');
          const tooltip = document.getElementById('tooltip');
          const pixelRatio = window.devicePixelRatio || 1;
          canvas.width = width * pixelRatio;
          canvas.height = height * pixelRatio;
          canvas.style.width = width + 'px';
          canvas.style.height = height + 'px';
          
          const context = canvas.getContext('2d');
          context.scale(pixelRatio, pixelRatio);
          
          // Chord diagram parameters
          const outerRadius = Math.min(width, height) * 0.4;
          const innerRadius = outerRadius * 0.9;
          
          let currentIngredient = '';
          let hoveredCategory = null;
          let highlightedChord = null;
          let res;
          let names;

          // Initialize the chord diagram
          function createChordDiagram(data) {
            const matrix = data.columns.slice(1).map((ingredient, i) => {
              return data.map(d => +d[ingredient]);
            });

            names = data.columns.slice(1);

            // Create the chord layout
            res = d3.chord()
              .padAngle(0.05)
              .sortSubgroups(d3.descending)(matrix);

            updateChordDiagram();
          }

          function updateChordDiagram() {
            context.clearRect(0, 0, width, height);
            context.save();
            context.translate(width / 2, height / 2);

            const ribbon = d3.ribbon()
              .radius(innerRadius)
              .context(context);

            // Draw the chords
            res.forEach(d => {
              context.beginPath();
              ribbon(d);
              
              const sourceGroup = getIngredientGroup(names[d.source.index]);
              const targetGroup = getIngredientGroup(names[d.target.index]);
              const sourceColor = categoryColors[sourceGroup] || '#333';
              const targetColor = categoryColors[targetGroup] || '#333';
              
              const gradient = context.createLinearGradient(
                innerRadius * Math.cos(d.source.startAngle),
                innerRadius * Math.sin(d.source.startAngle),
                innerRadius * Math.cos(d.target.startAngle),
                innerRadius * Math.sin(d.target.startAngle)
              );
              gradient.addColorStop(0, sourceColor);
              gradient.addColorStop(1, targetColor);
              
              let chordOpacity = 0.5;
              let showChord = true;
              
              if (currentIngredient) {
                showChord = names[d.source.index] === currentIngredient || 
                           names[d.target.index] === currentIngredient;
              }
              
              if (hoveredCategory) {
                showChord = showChord && (
                  getIngredientGroup(names[d.source.index]) === hoveredCategory ||
                  getIngredientGroup(names[d.target.index]) === hoveredCategory
                );
              }
              
              context.globalAlpha = showChord ? 0.6 : 0.1;
              context.fillStyle = gradient;
              context.fill();
              context.strokeStyle = gradient;
              context.lineWidth = showChord ? 1 : 0.1;
              context.stroke();
            });

            // Draw the outer arcs
            const arc = d3.arc()
              .innerRadius(innerRadius)
              .outerRadius(outerRadius)
              .context(context);

            let groupAngles = [];
            let currentAngle = 0;
            
            Object.entries(categoryColors).forEach(([category, color]) => {
              const categoryIngredients = names.filter(name => 
                getIngredientGroup(name) === category
              );
              
              if (categoryIngredients.length > 0) {
                const angleSize = (2 * Math.PI * categoryIngredients.length) / names.length;
                groupAngles.push({
                  category,
                  startAngle: currentAngle,
                  endAngle: currentAngle + angleSize
                });
                currentAngle += angleSize;
              }
            });

            // Draw category arcs
            groupAngles.forEach(group => {
              context.beginPath();
              arc({
                startAngle: group.startAngle,
                endAngle: group.endAngle
              });
              context.fillStyle = categoryColors[group.category];
              context.globalAlpha = hoveredCategory === group.category ? 0.8 : 0.6;
              context.fill();
            });

            // Draw labels
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillStyle = '#000';
            context.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
            context.globalAlpha = 1;

            groupAngles.forEach(group => {
              const angle = (group.startAngle + group.endAngle) / 2;
              const x = Math.cos(angle) * (outerRadius + 20);
              const y = Math.sin(angle) * (outerRadius + 20);
              
              context.save();
              context.translate(x, y);
              context.rotate(angle + Math.PI / 2);
              context.fillText(
                group.category.charAt(0).toUpperCase() + group.category.slice(1),
                0,
                0
              );
              context.restore();
            });

            context.restore();
          }

          function getIngredientGroup(ingredient) {
            const ingredientLower = ingredient.toLowerCase();
            if (ingredientLower.includes('vodka') || ingredientLower.includes('gin') || ingredientLower.includes('rum')) {
              return 'alcoholic';
            } else if (ingredientLower.includes('juice')) {
              return 'nonalcoholic';
            } else if (ingredientLower.includes('water') || ingredientLower.includes('cola')) {
              return 'mixers';
            } else if (ingredientLower.includes('mint')) {
              return 'spices';
            }
            return 'other';
          }

          // Event handling
          canvas.addEventListener('mousemove', function(event) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left - width / 2;
            const y = event.clientY - rect.top - height / 2;
            const angle = Math.atan2(y, x);
            const radius = Math.sqrt(x * x + y * y);

            // Check if we're hovering over the outer ring
            if (radius > innerRadius && radius < outerRadius) {
              // Find which category we're hovering over
              let found = false;
              Object.keys(categoryColors).forEach(category => {
                // Implement category detection logic
              });
            }
          });

          // Listen for messages from React Native
          window.addEventListener('message', function(event) {
            const message = JSON.parse(event.data);
            if (message.type === 'updateSelection') {
              currentIngredient = message.ingredient || '';
              updateChordDiagram();
            } else if (message.type === 'updateData') {
              createChordDiagram(message.data);
            }
          });

          // Wait for data to be sent from React Native
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    if (webViewRef.current) {
      // First send the data
      webViewRef.current.postMessage(JSON.stringify({
        type: 'updateData',
        data: data
      }));

      // Then update selection if there is one
      if (selectedIngredient) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'updateSelection',
          ingredient: selectedIngredient
        }));
      }
    }
  }, [selectedIngredient, data]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: getHtml() }}
        style={styles.webview}
        scrollEnabled={false}
        onMessage={(event) => {
          // Handle messages from WebView
          const data = JSON.parse(event.nativeEvent.data);
          // Handle different message types
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});
