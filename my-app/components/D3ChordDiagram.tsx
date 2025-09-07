import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

interface D3ChordDiagramProps {
  data: any;
  selectedIngredient?: string;
}

export function D3ChordDiagram({ data, selectedIngredient }: D3ChordDiagramProps) {
  const webViewRef = useRef<WebView>(null);
  const { width, height } = Dimensions.get('window');

  // HTML content with D3 setup
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://d3js.org/d3.v7.min.js"></script>
        <style>
          body {
            margin: 0;
            overflow: hidden;
            background-color: transparent;
          }
          #chart {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .chord-label {
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 12px;
            fill: #333;
          }
        </style>
      </head>
      <body>
        <div id="chart"></div>
        <script>
          // Set up dimensions
          const width = ${width};
          const height = ${height};
          const radius = Math.min(width, height) * 0.4;

          // Create SVG
          const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", \`translate(\${width / 2},\${height / 2})\`);

          // Function to update the chord diagram
          function updateChordDiagram(data, selectedIngredient) {
            // Clear previous content
            svg.selectAll("*").remove();

            // Create chord layout
            const chord = d3.chord()
              .padAngle(0.05)
              .sortSubgroups(d3.descending);

            // Generate chord data
            const chordData = chord(data.matrix);

            // Create groups
            const group = svg.append("g")
              .selectAll("g")
              .data(chordData.groups)
              .join("g");

            // Add arcs for each group
            const arc = d3.arc()
              .innerRadius(radius * 0.9)
              .outerRadius(radius);

            group.append("path")
              .attr("fill", d => data.colors[d.index])
              .attr("d", arc);

            // Add labels
            group.append("text")
              .attr("class", "chord-label")
              .attr("dy", ".35em")
              .attr("transform", d => {
                const angle = (d.startAngle + d.endAngle) / 2;
                return \`rotate(\${angle * 180 / Math.PI - 90}) translate(\${radius + 10}) \${
                  angle > Math.PI ? "rotate(180)" : ""
                }\`;
              })
              .attr("text-anchor", d => (d.startAngle + d.endAngle) / 2 > Math.PI ? "end" : "start")
              .text(d => data.names[d.index]);

            // Create ribbons
            const ribbon = d3.ribbon()
              .radius(radius * 0.9);

            svg.append("g")
              .attr("fill-opacity", 0.67)
              .selectAll("path")
              .data(chordData)
              .join("path")
              .attr("d", ribbon)
              .attr("fill", d => data.colors[d.source.index])
              .attr("stroke", "#000")
              .style("opacity", d => {
                if (!selectedIngredient) return 0.8;
                return (data.names[d.source.index] === selectedIngredient ||
                        data.names[d.target.index] === selectedIngredient) ? 0.8 : 0.2;
              });
          }

          // Listen for messages from React Native
          window.addEventListener('message', function(event) {
            const message = JSON.parse(event.data);
            if (message.type === 'updateData') {
              updateChordDiagram(message.data, message.selectedIngredient);
            }
          });
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    if (webViewRef.current) {
      const message = {
        type: 'updateData',
        data: {
          matrix: data.matrix,
          names: data.names,
          colors: data.colors
        },
        selectedIngredient
      };
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  }, [data, selectedIngredient]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        scrollEnabled={false}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        onMessage={(event) => {
          console.log('Message from WebView: ', event.nativeEvent.data);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webview: {
    backgroundColor: 'transparent',
  },
});
