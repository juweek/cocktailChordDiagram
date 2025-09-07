import React, { useState, useCallback } from 'react';
import { StyleSheet, View, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { getAllIngredients, getCategoryForIngredient, CATEGORY_COLORS } from '@/constants/Ingredients';

interface IngredientSearchProps {
  onIngredientSelect: (ingredient: string) => void;
}

export function IngredientSearch({ onIngredientSelect }: IngredientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredIngredients, setFilteredIngredients] = useState<string[]>([]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (text.length > 0) {
      const query = text.toLowerCase();
      const ingredients = getAllIngredients();
      const filtered = ingredients.filter(ingredient =>
        ingredient.toLowerCase().includes(query)
      );
      setFilteredIngredients(filtered);
    } else {
      setFilteredIngredients([]);
    }
  }, []);

  const handleSelect = useCallback((ingredient: string) => {
    onIngredientSelect(ingredient);
    setSearchQuery('');
    setFilteredIngredients([]);
  }, [onIngredientSelect]);

  const renderItem = useCallback(({ item }: { item: string }) => {
    const category = getCategoryForIngredient(item);
    const categoryColor = category ? CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] : '#333';

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleSelect(item)}>
        <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
        <ThemedText>{item}</ThemedText>
      </TouchableOpacity>
    );
  }, [handleSelect]);

  return (
    <ThemedView style={styles.container}>
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={handleSearch}
        placeholder="Search for an ingredient..."
        placeholderTextColor="#666"
      />
      {filteredIngredients.length > 0 && (
        <FlatList
          data={filteredIngredients}
          renderItem={renderItem}
          keyExtractor={item => item}
          style={styles.resultsList}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    zIndex: 1,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  resultsList: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
});
