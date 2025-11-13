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
    // search product
    app.get("/search", async (req, res) => {
      const searchText = req.query.search;
      const result = await appCollection
        .find({ productName: { $regex: searchText, $options: "i" } })
        .toArray();
      res.send(result);
    });
    //find single product
    app.get("/product-details/:id", async (req, res) => {
      const id = req.params.id;
      const result = await appCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    //find product via email
    app.get("/my-products", async (req, res) => {
      const email = req.query.email;
      const result = await appCollection.find({ userEmail: email }).toArray();
      res.send(result);
    });
    // delete product
    app.delete("/my-products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await appCollection.deleteOne(query);
      res.send(result);
    });
    // import product
    app.post("/import-product", async (req, res) => {
      const newProduct = req.body;
      console.log(newProduct);
      const result = await importCollection.insertOne(newProduct);
      res.send(result);

      // const query = {_id : new ObjectId(newProduct.productId)}
      // console.log(query)
      // const decQuantity = {
      //   $inc : {
      //     quantity : -1
      //   }
      // }
      // const updateQuantity = await appCollection.updateOne(query, decQuantity)
      // res.send({result, updateQuantity});
    });
    // get import product
    app.get("/import-product", async (req, res) => {
      const email = req.query.email;
      const result = await importCollection
        .find({ customerEmail: email })
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
