const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

    // const result = await booksCollection.insertMany()

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
