const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3031;

require("dotenv").config()
// firebase admin sdk
const admin = require("firebase-admin");
//DECODE
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());

// middleware
const verifyFirebaseToken = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    // unauthorized access
    return res.status(401).send({ message: "Unauthorized access" });
  }

  // format: "Bearer <token>"
  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Invalid token format" });
  }

  // verify token
  try {
    const verify = await admin.auth().verifyIdToken(token);
    req.tokenMail = verify.email;
    next();
  } catch {
    return res.status(401).send({ message: "Invalid token format" });
  }
};

require("dotenv").config();
//mongo DB client
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster.sofxk3k.mongodb.net/?appName=Cluster`;

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
    // await client.connect();

    const appDB = client.db("ImportExportHub");
    const appCollection = appDB.collection("products");
    const importCollection = appDB.collection("imports");

    // post a product
    app.post("/add-product", verifyFirebaseToken, async (req, res) => {
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
    app.get("/product-details/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const result = await appCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    //find product via email
    app.get("/my-products", verifyFirebaseToken, async (req, res) => {
      // check 403
      if (req.tokenMail !== req.query.email) {
        // forbidden access
        return res.status(403).send({ message: "Forbidden access" });
      }
      const email = req.query.email;
      const result = await appCollection.find({ userEmail: email }).toArray();
      res.send(result);
    });

    // delete product
    app.delete("/my-products/:id", verifyFirebaseToken, async (req, res) => {
      // check 403
      if (req.tokenMail !== req.headers.email) {
        // forbidden access
        return res.status(403).send({ message: "Forbidden access" });
      }
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await appCollection.deleteOne(query);
      res.send(result);
    });

    // update product
    app.patch("/update-product/:id", verifyFirebaseToken, async (req, res) => {
      // check 403
      if (req.tokenMail !== req.headers.email) {
        // forbidden access
        return res.status(403).send({ message: "Forbidden access" });
      }

      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateData = req.body;
      const update = {
        $set: updateData,
      };
      const result = await appCollection.updateOne(query, update);
      res.send(result);
    });

    // import product
    app.post("/import-product", verifyFirebaseToken, async (req, res) => {
      // check 403
      if (req.tokenMail !== req.headers.email) {
        // forbidden access
        return res.status(403).send({ message: "Forbidden access" });
      }
      const newProduct = req.body;
      console.log(newProduct);
      const result = await importCollection.insertOne(newProduct);
      // res.send(result);

      const query = { _id: new ObjectId(newProduct.productId) };
      console.log(query);
      const decQuantity = {
        $inc: {
          quantity: -newProduct.takeQuantity,
        },
      };
      const updateQuantity = await appCollection.updateOne(query, decQuantity);
      res.send({ result, updateQuantity });
    });

    // get import product
    app.get("/import-product", verifyFirebaseToken, async (req, res) => {
      // check 403
      if (req.tokenMail !== req.query.email) {
        // forbidden access
        return res.status(403).send({ message: "Forbidden access" });
      }

      const email = req.query.email;
      const result = await importCollection
        .find({ customerEmail: email })
        .toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// app.get("/", (req, res) => {
//   res.send("Welcome to Import Export Hub");
// });

app.listen(port, () => {
  console.log(`This app listening on port ${port}`);
});
