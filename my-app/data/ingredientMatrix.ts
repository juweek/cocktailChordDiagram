import { CATEGORY_COLORS } from '@/constants/Ingredients';

// Import the raw CSV data
const RAW_CSV_DATA = `151 proof rum,7-up,absinthe,absolut citron,absolut kurant,absolut peppar,absolut vodka,advocaat,agave syrup,allspice,almond flavoring,amaretto,amaro montenegro,angostura bitters,anis,anisette,aperol,apfelkorn,apple,apple brandy,apple juice,applejack,apricot brandy,apricot nectar,asafoetida,aejo rum,bacardi limon,baileys irish cream,banana,banana liqueur,beer,benedictine,bitter lemon,bitters,black pepper,black sambuca,blackberries,blackberry brandy,blackcurrant cordial,blackstrap rum,blended scotch,blended whiskey,blood orange,blue curacao,blueberry schnapps,bourbon,brandy,brown sugar,butter,butterscotch schnapps,cachaca,campari,caramel coloring,carbonated soft drink,carbonated water,cardamom,cayenne pepper,celery salt,chambord raspberry liqueur,champagne,cherries,cherry,cherry brandy,cherry heering,cherry juice,cherry liqueur,chocolate,chocolate liqueur,chocolate syrup,cider,cinnamon,cloves,club soda,coca-cola,cocoa powder,coconut liqueur,coconut milk,coconut syrup,coffee,coffee brandy,coffee liqueur,cognac,cointreau,condensed milk,coriander,corn syrup,corona,cranberry juice,cranberry vodka,cream,cream of coconut,creme de banane,creme de cacao,creme de cassis,creme de mure,crown royal,cucumber,cumin seed,daiquiri mix,dark creme de cacao,dark rum,demerara sugar,dr. pepper,drambuie,dry vermouth,dubonnet rouge,egg,egg white,egg yolk,elderflower cordial,espresso,everclear,falernum,figs,firewater,frangelico,fresca,fresh lemon juice,fresh lime juice,fruit,fruit juice,fruit punch,galliano,gin,ginger,ginger ale,ginger beer,ginger syrup,godiva liqueur,gold rum,goldschlager,grain alcohol,grand marnier,grape juice,grape soda,grapefruit juice,green chartreuse,green creme de menthe,grenadine,guinness stout,half-and-half,heavy cream,honey,honey syrup,hot chocolate,hot damn,hot sauce,ice,iced tea,irish cream,irish whiskey,islay single malt scotch,jack daniels,jagermeister,jello,jim beam,johnnie walker,jgermeister,kahlua,kiwi,kiwi liqueur,kool-aid,lager,lavender,lemon,lemon juice,lemon peel,lemon-lime soda,lemonade,light cream,light rum,lillet,lillet blanc,lime,lime juice,lime peel,lime vodka,limeade,malibu rum,mango,maple syrup,maraschino cherry,maraschino liqueur,marshmallows,melon liqueur,mezcal,midori melon liqueur,milk,mint,mint syrup,mountain dew,nutmeg,olive,olive brine,orange,orange bitters,orange curacao,orange juice,orange peel,orange spiral,oreo cookie,orgeat syrup,ouzo,papaya,passion fruit juice,passion fruit syrup,passoa,peach bitters,peach brandy,peach nectar,peach schnapps,peach vodka,peachtree schnapps,pepper,pepsi cola,pernod,peychaud bitters,pina colada mix,pineapple,pineapple juice,pineapple syrup,pink lemonade,pisang ambon,pisco,pomegranate juice,port,powdered sugar,prosecco,raspberry liqueur,raspberry syrup,raspberry vodka,red chili flakes,red wine,ricard,root beer,rose,rosemary,rosemary syrup,roses sweetened lime juice,rosso vermouth,ruby port,rum,rumple minze,rye whiskey,salt,sambuca,sarsaparilla,schweppes russchian,scotch,sherbet,sherry,sirup of roses,sloe gin,soda water,sour mix,southern comfort,soy sauce,spiced rum,sprite,st. germain,strawberries,strawberry liqueur,strawberry schnapps,sugar,sugar syrup,surge,sweet and sour,sweet vermouth,tabasco sauce,tea,tennessee whiskey,tequila,thyme,tia maria,tomato juice,tonic water,triple sec,vanilla,vanilla extract,vanilla ice-cream,vanilla syrup,vanilla vodka,vermouth,vodka,water,whipped cream,whipping cream,whiskey,whisky,white creme de menthe,white rum,white wine,wild turkey,wine,worcestershire sauce,wormwood,yellow chartreuse,yoghurt,yukon jack,zima
0,0,0,1,0,0,0,0,0,0,0,2,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1,2,0,0,1,0,0,1,0,0,0,0,0,2,0,0,0,1,1,0,0,2,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,2,0,0,1,0,0,0,0`;

// Function to parse CSV string into matrix
function parseCSV(csvString: string) {
  const rows = csvString.split('\n');
  const headers = rows[0].split(',');
  const dataRow = rows[1].split(',').map(Number); // Convert string values to numbers
  const matrix: number[][] = [];
  const ingredients: string[] = headers;
  const colors: string[] = [];

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

  // Create matrix and assign colors
  ingredients.forEach((ingredient, i) => {
    colors.push(getCategoryForIngredient(ingredient));
    const row = new Array(ingredients.length).fill(0);
    
    // Fill in the connections from the data row
    for (let j = 0; j < ingredients.length; j++) {
      if (i === j) continue; // Skip self-connections
      const value = dataRow[j];
      if (value > 0) {
        row[j] = value;
      }
    }
    matrix.push(row);
  });

  // Make the matrix symmetric
  for (let i = 0; i < matrix.length; i++) {
    for (let j = i + 1; j < matrix[i].length; j++) {
      const avg = (matrix[i][j] + matrix[j][i]) / 2;
      matrix[i][j] = matrix[j][i] = Math.round(avg);
    }
  }

  return { matrix, ingredients, colors };
}

export const INGREDIENT_MATRIX = parseCSV(RAW_CSV_DATA);