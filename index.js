const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");

const app = express();

const port = process.env.PORT || 5000;

/// midddlewares

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.49zsx7x.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function dbConnect() {
  try {
    const database = client.db("bookHouse");
    const catagoriesCollection = database.collection("catagories");
    const usersCollection = database.collection("users");
    const booksCollection = database.collection("books");
    const addedListColletion = database.collection("addedList");

    app.get("/catagories", async (req, res) => {
      const query = {};
      const result = await catagoriesCollection.find(query).toArray();

      res.send(result);
    });

    app.post("/user", async (req, res) => {
      const data = req.body;

      const result = await usersCollection.insertOne(data);

      res.send(result);
    });

    app.post("/googleUser", async (req, res) => {
      const data = req.body;
      const query = { email: data.email };
      const user = await usersCollection.findOne(query);
      if (user) {
        res.send({ message: "It was listed in the database." });
        return;
      }

      const result = await usersCollection.insertOne(data);

      res.send(result);
    });

    app.get("/catagories/:id", async (req, res) => {
      const catagorie = req.params.id;

      const query = { catagorie: catagorie };

      const result = await booksCollection.find(query).toArray();

      res.send(result);
    });

    app.patch("/report/:id", async (req, res) => {
      const bookId = req.params.id;

      const query = { _id: ObjectId(bookId) };
      const updatedDoc = {
        $set: {
          reported: true,
        },
      };

      const result = await booksCollection.updateOne(query, updatedDoc);

      res.send(result);
    });

    app.post("/addtolist", async (req, res) => {
      const doc = req.body;
      if (!doc) {
        res.send({ message: "no valid information" });
        return;
      }
      const queryForFind = { bookId: doc.bookId, userEmail: doc.userEmail };
      const result = await addedListColletion.findOne(queryForFind);
      if (result === null) {
        const response = await addedListColletion.insertOne(doc);
        res.send(response);
        return;
      }
      res.send({ message: "exists" });
    });

    app.get("/orders", async (req, res) => {
      const userEmail = req.query.email;
      const filter = { userEmail: userEmail };
      const result = await addedListColletion.find(filter).toArray();

      if (result !== null && result.length > 0) {
        res.send({
          message: "success",
          userAddedData: result,
        });
        return;
      } else {
        res.send({ message: "no data" });
        return;
      }
    });

    ///error
  } catch (err) {
    console.log(err, "error from try catch block");
  }
}

dbConnect().catch((err) => console.log(err, "error from  dbconnect function"));

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => `server is running on ${port}`);
