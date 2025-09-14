import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Platform, 
  ScrollView, 
  SafeAreaView, 
  KeyboardAvoidingView,
  Dimensions 
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { INGREDIENT_MATRIX } from '@/data/ingredientMatrix';

// Import the correct version based on platform
const D3ChordDiagram = Platform.select({
  web: () => require('@/components/D3ChordDiagram.web').D3ChordDiagram,
  default: () => require('@/components/D3ChordDiagram.native').D3ChordDiagram,
})();

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Filter ingredients based on search term
  const filteredIngredients = searchTerm 
    ? INGREDIENT_MATRIX.ingredients.filter(ing => 
        ing.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleSelectIngredient = (ingredient: string) => {
    setSelectedIngredient(ingredient);
    setSearchTerm(ingredient);
    setShowResults(false);
  };

  const handleClear = () => {
    setSelectedIngredient(null);
    setSearchTerm('');
    setShowResults(false);
  };

  const theme = useColorScheme() ?? 'light';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[theme].chartBackground }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!showResults} // Disable main scroll when showing results
        >
          <View style={styles.mainContainer}>
            <View style={styles.header}>
              <ThemedText style={[styles.title, { color: Colors[theme].text }]}>
                Gourmet Cocktails
              </ThemedText>
            </View>
            <View style={styles.searchWrapper}>
              <View style={[styles.searchContainer, { marginBottom: showResults ? 0 : 16 }]}>
                <TextInput
                  style={[
                    styles.searchInput,
                    {
                      borderColor: Colors[theme].searchBackground,
                      backgroundColor: Colors[theme].searchBackground,
                      color: Colors[theme].text
                    }
                  ]}
                  placeholderTextColor={Colors[theme].text}
                  value={searchTerm}
                  onChangeText={(text) => {
                    setSearchTerm(text);
                    setShowResults(true);
                  }}
                  placeholder="Search ingredients..."
                  onFocus={() => setShowResults(true)}
                />
                {selectedIngredient && (
                  <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                    <ThemedText>✕</ThemedText>
                  </TouchableOpacity>
                )}
              </View>

              {showResults && filteredIngredients.length > 0 && (
                <View style={[
                  styles.resultsOuterContainer,
                  {
                    backgroundColor: Colors[theme].chartBackground,
                    borderColor: Colors[theme].chartBackground
                  }
                ]}>
                  <ScrollView 
                    style={styles.resultsContainer}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                  >
                    {filteredIngredients.map((ingredient, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.resultItem,
                          {
                            borderBottomColor: Colors[theme].background,
                            backgroundColor: Colors[theme].chartBackground
                          },
                          index === filteredIngredients.length - 1 && styles.lastResultItem
                        ]}
                        onPress={() => handleSelectIngredient(ingredient)}
                      >
                        <ThemedText>{ingredient}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.diagramContainer}>
              <D3ChordDiagram selectedIngredient={selectedIngredient} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    paddingTop: 20,
    marginTop: 10,
    fontSize: 32,
    fontWeight: 'bold',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  searchWrapper: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  clearButton: {
    marginLeft: 8,
    padding: 8,
  },
  resultsOuterContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: SCREEN_HEIGHT * 0.3, // 30% of screen height
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      },
    }),
  },
  resultsContainer: {
    maxHeight: SCREEN_HEIGHT * 0.3,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  lastResultItem: {
    borderBottomWidth: 0,
  },
  diagramContainer: {
    flex: 1,
    minHeight: 400,
    marginTop: 20,
  },
});