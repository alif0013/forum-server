const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


//middle ware 
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.98p3czt.mongodb.net/?retryWrites=true&w=majority`;

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
        // await client.connect();
        //creat databse file name
        const postsCollection = client.db('forumDB').collection('posts');

         // get posts data to the database
         app.get('/posts', async (req, res) => {
            const result = await postsCollection.find().toArray();
            res.send(result)
        })

          // find a single data 
        //   app.get('/posts/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) }
        //     const result = await postsCollection.findOne(query)
        //     res.send(result)
        // })

     // Add post to the database
        app.post('/posts', async (req, res) => {
            const newPost = req.body;
            // console.log(newAsignment);
            const result = await postsCollection.insertOne(newPost)
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
run().catch(console.dir);








app.get('/', (req, res) => {
    res.send('Forum Server is Running')
})

app.listen(port, () => {
    console.log(`Forum server is running on PORT ${port}`);
})