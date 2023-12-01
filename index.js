const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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
        const usersCollection = client.db('forumDB').collection('users');
        const postsCollection = client.db('forumDB').collection('posts');
        const commentsCollection = client.db('forumDB').collection('comments');
        const reportedCommentCollection = client.db('forumDB').collection('reported');
        const announcementCollection = client.db('forumDB').collection('announcement');


        //jwt related api 
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });

        })

        //middle ware jwt
        const verifyToken = (req, res, next) => {
            const authHeader = req?.headers?.authorization;
            // console.log('inside verify token', req.headers.authorization);
            if (!authHeader) {
                return res.status(401).send({ message: 'forbidded access' })
            }
            const token = authHeader.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'forbidden access' })
                }
                req.decoded = decoded;
                next();
            })
        }

        //use verify admin after verify token .
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                res.status(403).send({ message: 'Forbidden Access' })
            }
            next()
        }


        //user related api 
        app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result)
        })

        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req?.params?.email;
            // if(email !== req?.decoded?.email){
            //     return res.status(403).send({message: 'unauthorized access'})
            // }

            const query = { email: email }
            const user = await usersCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === "admin";
            }

            res.send({ admin });

        })


        //make vote route

        app.patch('/posts/vote/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $inc: {
                    upvote: 1
                }
            }
            const result = await postsCollection.updateOne(filter, updateDoc)
            res.send(result)
        })



        //make admin to update admin role
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })



        //post related api 

        // get posts data to the database
        app.get('/posts', async (req, res) => {
            const result = await postsCollection.find().toArray();
            res.send(result)
        })

        app.get('/my-posts', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await postsCollection.find(query).toArray();
            res.send(result)
        })



        // find a single data 
        app.get('/posts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await postsCollection.findOne(query)
            res.send(result)
        })

        // Add post to the database
        app.post('/posts', async (req, res) => {
            const newPost = req.body;
            // console.log(newAsignment);
            const result = await postsCollection.insertOne(newPost)
            res.send(result)
        })


        //comment related api start

        app.get('/comments', async (req, res) => {
            const result = await commentsCollection.find().toArray();
            res.send(result)
        })


        // app.get('/comments-details/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) }
        //     const result = await commentsCollection.findOne(query)
        //     res.send(result)
        // })


        app.post('/comments', async (req, res) => {
            const newComment = req.body;
            // console.log(newComment);
            const result = await commentsCollection.insertOne(newComment)
            res.send(result)
        })



        //comment related api end


        // Reported comment related api start

        app.get('/reported', async (req, res) => {
            const result = await reportedCommentCollection.find().toArray();
            res.send(result)
        })

        app.post('/reported', async (req, res) => {
            const newReport = req.body;
            // console.log(newComment);
            const result = await reportedCommentCollection.insertOne(newReport)
            res.send(result)
        })

        // Reportedcomment related api end


        //announcement related api start

        app.get('/announcement', async (req, res) => {
            const result = await announcementCollection.find().toArray();
            res.send(result)
        })


        app.post('/announcement', async (req, res) => {
            const newAnnouncement = req.body;
            // console.log(newAsignment);
            const result = await announcementCollection.insertOne(newAnnouncement)
            res.send(result)
        })

        //announcement related api end




        // delete a post by delete operation
        app.delete('/posts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            // const query = {_id: id}
            const result = await postsCollection.deleteOne(query)
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