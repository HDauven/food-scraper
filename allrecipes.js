require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const objectHash = require("object-hash");
const mongoose = require("mongoose");

const Recipe = require("./models/recipe");
const {
  getMinutes,
  sleepTimer
} = require("./util");

const {
  DB_HOST,
  DB_USER,
  DB_PASS
} = process.env;
const MONGODB_URI = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_HOST}/recipes?retryWrites=true`;
mongoose
  .connect(
    MONGODB_URI, {
      useNewUrlParser: true
    }
  )
  .catch(err => console.log(err));

const extractRecipeData = async (recipeId, data, url) => {
  try {
    const $ = cheerio.load(data);

    const imageUrl = $("#BI_openPhotoModal1").attr("src") || null;
    if (!imageUrl) {
      console.log(`Recipe ${recipeId} has no image`);
      return null;
    }

    const name = $("#recipe-main-content").text() || null;
    const recipeBy = $(".submitter__name").text() || null;
    const rating = Number($(".rating-stars").attr("data-ratingstars"));
    const reviews = Number(
      $(".review-count")
      .text()
      .match(/\d+/g)
      .join("")
    );

    const categories = [];
    $(".toggle-similar__title").each((index, element) => {
      const category = $(element)
        .text()
        .trim();

      if (category !== "Home" && category !== "Recipes") {
        categories.push(category);
      }
    });

    const ingredients = [];
    $("span")
      .filter(".recipe-ingred_txt")
      .not(".white")
      .each((index, element) => {
        const ingredient = $(element).text();

        if (ingredient.length > 0) {
          ingredients[index] = ingredient;
        }
      });

    const instructions = [];
    $(".recipe-directions__list--item").each((index, element) => {
      const instruction = $(element)
        .text()
        .trim();

      if (instruction.length > 0) {
        instructions[index] = instruction;
      }
    });

    const nutrition = {
      calories: null,
      fat: null,
      carbs: null,
      proteins: null,
      cholesterol: null,
      sodium: null
    };
    $(".nutrition-summary-facts")
      .children()
      .filter("span")
      .each((index, element) => {
        const el = $(element);

        switch (el.attr("itemprop")) {
          case "calories":
            nutrition.calories = el.text();
            break;
          case "fatContent":
            nutrition.fat =
              el.text().trim() +
              el
              .next()
              .text()
              .replace(
                /\b[-.,()&$#!\[\]{};"']+\B|\B[-.,()&$#!\[\]{};"']+\b/g,
                ""
              );
            break;
          case "carbohydrateContent":
            nutrition.carbs =
              el.text().trim() +
              el
              .next()
              .text()
              .replace(
                /\b[-.,()&$#!\[\]{};"']+\B|\B[-.,()&$#!\[\]{};"']+\b/g,
                ""
              );
            break;
          case "proteinContent":
            nutrition.proteins =
              el.text().trim() +
              el
              .next()
              .text()
              .replace(
                /\b[-.,()&$#!\[\]{};"']+\B|\B[-.,()&$#!\[\]{};"']+\b/g,
                ""
              );
            break;
          case "cholesterolContent":
            nutrition.cholesterol =
              el.text().trim() +
              el
              .next()
              .text()
              .replace(
                /\b[-.,()&$#!\[\]{};"']+\B|\B[-.,()&$#!\[\]{};"']+\b/g,
                ""
              );
            break;
          case "sodiumContent":
            nutrition.sodium =
              el.text().trim() +
              el
              .next()
              .text()
              .replace(
                /\b[-.,()&$#!\[\]{};"']+\B|\B[-.,()&$#!\[\]{};"']+\b/g,
                ""
              );
            break;
          default:
            break;
        }
      });

    const time = {
      prep: null,
      cook: null,
      readyIn: null
    };
    $(".prepTime")
      .children()
      .each((index, element) => {
        const el = $(element).attr("aria-label");
        if (!el) {
          return;
        }

        if (el.includes("Prep")) {
          time.prep = getMinutes(el);
        } else if (el.includes("Ready")) {
          time.readyIn = getMinutes(el);
        } else if (el.includes("Cook")) {
          time.cook = getMinutes(el);
        }
      });

    const nrOfServings = $("#metaRecipeServings").attr("content");
    let servings = null;
    if (nrOfServings == 1) {
      servings = "1 serving";
    } else if (nrOfServings > 1) {
      servings = `${nrOfServings} servings`;
    }

    const recipe = {
      recipeId,
      name,
      categories,
      recipeBy,
      imageUrl,
      rating,
      time,
      servings,
      ingredients,
      instructions,
      nutrition,
      reviews,
      url,
      source: "allrecipes.com"
    };

    recipe.hash = objectHash(recipe);

    return recipe;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const saveAndUpdateRecipe = async recipe => {
  if (recipe) {
    const recipeId = recipe.recipeId;
    // check if recipe is already saved
    const storedRecipe = await Recipe.findOne({
      recipeId
    });

    // Check whether recipe already exists
    if (!storedRecipe) {
      // Save recipe
      await Recipe.create(recipe);
      console.log(`Recipe ${recipeId} saved`);
      return;
    }

    // Check whether the existing saved recipe has been changed
    if (storedRecipe.hash === recipe.hash) {
      console.log(`Recipe ${recipeId} up to date`);
      return;
    }

    // Update recipe
    await Recipe.updateOne({
      recipeId
    });
    console.log(`Recipe ${recipeId} updated`);
  }
};

const getRecipe = async recipeId => {
  try {
    const result = await axios.get(
      `https://www.allrecipes.com/recipe/${recipeId}/`
    );
    const {
      data,
      config: {
        url
      }
    } = result;
    const recipe = await extractRecipeData(recipeId, data, url);
    await saveAndUpdateRecipe(recipe);
  } catch (error) {
    if (error.response) {
      const {
        status
      } = error.response;
      switch (status) {
        case 404:
          console.log(`Recipe ${recipeId} status ${status}`);
          break;
        default:
          console.log(`Status ${status} - ${error.response}\n\n`);
          console.log(error.stack);
          break;
      }
    } else if (error.code) {
      if (error.code === "ECONNRESET") {
        console.log(`Connection refused for recipe ${recipeId}`);
        await sleepTimer(1000);
        process.exit();
      } else if (error.code === "ENOTFOUND") {
        console.log(`Recipe ${recipeId} ENOTFOUND`);
        return;
      } else {
        console.error(error);
      }
    } else {
      console.error(error);
    }
  }
};

// const startRecipeId = 22352;
const startRecipeId = 24384;
const endRecipeId = 270134;
(async function () {
  for (let recipeId = startRecipeId; recipeId < endRecipeId; recipeId++) {
    console.log(recipeId, new Date());
    getRecipe(recipeId);
    const offset = Math.floor(Math.random() * 4000) + 1000;
    await sleepTimer(1000 + offset);
  }
})();