const mongoose = rquire("mongoose");

const recipeSchema = new mongoose.Schema({
  recipeId: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  categories: {
    type: [String],
    index: true
  },
  recipeBy: String,
  imageUrl: String,
  rating: Number,
  time: {
    prep: String,
    cook: String,
    readyIn: String
  },
  servings: String,
  ingredients: [String],
  instructions: [String],
  nutrition: {
    calories: String,
    fat: String,
    carbs: String,
    proteins: String,
    cholesterol: String,
    sodium: String
  },
  reviews: Number,
  url: String,
  source: String,
  hash: {
    type: String,
    required: true,
    index: true
  }
});

module.exports = Recipe = mongoose.model("recipe", recipeSchema);