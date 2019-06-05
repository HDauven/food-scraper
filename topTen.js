require("dotenv").config();
const fs = require('fs');
const downloadImage = require("./downloadImage");

const dbName = "recipes";
const {
  DB_HOST,
  DB_USER,
  DB_PASS
} = process.env;
const MONGODB_URI = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_HOST}/recipes?retryWrites=true`;

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

(async () => {
  // start here
  const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true
  });
  const connection = await client.connect();
  const collection = await connection.db(dbName).collection('recipes');

  const categories = await topTenPerCategory(collection);
  const recipes = await retrieveRecipesForCategories(collection, categories);

  fs.writeFile('topTenRecipes.json', JSON.stringify(recipes), (err) => {
    if (err) throw err;
    console.log('Saved file!');
  });

  await client.close();
})();

let counter = 0;

async function topTenPerCategory(collection) {
  return new Promise((resolve, reject) => {
    const topTens = [];

    collection.find({
      "categories.0": {
        "$exists": true
      },
      "rating": {
        "$ne": 0
      },
      "reviews": {
        "$gte": 20
      }
    }).count((err, categories) => {
      console.log(categories)
    })

    collection.aggregate([{
        "$match": {
          "categories.0": {
            "$exists": true
          },
          "rating": {
            "$ne": 0
          },
          "reviews": {
            "$gte": 10
          }
        }
      },
      {
        "$project": {
          "_id": 1,
          "categories": 1,
          "rating": 1,
          "reviews": 1,
          "name": 1
        }
      },
      {
        "$unwind": "$categories"
      },
      {
        "$sort": {
          "rating": -1,
          "reviews": -1
        }
      },
      {
        "$group": {
          "_id": "$categories",
          "nrOfRecipes": {
            "$sum": 1
          },
          "recipes": {
            "$push": {
              "id": "$_id",
              "rating": "$rating",
              "reviews": "$reviews",
              "name": "$name"
            }
          }
        }
      },
      {
        "$match": {
          "nrOfRecipes": {
            "$gte": 10
          }
        }
      }, {
        "$project": {
          "_id": 1,
          "nrOfLowReviewCount": 1,
          "recipes": {
            "$slice": ["$recipes", 10]
          }
        }
      }
    ], (err, cursor) => {
      cursor.forEach((val, index) => {
        counter += 1;
        //console.log(counter, val);
        topTens.push(val);
      }).then(() => {
        resolve(topTens);
      }).catch((err) => {
        reject(err);
      });
    });
  });
}

async function retrieveRecipesForCategories(collection, categories) {
  const topTenRecipes = []
  for (let category of categories) {
    let categoryObject = {
      name: category._id
    };
    let recipeArray = []

    for (let recipe of category.recipes) {
      const recipeData = await collection.findOne({
        _id: new ObjectID(recipe.id)
      });
      await downloadImage(recipeData.imageUrl, recipeData.recipeId + '.jpg');
      recipeArray.push(recipeData);
    };
    categoryObject.recipes = recipeArray;
    topTenRecipes.push(categoryObject);
  };
  return topTenRecipes;
}