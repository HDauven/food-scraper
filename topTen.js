require("dotenv").config();

const dbName = "recipes";
const {
  DB_HOST,
  DB_USER,
  DB_PASS
} = process.env;
const MONGODB_URI = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_HOST}/recipes?retryWrites=true`;

const MongoClient = require('mongodb').MongoClient;

const client = new MongoClient(MONGODB_URI, {
  useNewUrlParser: true
});

client.connect(err => {
  const db = client.db(dbName);

  topTenPerCategory(db, () => {
    client.close();
  });
});

let counter = 0;

function topTenPerCategory(db, callback) {
  const collection = db.collection('recipes');

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
      console.log(counter, val);
      console.log();
    }).then(() => {
      callback(null);
    }).catch((err) => {
      console.error(err);
    });
  })
}