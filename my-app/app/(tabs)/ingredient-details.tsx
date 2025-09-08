import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
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
  const { ingredient } = useLocalSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [ingredientDetails, setIngredientDetails] = useState<Ingredient | null>(null);
  const [drinks, setDrinks] = useState<Drink[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch ingredient details
        const detailsResponse = await fetch(
          `https://www.thecocktaildb.com/api/json/v1/1/search.php?i=${ingredient}`
        );
        const detailsData = await detailsResponse.json();
        
        if (detailsData.ingredients?.[0]) {
          setIngredientDetails(detailsData.ingredients[0]);
        }

        // Fetch drinks with this ingredient
        const drinksResponse = await fetch(
          `https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${ingredient}`
        );
        const drinksData = await drinksResponse.json();
        
        if (drinksData.drinks) {
          // Limit to 10 drinks
          setDrinks(drinksData.drinks.slice(0, 10));
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <ThemedText style={styles.loadingText}>Loading ingredient details...</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {ingredientDetails && (
        <View style={styles.detailsContainer}>
          <ThemedText style={styles.title}>{ingredientDetails.strIngredient}</ThemedText>
          <ThemedText style={styles.description}>{ingredientDetails.strDescription}</ThemedText>
          
          <ThemedText style={styles.subtitle}>Popular Cocktails</ThemedText>
          <View style={styles.drinksGrid}>
            {drinks.map((drink) => (
              <View key={drink.idDrink} style={styles.drinkCard}>
                <Image
                  source={{ uri: drink.strDrinkThumb }}
                  style={styles.drinkImage}
                />
                <ThemedText style={styles.drinkName}>{drink.strDrink}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
