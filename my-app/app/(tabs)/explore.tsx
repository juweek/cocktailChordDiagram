import React, { useState, useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IngredientSearch } from '@/components/IngredientSearch';
import { D3ChordDiagram } from '@/components/D3ChordDiagram';
import { TEST_CHORD_DATA } from '@/constants/ChordData';

export default function ExploreScreen() {
  const [selectedIngredient, setSelectedIngredient] = useState<string>();

  useEffect(() => {
    console.log('Explore Screen mounted');
    console.log('Platform:', Platform.OS);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Cocktail Ingredients
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Discover which ingredients work well together
      </ThemedText>
      
      <IngredientSearch onIngredientSelect={setSelectedIngredient} />
      
      <D3ChordDiagram 
        data={TEST_CHORD_DATA}
        selectedIngredient={selectedIngredient}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
});