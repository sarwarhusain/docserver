const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5001;
require("dotenv").config();

//middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
// jwks
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    //CRUD operation
    const db = client.db("doctorDb");
    const doctorCollection = db.collection("doctors");
    const bookingCollection = db.collection("bookings");

    const verifyToken = async (req, res, next) => {
      const authHeader = req?.headers?.authorization;
      // console.log(authHeader);
      if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const token = authHeader.split(" ")[1];
      console.log(token);

      try {
        const { payload } = await jwtVerify(token, JWKS);
        console.log(payload);
        next();
      } catch (error) {
        return res.status(401).json({ message: "Forbidden" });
      }
    };

    //top rated doctor
    app.get("/top-rated", async (req, res) => {
      const result = await doctorCollection.find().limit(3).toArray();
      res.json(result);
    });

    //single doctor by dynamic id
    app.get("/doctors/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await doctorCollection.findOne(query);
      res.json(result);
    });

    app.get("/doctors", async (req, res) => {
      const result = await doctorCollection.find().toArray();
      res.json(result);
    });

    app.post("/doctors", async (req, res) => {
      const doctorData = req.body;
      const result = await doctorCollection.insertOne(doctorData);
      res.json(result);
    });

    //booking
    app.delete("/bookings/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const deleteQuery = {
        _id: new ObjectId(id),
      };
      // console.log( deleteQuery);
      const result = await bookingCollection.deleteOne(deleteQuery);
      res.json(result);
    });
    app.get("/bookings/:id", async (req, res) => {
      const { id } = req.params;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await bookingCollection.findOne(query);
      res.json(result);
    });
    app.patch("/bookings/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const filter = {
        _id: new ObjectId(id),
      };
      const editData = req.body;
      const query = {
        $set: editData,
      };
      const result = await bookingCollection.updateOne(filter, query);
      res.json(result);
    });

    app.get("/bookings", verifyToken, async (req, res) => {
      const result = await bookingCollection.find().toArray();
      res.json(result);
    });

    app.post("/bookings", async (req, res) => {
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData);
      res.json(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
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
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
