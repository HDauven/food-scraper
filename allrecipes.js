const axios = require('axios');
const cheerio = require('cheerio')

async function getRecipe(recipeId, data, url) {
  try { 
    const $ = cheerio.load(data);

    const imageUrl = $('#BI_openPhotoModal1').attr('src') || null;
    if (!imageUrl) {
      return null;
    }

    const categories = [];
    $('.toggle-similar__title').each((index, element) => {
      const category = $(element).text().trim();

      if (category !== 'Home' && category !== 'Recipes') {
        categories.push(category);
      }
    });

    const ingredients = [];
    $('span').filter('.recipe-ingred_txt').not('.white').each((index, element) => {
      const ingredient = $(element).text();

      if (ingredient.length > 0) {
        ingredients[index] = ingredient;
      }
    });

    const instructions = [];
    $('.recipe-directions__list--item').each((index, element) => {
      const instruction = $(element).text().trim();

      if (instruction.length > 0) {
        instructions[index] = instruction;
      }
    })

    const nutrition = {
      calories: null,
      fat: null,
      carbs: null,
      proteins: null,
      cholesterol: null,
      sodium: null
    }
    $('.nutrition-summary-facts').children().filter('span').each((index, element) => {
      const el = $(element);

      switch (el.attr('itemprop')) {
        case 'calories':
          nutrition.calories = el.text();
          break;
        case 'fatContent':
          nutrition.fat = el.text().trim() + el.next().text().replace(/\b[-.,()&$#!\[\]{};"']+\B|\B[-.,()&$#!\[\]{};"']+\b/g, "");
          break;
        case 'carbohydrateContent':
          nutrition.carbs = el.text().trim() + el.next().text().replace(/\b[-.,()&$#!\[\]{};"']+\B|\B[-.,()&$#!\[\]{};"']+\b/g, "");
          break;
        case 'proteinContent':
          nutrition.proteins = el.text().trim() + el.next().text().replace(/\b[-.,()&$#!\[\]{};"']+\B|\B[-.,()&$#!\[\]{};"']+\b/g, "");
          break;
        case 'cholesterolContent':
          nutrition.cholesterol = el.text().trim() + el.next().text().replace(/\b[-.,()&$#!\[\]{};"']+\B|\B[-.,()&$#!\[\]{};"']+\b/g, "");
          break;
        case 'sodiumContent':
          nutrition.sodium = el.text().trim() + el.next().text().replace(/\b[-.,()&$#!\[\]{};"']+\B|\B[-.,()&$#!\[\]{};"']+\b/g, "");
          break;          
        default:
          break;
      }
    });

    const time = {
      prep: null,
      cook: null,
      readyIn: null
    }
    $('.prepTime').children().each((index, element) => {
      const el = $(element).attr('aria-label');
      if (!el) {
        return;
      }

      if (el.includes('Prep')) {
        time.prep = el;
      } else if (el.includes('Ready')) {
        time.readyIn = el;
      } else if (el.includes('Cook')) {
        time.cook = el;
      }
    })

    const nrOfServings = $('#metaRecipeServings').attr('content');
    let servings = null;
    if (nrOfServings == 1) {
      servings = '1 serving';
    } else if (nrOfServings > 1) {
      servings = `${nrOfServings} servings`;
    }

    const recipe = {
      recipeId,
      name: $('#recipe-main-content').text() || null,
      categories,
      recipeBy: $('.submitter__name').text() || null,
      imageUrl,
      rating: $('.rating-stars').attr('data-ratingstars'),
      time,
      servings,
      ingredients,
      instructions,
      nutrition,
      reviews: $('.review-count').text().match(/\d+/g).join(''),
      url,
      source: 'allrecipes.com'
    }
    
    return recipe;
  } catch (error) {
    console.error(error);
  }
}

// const recipeId = 22364;
 const recipeId = 256165;
// const recipeId = 57375;
//const recipeId = 100;
axios.get(`https://www.allrecipes.com/recipe/${recipeId}/`).then(result => {
  const { data, config: { url } } = result;
  console.log(url);
  getRecipe(recipeId, data, url)
}).catch(error => {

})