import csv
import requests
import time
from pathlib import Path
from urllib.parse import quote

def get_all_ingredients():
    """Get list of all ingredients from TheCocktailDB API"""
    url = "https://www.thecocktaildb.com/api/json/v2/1/list.php?i=list"
    response = requests.get(url)
    data = response.json()
    return [item['strIngredient1'] for item in data['drinks']]

def get_cocktails_for_ingredient(ingredient):
    """Get number of cocktails for a specific ingredient"""
    # URL encode the ingredient name
    encoded_ingredient = quote(ingredient)
    url = f"https://www.thecocktaildb.com/api/json/v2/1/filter.php?i={encoded_ingredient}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if data and 'drinks' in data:
            return len(data['drinks'])
        return 0
    except:
        print(f"Error fetching data for {ingredient}")
        return 0

def generate_ingredient_counts():
    # Get all ingredients
    print("Fetching list of ingredients...")
    ingredients = get_all_ingredients()
    
    # Create a list to store ingredient counts
    ingredient_counts = []
    
    print(f"\nFetching cocktail counts for {len(ingredients)} ingredients...")
    for i, ingredient in enumerate(ingredients, 1):
        count = get_cocktails_for_ingredient(ingredient)
        print(f"[{i}/{len(ingredients)}] {ingredient}: {count} cocktails")
        
        ingredient_counts.append({
            'ingredient': ingredient,
            'cocktail_count': count
        })
        
        # Add a small delay to be nice to the API
        time.sleep(0.5)
    
    # Sort by cocktail count in descending order
    ingredient_counts.sort(key=lambda x: x['cocktail_count'], reverse=True)
    
    # Write to CSV
    output_path = Path('ingredient_counts.csv')
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['ingredient', 'cocktail_count'])
        writer.writeheader()
        writer.writerows(ingredient_counts)
    
    print(f"\nData written to {output_path}")
    print(f"Total ingredients processed: {len(ingredient_counts)}")
    print(f"\nTop 10 ingredients by cocktail count:")
    for i in range(min(10, len(ingredient_counts))):
        item = ingredient_counts[i]
        print(f"{item['ingredient']}: {item['cocktail_count']} cocktails")

if __name__ == '__main__':
    generate_ingredient_counts()