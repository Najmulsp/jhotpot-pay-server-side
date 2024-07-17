const express = require ('express');
const cors = require ('cors');
const app = express();
require('dotenv').config();
var jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.port || 5000;

// middleware
app.use(cors()); //origin:[ http://localhost/5173,]

app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.njogpdx.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log('token:', token);

  if (!token) {
    return res.status(401).send({ message: 'Unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized access' })
    }
    req.user = decoded
    next();
  })
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true : false,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    const userCollection  = client.db('JhotpotPay').collection('users');

            // jwt generate
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '365d', })
      res
        .cookie('token', token, cookieOptions)
        .send({ success: true })
    })

    app.post('/logout', async (req, res) => {
      const user = req.user;
      res.clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    })

              // user related api
      app.post('/users', async(req, res) =>{
        const info = req.body;
          // check before inserting if the user is already exists or not
        // const query = {email: info.email};
        // const existingUser = await userCollection.findOne(query);
        // if(existingUser){
        //     return res.send({message: 'User is already exists', insertedId: null})
        // }
        const result = await userCollection.insertOne(info);
          res.send(result)
    })





    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res)=>{
    res.send('jhotpot pay server is running');
})

app.listen(port, ()=>{
    console.log(`jhotpot pay server is running on ${port} port`)
})