// Import the CSV data
const csvData = `ingredient,cocktail_count
Gin,108
Vodka,102
Orange juice,72
Sugar,71
Lemon juice,67
Ice,49
Lime juice,46
Lemon,46
Light rum,45
Triple sec,42
Amaretto,41
Grenadine,40
Lime,40
Water,38
Milk,34
Lemon peel,34
Tequila,30
Pineapple juice,30
Kahlua,29
Coffee,27
Brandy,26
Dry Vermouth,26
Rum,26
Sweet Vermouth,25
Cranberry juice,25
Baileys irish cream,25
Sugar syrup,22
Orange,22
Dark rum,20
Bourbon,17
Bitters,16
Carbonated water,16
Orange bitters,15
Scotch,15
151 proof rum,15
Mint,15
Blue Curacao,14
Champagne,13
Coca-Cola,13
Strawberries,12
Lemonade,12
Red wine,11
Grapefruit juice,11
Campari,11
Apricot brandy,10
Creme de Cacao,10
Sambuca,10
Apple juice,9
Yoghurt,9
Ginger,9
Egg,9
Grand Marnier,9
Sour mix,9
Blended whiskey,8
Southern Comfort,8
Cognac,8
Galliano,8
Midori melon liqueur,8
Malibu rum,8
Prosecco,8
Absolut Citron,7
Sprite,7
7-Up,7
Creme de Cassis,7
Goldschlager,7
Jägermeister,7
Chambord raspberry liqueur,7
Tea,6
Cherry brandy,6
Chocolate,6
Lager,6
Cointreau,6
Beer,6
Vanilla ice-cream,6
White Rum,6
Irish whiskey,5
Port,5
Sherry,5
Sloe gin,5
Chocolate syrup,5
Tomato juice,5
Cocoa powder,5
Heavy cream,5
Cider,5
Jack Daniels,5
White Creme de Menthe,5
Banana liqueur,5
Green Chartreuse,5
Coconut Liqueur,5
Coffee liqueur,4
Everclear,4
Egg yolk,4
Absolut Vodka,4
Crown Royal,4
Kool-Aid,4
Wild Turkey,4
Frangelico,4
Cachaca,4
Rye whiskey,4
Elderflower cordial,4
Añejo rum,3
Apple brandy,3
Strawberry schnapps,3
Mango,3
Spiced rum,3
Espresso,3
Peach nectar,3
Whiskey,3
Irish cream,3
Chocolate liqueur,3
Blackberry brandy,3
Vermouth,3
Corona,3
Chocolate ice-cream,3
Absinthe,3
Guinness stout,3
Godiva liqueur,3
Bacardi Limon,3
Green Creme de Menthe,3
Aperol,3
Applejack,2
Ricard,2
Berries,2
Kiwi,2
Peach Vodka,2
Ouzo,2
Angelica root,2
Johnnie Walker,2
Apple cider,2
Grape juice,2
Pisco,2
Advocaat,2
Absolut Kurant,2
Cherry Heering,2
Peachtree schnapps,2
Hot Damn,2
Jim Beam,2
Fruit punch,2
Zima,2
Raspberry vodka,2
Grape Soda,2
Hot Chocolate,2
Gold rum,2
Lemon vodka,1
Dubonnet Rouge,1
Coffee brandy,1
Cantaloupe,1
Grapes,1
Cranberries,1
Firewater,1
Ale,1
Peppermint schnapps,1
Vanilla vodka,1
Kiwi liqueur,1
Cranberry vodka,1
Yukon Jack,1
Coconut rum,1
Black Sambuca,1
Whisky,1
Maui,1
demerara Sugar,1
Mezcal,1
Blended Scotch,1
Cherry Juice,1
Hpnotiq,1
Watermelon,1
Rose,1`;

export interface IngredientCount {
  ingredient: string;
  count: number;
}

// Parse the CSV data
const parseCSV = (): IngredientCount[] => {
  const lines = csvData.trim().split('\n');
  // Skip header row
  return lines.slice(1).map(line => {
    const [ingredient, count] = line.split(',');
    return {
      ingredient: ingredient.trim(),
      count: parseInt(count, 10)
    };
  });
};

export const INGREDIENT_COUNTS = parseCSV();