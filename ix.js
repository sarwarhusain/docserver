const express = require("express");
var cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
require("dotenv").config();

const uri = process.env.MONGODB_URI;

const app = express();
const port = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();//(for deployment)
    //work
    const db = client.db("guraferaDb");
    const destinationCollection = db.collection("destination");
    const bookingCollection = db.collection("bookings");
    app.get("/featured", async (req, res) => {
      const result = await destinationCollection.find().limit(4).toArray();
      res.json(result);
    });
    // verify with jwks
    const JWKS = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
    );
    //jwt
    const verifyToken = async (req, res, next) => {
      const header = req?.headers.authorization;
      if (!header) {
        return res.status(401).json({ message: "UnAuthorized" });
      }
      // console.log(header);

      const token = header.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "UnAuthorized" });
      }
      // console.log(token);
      //verify token

      try {
        const { payload } = await jwtVerify(token, JWKS);
        console.log(payload);
        next();
      } catch (err) {
        return res.status(401).json({ message: "Forbidden" });
      }
      // next();
    };
    //get all data
    app.get("/destination", async (req, res) => {
      const result = await destinationCollection.find().toArray();
      res.json(result);
    });

    // read(R)
    app.get("/destination/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };

      const result = await destinationCollection.findOne(query);
      res.json(result);
    });

    //update(patch)
    app.patch("/destination/:id", async (req, res) => {
      const id = req.params.id;
      const filterExpectedId = {
        _id: new ObjectId(id),
      };

      const WereToUpdate = req.body;
      const updateDoc = {
        $set: WereToUpdate,
      };
      const result = await destinationCollection.updateOne(
        filterExpectedId,
        updateDoc,
      );
      res.json(result);
    });
    //delete
    app.delete("/destination/:id", async (req, res) => {
      const { id } = req.params;
      const deleteQuery = {
        _id: new ObjectId(id),
      };
      console.log(deleteQuery);
      const result = await destinationCollection.deleteOne(deleteQuery);
      res.json(result);
    });

    //post(create=c)
    app.post("/addDataForDestination", async (req, res) => {
      //post from body and create a doc for post
      const addDestinationData = req.body;
      //insert to db
      const result = await destinationCollection.insertOne(addDestinationData);
      //send to db .then db to client
      res.json(result);
    });
    //booking data
    app.post("/booking", verifyToken, async (req, res) => {
      const addBooking = req.body;
      const result = await bookingCollection.insertOne(addBooking);
      res.json(result);
    });
    //booking single data
    app.get("/booking/:userId", async (req, res) => {
      const { userId } = req.params;
      const query = {
        userId: userId,
      };
      const result = await bookingCollection.find(query).toArray();
      res.json(result);
    });
    //booking delete data
    app.delete("/booking/:bookingId", async (req, res) => {
      const { bookingId } = req.params;
      const deleted = {
        _id: new ObjectId(bookingId),
      };
      const result = await bookingCollection.deleteOne(deleted);
      res.json(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });//(for deployment)
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World! this server from backer server");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
