const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3031;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://importExportHubAdmin:wGQYgWvG5JPC7L1I@cluster.sofxk3k.mongodb.net/?appName=Cluster";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
    await client.connect();

    const appDB = client.db("ImportExportHub");
    const appCollection = appDB.collection("products");
    const importCollection = appDB.collection("imports");

    // post a product
    app.post("/add-product", async (req, res) => {
      const newProduct = req.body;
      const result = await appCollection.insertOne(newProduct);
      res.send(result);
    });
    // get all product
    app.get("/all-products", async (req, res) => {
      const result = await appCollection.find().toArray();
      res.send(result);
    });
    // get latest 6 product
    app.get("/latest-products", async (req, res) => {
      const result = await appCollection
        .find()
        .sort({ dateAdded: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to Import Export Hub");
});

app.listen(port, () => {
  console.log(`This app listening on port ${port}`);
});
