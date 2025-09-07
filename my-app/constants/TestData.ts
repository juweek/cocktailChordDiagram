// Sample data for testing the chord diagram
// This represents connections between different types of ingredients
export const TEST_CHORD_DATA = {
  columns: [
    'source',
    'vodka',
    'cranberry juice',
    'lime juice',
    'gin',
    'tonic water',
    'rum',
    'cola',
    'mint'
  ],
  data: [
    // Each row represents how often ingredients are used together
    // 1 means they are commonly paired, 0 means never paired
    {
      source: 'vodka',
      'vodka': 0,
      'cranberry juice': 1,
      'lime juice': 1,
      'gin': 0,
      'tonic water': 0,
      'rum': 0,
      'cola': 0,
      'mint': 0
    },
    {
      source: 'cranberry juice',
      'vodka': 1,
      'cranberry juice': 0,
      'lime juice': 1,
      'gin': 0,
      'tonic water': 0,
      'rum': 0,
      'cola': 0,
      'mint': 0
    },
    {
      source: 'lime juice',
      'vodka': 1,
      'cranberry juice': 1,
      'lime juice': 0,
      'gin': 1,
      'tonic water': 0,
      'rum': 1,
      'cola': 0,
      'mint': 1
    },
    {
      source: 'gin',
      'vodka': 0,
      'cranberry juice': 0,
      'lime juice': 1,
      'gin': 0,
      'tonic water': 1,
      'rum': 0,
      'cola': 0,
      'mint': 0
    },
    {
      source: 'tonic water',
      'vodka': 0,
      'cranberry juice': 0,
      'lime juice': 0,
      'gin': 1,
      'tonic water': 0,
      'rum': 0,
      'cola': 0,
      'mint': 0
    },
    {
      source: 'rum',
      'vodka': 0,
      'cranberry juice': 0,
      'lime juice': 1,
      'gin': 0,
      'tonic water': 0,
      'rum': 0,
      'cola': 1,
      'mint': 1
    },
    {
      source: 'cola',
      'vodka': 0,
      'cranberry juice': 0,
      'lime juice': 0,
      'gin': 0,
      'tonic water': 0,
      'rum': 1,
      'cola': 0,
      'mint': 0
    },
    {
      source: 'mint',
      'vodka': 0,
      'cranberry juice': 0,
      'lime juice': 1,
      'gin': 0,
      'tonic water': 0,
      'rum': 1,
      'cola': 0,
      'mint': 0
    }
  ]
};
