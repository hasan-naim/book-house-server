const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();

const port = process.env.PORT || 5000;

/// midddlewares

app.use(express.json());
app.use(cors());

const verifyJwt = (req, res, next) => {
  let token = req.headers.authorization;
  if (!token) {
    res.status(401).send({ message: "unauthorized user" });
    return;
  }
  token = token.split(" ")[1];
  const decoded = jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    (err, decoded) => {
      if (err) {
        res.status(403).send({ message: "unauthorized access" });
        return;
      }

      req.decoded = decoded;
      next();
    }
  );
};

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

    /// jwt token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("jwt");
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d",
      });
      res.send({ status: 200, token });
    });

    app.get("/catagories", async (req, res) => {
      const query = {};
      const result = await catagoriesCollection.find(query).toArray();

      res.send(result);
    });

    app.get("/user", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const result = await usersCollection.findOne(filter);
      res.send(result);
    });
    /// get reported book
    app.get("/reportedBook", async (req, res) => {
      const filter = { reported: true };
      const result = await booksCollection.find(filter).toArray();
      res.send(result);
    });
    /// delete reported book
    app.delete("/reportedBook", async (req, res) => {
      const id = req.query.id;
      const filter = { _id: ObjectId(id) };
      const result = await booksCollection.deleteOne(filter);
      res.send(result);
    });
    app.get("/singleUser", async (req, res) => {
      const id = req.query.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.findOne(filter);
      res.send(result);
    });

    /// get advertise books
    app.get("/advertised", async (req, res) => {
      const query = { advertised: true };
      const result = await booksCollection.find(query).toArray();
      res.send(result);
    });

    /// delete user
    app.delete("/user", async (req, res) => {
      const id = req.query.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });

    /// get buyers
    app.get("/allbuyers", async (req, res) => {
      const query = { role: "buyer" };

      const result = await usersCollection.find(query).toArray();
      if (result === null) {
        res.send({ message: "no data", data: [] });
      } else {
        res.send({ message: "success", data: result });
      }
    });

    /// get sellers
    app.get("/allsellers", async (req, res) => {
      const query = { role: "seller" };
      const result = await usersCollection.find(query).toArray();
      if (result === null) {
        res.send({ message: "no data", data: [] });
      } else {
        res.send({ message: "success", data: result });
      }
    });

    /// make verify or unverify user
    app.patch("/verifyUser", async (req, res) => {
      const condition = req.query.condition;
      const id = req.query.id;
      const query = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          verified: condition === "true",
        },
      };

      const result = await usersCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    app.post("/user", async (req, res) => {
      const data = req.body;

      const result = await usersCollection.insertOne(data);

      res.send(result);
    });

    app.post("/addBook", async (req, res) => {
      const data = req.body;

      try {
        const result = await booksCollection.insertOne(data);
        res.send({ message: "success" });
      } catch (err) {
        console.log(err);
      }
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

    /// get books by specific user
    app.get("/myaddedbooks", async (req, res) => {
      const userId = req.query.userId;
      const query = { postUserId: userId };
      const result = await booksCollection.find(query).toArray();
      if (result !== null) {
        res.send({ message: "success", data: result });
      } else {
        res.send({ message: "success", data: [] });
      }
    });

    /// delete book by seller
    app.delete("/book", async (req, res) => {
      const id = req.query.id;
      const query = { _id: ObjectId(id) };
      const result = await booksCollection.deleteOne(query);
      res.send(result);
    });

    /// advertising the book
    app.patch("/advertise", async (req, res) => {
      const id = req.query.id;
      const condition = req.query.condition;
      const query = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          advertised: condition === "true",
        },
      };
      const result = await booksCollection.updateOne(query, updatedDoc);
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
