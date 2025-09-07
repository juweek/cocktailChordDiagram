// Colors for different ingredient categories
export const CATEGORY_COLORS = {
  alcoholic: '#8B0000',    // Dark Red
  nonalcoholic: '#006400', // Dark Green
  mixers: '#00008B',       // Dark Blue
  garnish: '#8B008B',      // Dark Magenta
} as const;

// Simple test matrix for demonstration
export const TEST_CHORD_DATA = {
  // Matrix where each row represents connections from one ingredient to others
  // Must be symmetric for D3 chord diagram
  matrix: [
    [0, 5, 1, 1], // Vodka's connections
    [5, 0, 3, 0], // Juice's connections
    [1, 3, 0, 2], // Mixer's connections
    [1, 0, 2, 0], // Garnish's connections
  ],
  // Names corresponding to each row/column in the matrix
  names: ['Vodka', 'Juice', 'Mixer', 'Garnish'],
  // Colors for each ingredient based on its category
  colors: [
    CATEGORY_COLORS.alcoholic,    // Vodka
    CATEGORY_COLORS.nonalcoholic, // Juice
    CATEGORY_COLORS.mixers,       // Mixer
    CATEGORY_COLORS.garnish       // Garnish
  ]
};