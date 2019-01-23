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

  categoryOccurences(db, () => {
    client.close();
  });
});

function categoryOccurences(db, callback) {
  const collection = db.collection('recipes');

  collection.distinct('categories', {}, (err, categories) => {
    console.log(categories.length)
  })

  collection.aggregate([{
      "$unwind": "$categories"
    },
    {
      "$project": {
        "_id": 1,
        "categories": 1,
        "count": 1,
        "rating": {
          "$cond": {
            if: {
              "$eq": ["$rating", 0]
            },
            then: null,
            else: "$rating"
          }
        }
      }
    },
    {
      "$group": {
        "_id": "$categories",
        "count": {
          "$sum": 1
        } //,
        // "average": {
        //   "$avg": "$rating"
        // }
      }
    },
    {
      "$sort": {
        "count": -1
      }
    },
    {
      "$limit": 500
    }
  ], (err, cursor) => {
    cursor.forEach((val, index) => {
      console.log(val);
    }).then(() => {
      callback(null);
    }).catch((err) => {
      console.error(err);
    });
  })
}