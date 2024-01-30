const express=require ('express');
const app=express();
const cors=require ('cors');

var jwt = require('jsonwebtoken');
require('dotenv').config()
const port=process.env.PORT || 8000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// using middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ihmonoj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database=client.db('bistroDb');
    const menuCollection=database.collection('menu');
    const usersCollection=database.collection('users');
    const reviewCollection=database.collection('reviews');
    const cartCollection=database.collection('cart');
   
    app.post('/jwt',async(req,res)=>{
      console.log('requ jwt',req)
      const user=req.body;
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'3h'});
      res.send({token})
    })
    // middlewares 
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }
 // use verify admin after verifyToken
 const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email };
  console.log('query',query)
  const user = await usersCollection.findOne(query);
  const isAdmin = user?.role === 'admin';
  console.log('isAdmin',isAdmin)
  if (!isAdmin) {
    return res.status(403).send({ message: 'forbidden access' });
  }
  next();
}
    app.get('/menu',async(req,res)=>{
        const query={};
        const result= await menuCollection.find(query).toArray()
        res.send(result)
    })
    app.get('/reviews',async(req,res)=>{
        const result=await reviewCollection.find().toArray()
        res.send(result)
    });
    app.get('/cart',async(req,res)=>{
      const email=req.query.email;
      const query={email:email}
      const result=await cartCollection.find(query).toArray();
      res.send(result)
    });
    // user verify admin after verify token
    
     // users related api
     app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      console.log('headers DLSDLFSDkkk',req?.headers?.authorization)
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
console.log('email',email)
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })

    // user related api
    app.post('/users',async(req,res)=>{
      const user = req.body;
      // insert email if user doesnt exists: 
      // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);
    
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })
    // user delete api
    app.delete('/users/:id',verifyAdmin,verifyToken,async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)}
      const result=await usersCollection.deleteOne(query);
      res.send(result)
    });
    // user admin api
    app.patch('/users/admin/:id',verifyToken,verifyAdmin, async(req,res)=>{
      const id=req.params.id;
      const filter={_id:new ObjectId(id)}
      const updateDoc={
        $set:{
          role:"admin"
        }
      }
      const result=await usersCollection.updateOne(filter,updateDoc)
      res.send(result)
    })
    app.post('/cart',async(req,res)=>{
      const cartItem=req.body;
      const result=await cartCollection.insertOne(cartItem)
      res.send(result)
    });
    app.delete('/cart/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)};
      const result=await cartCollection.deleteOne(query);
      res.send(result)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("bistroDb").collection("users");
    const menuCollection = client.db("bistroDb").collection("menu");
    const reviewCollection = client.db("bistroDb").collection("reviews");
    const cartCollection = client.db("bistroDb").collection("carts");

    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })

    // middlewares 
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }

    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }

    // users related api
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      // insert email if user doesnt exists: 
      // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })

    // menu related apis
    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });
    app.post('/menu',verifyToken,verifyAdmin, async(req,res)=>{
      const item=req.body;
      const result=await menuCollection.insertOne(item)
      res.send(result)
    });
    // spicific menu item showing display
    app.get('/menu/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)}
      const result=await menuCollection.findOne(query);
      res.send(result)
    });
  app.patch('/menu/:id',async(req,res)=>{
    const item=req.body;
    const id=req.params.id;
    const filter={_id:new ObjectId(id)}
    const updatedDoc={
          $set: {
          name: item.name,
          category: item.category,
          price: item.price,
          recipe: item.recipe,
          image: item.image
        }
    }
    const result=await menuCollection.updateOne(filter,updatedDoc)
    res.send(result)
  })
    app.delete('/menu/:id',verifyToken,verifyAdmin,async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)}
      const result=await menuCollection.deleteOne(query)
      res.send(result)
    });
    app.get('/reviews', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    })

    // carts collection
    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post('/carts', async (req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    });

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// default route

app.get('/',async(req,res)=>{
    res.send('boss is starting')
})
app.listen(port,()=>{
    console.log(`bistro boss is running port ${port}`)
})