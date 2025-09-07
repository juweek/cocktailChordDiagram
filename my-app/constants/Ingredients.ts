export const INGREDIENT_CATEGORIES = {
  alcoholic: {
    whiskeys: ["blended whiskey", "blended scotch", "bourbon", "crown royal", "Irish Whiskey", "islay single malt scotch", "jack daniels", "jim beam", "johnnie walker", "rye whiskey", "tennessee whiskey", "whiskey", "whisky", "wild turkey"],
    rums: ["151 proof rum", "añejo rum", "bacardi limon", "blackstrap rum", "dark rum", "gold rum", "light rum", "malibu rum", "spiced rum", "white rum"],
    vodkas: ["absolut vodka", "absolut citron", "absolut kurant", "absolut peppar", "cranberry vodka", "lime vodka", "peach vodka", "raspberry vodka", "vanilla vodka"],
    gins: ["gin", "sloe gin"],
    brandies: ["apple brandy", "apricot brandy", "blackberry brandy", "cherry brandy", "cognac", "peach brandy"],
    liqueurs: ["advocaat", "amaretto", "amaro montenegro", "aperol", "baileys irish cream", "benedictine", "blue curacao", "butterscotch schnapps", "campari", "chambord raspberry liqueur", "cherry heering", "cherry liqueur", "chocolate liqueur", "coffee brandy", "coffee liqueur", "cointreau", "crème de banane", "crème de cacao", "crème de cassis", "crème de mure", "drambuie", "elderflower cordial", "frangelico", "galliano", "godiva liqueur", "grand marnier", "irish cream", "jägermeister", "Kahlua", "kiwi liqueur", "maraschino liqueur", "midori melon liqueur", "orange curacao", "passoa", "peach schnapps", "peachtree schnapps", "pernod", "pisang ambon", "sambuca", "southern comfort", "st. germain", "strawberry liqueur", "strawberry schnapps", "tia maria", "triple sec", "vanilla liqueur"],
    other_spirits: ["absinthe", "anisette", "apfelkorn", "cachaça", "everclear", "falernum", "firewater", "grain alcohol", "mezcal", "ouzo", "pisco", "ricard", "rumple minze", "tequila", "yukon jack"],
    wines: ["champagne", "dubonnet rouge", "lillet", "lillet blanc", "port", "prosecco", "red wine", "rosso vermouth", "ruby port", "sherry", "vermouth", "white wine", "wine"],
    beers: ["beer", "guinness stout", "lager", "cider"]
  },
  nonalcoholic: {
    soft_drinks: ["7-up", "bitter lemon", "coca-cola", "dr. pepper", "fresca", "ginger ale", "ginger beer", "Mountain Dew", "pepsi cola", "root beer", "soda water", "sprite", "surge", "zima"],
    juices_nectars: ["apple juice", "apricot nectar", "cranberry juice", "grape juice", "grapefruit juice", "lemon juice", "lime juice", "orange juice", "passion fruit juice", "peach nectar", "pineapple juice", "pomegranate juice", "tomato juice"]
  },
  mixers: {
    syrups_sweeteners: ["agave syrup", "chocolate syrup", "corn syrup", "grenadine", "honey", "honey syrup", "maple syrup", "mint syrup", "orgeat syrup", "passion fruit syrup", "pineapple syrup", "raspberry syrup", "rosemary syrup", "simple syrup", "sugar syrup", "vanilla syrup"],
    creams_dairy: ["butter", "condensed milk", "cream", "cream of coconut", "half-and-half", "heavy cream", "light cream", "whipped cream", "whipping cream", "yoghurt"],
    other_mixers: ["blackcurrant cordial", "coconut syrup", "daiquiri mix", "fruit punch", "hot chocolate", "pina colada mix", "sirup of roses", "sour mix", "sweet and sour mix"]
  },
  fruits: {
    fresh_fruits: ["apple", "banana", "blackberries", "blood orange", "cherries", "cherry", "cucumber", "fig", "kiwi", "lemon", "lime", "mango", "olive", "rrange", "papaya", "passion fruit", "peach", "pineapple", "raspberry", "strawberry", "tomato"],
    peels_zests: ["lemon peel", "lime peel", "orange peel", "orange spiral"]
  },
  spices: {
    herbs: ["lavender", "mint", "rosemary", "thyme"],
    spices: ["allspice", "black pepper", "cardamom", "cayenne pepper", "cinnamon", "cloves", "coriander", "cumin seed", "nutmeg", "pepper", "salt", "vanilla", "vanilla extract"]
  },
  other: {
    flavorings_colorings: ["almond flavoring", "caramel coloring", "cocoa powder", "oconut liqueur", "demerara sugar", "marshmallows", "oreo cookie", "vanilla ice-Cream"],
    botanicals: ["asafoetida", "rose", "wormwood"],
    condiments: ["celery salt", "hot sauce", "olive brine", "worcestershire sauce"],
    essences_extracts: ["roses sweetened lime juice"],
    garnishes: ["Maraschino Cherry"],
    miscellaneous: ["egg", "egg white", "egg yolk", "ice", "powdered sugar", "red chili flakes"]
  }
} as const;

export const CATEGORY_COLORS = {
  alcoholic: "#8B0000", // Dark Red
  nonalcoholic: "#006400", // Dark Green
  mixers: "#00008B", // Dark Blue
  fruits: "#DAA520", // Goldenrod
  spices: "#8B008B", // Dark Magenta
  other: "#008B8B" // Dark Cyan
} as const;

// Helper function to get all ingredients as a flat array
export const getAllIngredients = () => {
  const ingredients: string[] = [];
  Object.values(INGREDIENT_CATEGORIES).forEach(category => {
    Object.values(category).forEach(subcategory => {
      ingredients.push(...subcategory);
    });
  });
  return ingredients;
};

// Helper function to get category for an ingredient
export const getCategoryForIngredient = (ingredient: string): string | null => {
  for (const [category, subcategories] of Object.entries(INGREDIENT_CATEGORIES)) {
    for (const subcategoryItems of Object.values(subcategories)) {
      if (subcategoryItems.includes(ingredient.toLowerCase())) {
        return category;
      }
    }
  }
  return null;
};
