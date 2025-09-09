import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';

interface Ingredient {
  strIngredient: string;
  strDescription: string;
}

interface Drink {
  strDrink: string;
  strDrinkThumb: string;
  idDrink: string;
}

export default function IngredientDetails() {
  const params = useLocalSearchParams();
  const ingredient = params.ingredient as string;
  const filteredIngredient = params.filteredIngredient as string;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [ingredientDetails, setIngredientDetails] = useState<Ingredient | null>(null);
  const [drinks, setDrinks] = useState<Drink[]>([]);

  // Format ingredient name for API
  const formatIngredient = (name: string) => {
    return decodeURIComponent(name)
      .toLowerCase()
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[^a-z0-9_]/g, ''); // Remove special characters
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Decode the ingredient name for display
        const decodedIngredient = decodeURIComponent(ingredient);
        
        // Fetch ingredient details
        const detailsResponse = await fetch(
          `https://www.thecocktaildb.com/api/json/v2/961249867/search.php?i=${decodedIngredient}`
        );
        const detailsData = await detailsResponse.json();
        
        if (detailsData.ingredients?.[0]) {
          setIngredientDetails(detailsData.ingredients[0]);
        }

        // Format ingredients for API call
        const formattedIngredient = formatIngredient(ingredient);
        
        // Use different API endpoints based on whether we have a filtered ingredient
        const apiUrl = filteredIngredient 
          ? `https://www.thecocktaildb.com/api/json/v2/961249867/filter.php?i=${formattedIngredient},${formatIngredient(filteredIngredient)}`
          : `https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${formattedIngredient}`;

        const drinksResponse = await fetch(apiUrl);
        const drinksData = await drinksResponse.json();
        
        // API returns null for drinks when no results are found
        if (drinksData.drinks === null || !Array.isArray(drinksData.drinks)) {
          setDrinks([]);
        } else {
          setDrinks(drinksData.drinks);
        }
      } catch (error) {
        console.error('Error fetching ingredient data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (ingredient) {
      fetchData();
    }
  }, [ingredient]);

  const handleDrinkPress = (drinkId: string) => {
    const url = `https://www.thecocktaildb.com/drink/${drinkId}`;
    Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <ThemedText style={styles.loadingText}>Loading ingredient details...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <ThemedText style={styles.closeButtonText}>×</ThemedText>
      </TouchableOpacity>

      <ScrollView style={styles.scrollContainer}>
        {ingredientDetails && (
          <View style={styles.detailsContainer}>
            <ThemedText style={styles.title}>{ingredientDetails.strIngredient}</ThemedText>
            <ThemedText style={styles.description}>{ingredientDetails.strDescription}</ThemedText>
            
            <ThemedText style={styles.subtitle}>
              {filteredIngredient 
                ? `Cocktails Involving ${decodeURIComponent(ingredient)} and ${decodeURIComponent(filteredIngredient)} (${drinks.length})`
                : `Cocktails with ${decodeURIComponent(ingredient)} (${drinks.length})`
              }
            </ThemedText>
            {drinks.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <ThemedText style={styles.noResultsText}>
                  No cocktails found with these ingredients. Try a different combination!
                </ThemedText>
              </View>
            ) : (
              <View style={styles.drinksGrid}>
                {drinks.map((drink) => (
                  <TouchableOpacity
                    key={drink.idDrink}
                    style={styles.drinkCard}
                    onPress={() => handleDrinkPress(drink.idDrink)}
                  >
                    <Image
                      source={{ uri: drink.strDrinkThumb }}
                      style={styles.drinkImage}
                    />
                    <ThemedText style={styles.drinkName}>{drink.strDrink}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  noResultsContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  detailsContainer: {
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  drinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  drinkCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  drinkImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  drinkName: {
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});
