import { CATEGORY_COLORS } from '@/constants/Ingredients';

// Import the raw CSV data
import { CSV_DATA as RAW_CSV_DATA } from './rawData';

// Function to parse CSV string into matrix
function parseCSV(csvString: string) {
  // Split into rows and filter out empty lines
  const rows = csvString.split('\n').filter(row => row.trim());
  const headers = rows[0].split(',').slice(1); // Skip first empty column
  const matrix: number[][] = [];
  const ingredients: string[] = headers;
  const colors: string[] = [];

  // Parse each row into matrix
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.trim()) continue; // Skip empty rows
    const values = row.split(',').slice(1).map(Number); // Skip first column (ingredient name)
    if (values.length === headers.length) { // Only add rows that match header length
      matrix.push(values);
    }

  }

  // Validate matrix dimensions
  if (matrix.length !== ingredients.length) {
    console.warn(`Matrix dimensions mismatch: ${matrix.length} rows vs ${ingredients.length} ingredients`);
  }

  // Helper function to get category color
  function getCategoryForIngredient(ingredient: string): string {
    // Map ingredient to its category and return corresponding color
    const categories = {
      alcoholic: ['rum', 'vodka', 'gin', 'whiskey', 'brandy', 'liqueur', 'tequila', 'wine', 'beer', 'scotch', 'bourbon'],
      nonalcoholic: ['juice', 'soda', 'water', 'tea', 'coffee', 'cola', 'punch', 'nectar'],
      mixers: ['syrup', 'cream', 'milk', 'cordial', 'mix', 'sugar', 'honey'],
      spices: ['bitters', 'salt', 'pepper', 'nutmeg', 'cinnamon', 'mint', 'rosemary', 'thyme'],
      fruits: ['apple', 'orange', 'lemon', 'lime', 'cherry', 'berry', 'fruit', 'mango', 'banana', 'pineapple'],
      other: []
    };

    const lowerIngredient = ingredient.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerIngredient.includes(keyword))) {
        return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];
      }
    }
    return CATEGORY_COLORS.other;
  }

  // Assign colors based on ingredients
  ingredients.forEach((ingredient) => {
    colors.push(getCategoryForIngredient(ingredient));
  });

  return { matrix, ingredients, colors };
}

export const INGREDIENT_MATRIX = parseCSV(RAW_CSV_DATA);
