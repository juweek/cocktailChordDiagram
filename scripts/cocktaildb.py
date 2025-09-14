import requests
import json
import time
import csv
from collections import defaultdict
import pandas as pd
from urllib.parse import quote

class CocktailAnalyzer:
    def __init__(self, api_key=None):
        self.api_key = api_key
        self.is_premium = bool(api_key)
        version = "v2" if self.is_premium else "v1"
        key = self.api_key if self.is_premium else "1"
        self.base_url = f"https://www.thecocktaildb.com/api/json/{version}/{key}"
        self.ingredients = []
        self.cocktail_ingredients = defaultdict(set)  # cocktail_id -> set of ingredients
        self.ingredient_connections = defaultdict(int)  # (ingredient1, ingredient2) -> count
        self.rate_limit_delay = 0.05 if self.is_premium else 0.1  # Faster rate limit for premium
        
    def load_ingredients_from_csv(self, csv_file):
        """Load ingredients from the provided CSV file"""
        df = pd.read_csv(csv_file)
        # Get column names except the first unnamed column
        self.ingredients = [col for col in df.columns if col and col != 'Unnamed: 0']
        print(f"Loaded {len(self.ingredients)} ingredients from CSV")
        return self.ingredients
    
    def get_cocktails_by_ingredient(self, ingredient):
        """Get all cocktails that contain a specific ingredient"""
        # URL encode the ingredient name
        encoded_ingredient = quote(ingredient.replace(' ', '_'))
        url = f"{self.base_url}/filter.php?i={encoded_ingredient}"
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            # Handle case where API returns "None Found" response
            if data is None or data.get('drinks') is None:
                print(f"No cocktails found for '{ingredient}', trying simplified name...")
                # Try with simplified ingredient name
                simplified = self.normalize_ingredient_name(ingredient)
                if simplified != ingredient:
                    return self.get_cocktails_by_ingredient(simplified)
                return []
                
            if isinstance(data.get('drinks'), list):
                return data['drinks']
            else:
                print(f"Note: No cocktails found using '{ingredient}'")
                return []
        except requests.exceptions.RequestException as e:
            print(f"Network error fetching cocktails for {ingredient}: {e}")
            return []
        except json.JSONDecodeError as e:
            print(f"JSON decode error for {ingredient}: {e}")
            return []
        except Exception as e:
            print(f"Unexpected error fetching cocktails for {ingredient}: {e}")
            return []
    
    def get_cocktail_details(self, cocktail_id):
        """Get detailed information about a cocktail including all ingredients"""
        url = f"{self.base_url}/lookup.php?i={cocktail_id}"
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            if isinstance(data, str):
                print(f"Warning: Unexpected string response for cocktail {cocktail_id}")
                return []
            
            if data and isinstance(data, dict) and data.get('drinks') and data['drinks'][0]:
                drink = data['drinks'][0]
                ingredients = []
                
                # Extract ingredients (strIngredient1-15)
                for i in range(1, 16):
                    ingredient = drink.get(f'strIngredient{i}')
                    if ingredient and isinstance(ingredient, str) and ingredient.strip():
                        ingredients.append(ingredient.lower().strip())
                
                return ingredients
            return []
        except requests.exceptions.RequestException as e:
            print(f"Network error fetching details for cocktail {cocktail_id}: {e}")
            return []
        except json.JSONDecodeError as e:
            print(f"JSON decode error for cocktail {cocktail_id}: {e}")
            return []
        except Exception as e:
            print(f"Unexpected error fetching details for cocktail {cocktail_id}: {e}")
            return []
    
    def normalize_ingredient_name(self, ingredient):
        """Normalize ingredient names to match between API and CSV"""
        # Convert to lowercase and handle common variations
        normalized = ingredient.lower().strip()
        
        # Handle common API vs CSV naming differences
        mapping = {
            'lemon juice': 'fresh lemon juice',
            'lime juice': 'fresh lime juice',
            'white rum': 'light rum',
            'añejo rum': 'rum',  # Simplify to base spirit
            'anejo rum': 'rum',  # Simplify to base spirit
            'aged rum': 'rum',   # Simplify to base spirit
            'dark rum': 'rum',   # Simplify to base spirit
            'light rum': 'rum',  # Simplify to base spirit
            'gold rum': 'rum',   # Simplify to base spirit
            'jägermeister': 'jagermeister',  # Remove umlaut
            'jagermeister': 'jagermeister',
        }
        
        return mapping.get(normalized, normalized)
    
    def collect_all_cocktail_data(self):
        """Collect cocktail data for all ingredients"""
        print("Starting data collection...")
        processed_cocktails = set()
        
        for i, ingredient in enumerate(self.ingredients):
            print(f"Processing ingredient {i+1}/{len(self.ingredients)}: {ingredient}")
            
            # Get cocktails containing this ingredient
            cocktails = self.get_cocktails_by_ingredient(ingredient)
            
            for cocktail in cocktails:
                cocktail_id = cocktail['idDrink']
                
                # Skip if we've already processed this cocktail
                if cocktail_id in processed_cocktails:
                    continue
                
                # Get full ingredient list for this cocktail
                ingredients_in_cocktail = self.get_cocktail_details(cocktail_id)
                
                # Normalize ingredient names
                normalized_ingredients = [
                    self.normalize_ingredient_name(ing) for ing in ingredients_in_cocktail
                ]
                
                # Filter to only include ingredients from our master list
                valid_ingredients = [
                    ing for ing in normalized_ingredients 
                    if ing in [i.lower() for i in self.ingredients]
                ]
                
                if len(valid_ingredients) >= 2:  # Only process cocktails with 2+ ingredients
                    self.cocktail_ingredients[cocktail_id] = set(valid_ingredients)
                    processed_cocktails.add(cocktail_id)
                
                # Rate limiting
                time.sleep(self.rate_limit_delay)
            
            # Longer delay after each ingredient to be extra respectful
            time.sleep(0.5)
        
        print(f"Collected data for {len(processed_cocktails)} unique cocktails")
    
    def calculate_ingredient_connections(self):
        """Calculate connections between all ingredient pairs"""
        print("Calculating ingredient connections...")
        
        # Reset connections
        self.ingredient_connections = defaultdict(int)
        
        # For each cocktail, count all ingredient pair combinations
        for cocktail_id, ingredients in self.cocktail_ingredients.items():
            ingredients_list = list(ingredients)
            
            # Generate all unique pairs
            for i in range(len(ingredients_list)):
                for j in range(i + 1, len(ingredients_list)):
                    ing1, ing2 = sorted([ingredients_list[i], ingredients_list[j]])
                    self.ingredient_connections[(ing1, ing2)] += 1
    
    def save_connections_to_csv(self, output_file="ingredient_connections.csv"):
        """Save ingredient connections to CSV"""
        print(f"Saving connections to {output_file}...")
        
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Ingredient1', 'Ingredient2', 'Cocktail_Count'])
            
            # Sort by connection count (descending)
            sorted_connections = sorted(
                self.ingredient_connections.items(), 
                key=lambda x: x[1], 
                reverse=True
            )
            
            for (ing1, ing2), count in sorted_connections:
                writer.writerow([ing1, ing2, count])
        
        print(f"Saved {len(sorted_connections)} ingredient connections")
    
    def create_connection_matrix(self, output_file="ingredient_matrix.csv"):
        """Create a full matrix of ingredient connections"""
        print(f"Creating connection matrix...")
        
        # Create ingredient to index mapping
        ingredient_names = sorted([ing.lower() for ing in self.ingredients])
        
        # Initialize matrix
        matrix = [[0 for _ in range(len(ingredient_names))] for _ in range(len(ingredient_names))]
        
        # Fill matrix with connection counts
        for (ing1, ing2), count in self.ingredient_connections.items():
            if ing1 in ingredient_names and ing2 in ingredient_names:
                i1 = ingredient_names.index(ing1)
                i2 = ingredient_names.index(ing2)
                matrix[i1][i2] = count
                matrix[i2][i1] = count  # Make it symmetric
        
        # Save matrix to CSV
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            # Write header
            writer.writerow([''] + ingredient_names)
            
            # Write matrix rows
            for i, row in enumerate(matrix):
                writer.writerow([ingredient_names[i]] + row)
        
        print(f"Saved connection matrix to {output_file}")
    
    def print_top_connections(self, top_n=20):
        """Print the top N ingredient connections"""
        sorted_connections = sorted(
            self.ingredient_connections.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        print(f"\nTop {top_n} Ingredient Connections:")
        print("-" * 50)
        for i, ((ing1, ing2), count) in enumerate(sorted_connections[:top_n]):
            print(f"{i+1:2d}. {ing1} + {ing2}: {count} cocktails")

def main():
    # Initialize analyzer with premium API
    api_key = "961249867"  # Premium API key
    analyzer = CocktailAnalyzer(api_key)
    
    # Load ingredients from your CSV file
    analyzer.load_ingredients_from_csv('ingredients.csv')
    
    if analyzer.is_premium:
        print("Using premium API - this will be much faster!")
    else:
        print("This process will take some time due to API rate limiting...")
        print("The script will make hundreds of API calls respectfully.")
    
    # Collect all cocktail data
    analyzer.collect_all_cocktail_data()
    
    # Calculate connections
    analyzer.calculate_ingredient_connections()
    
    # Save results
    analyzer.save_connections_to_csv("ingredient_connections.csv")
    analyzer.create_connection_matrix("ingredient_matrix.csv")
    
    # Print summary
    analyzer.print_top_connections()
    
    print("\nAnalysis complete!")
    print("Files created:")
    print("- ingredient_connections.csv: List of all ingredient pairs with counts")
    print("- ingredient_matrix.csv: Full matrix format for easy analysis")

if __name__ == "__main__":
    main()