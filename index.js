const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express()
const port = process.env.PORT || 5000

//middleware
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.z01xkpj.mongodb.net/?retryWrites=true&w=majority`;

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
        const blogCollection = client.db('blogDB').collection('blogs')
        const commentCollection = client.db('blogDB').collection('comments')
        const wishlistCollection = client.db('blogDB').collection('wishlists')

        //get blog data from database 
        app.get('/api/v1/blogs', async (req, res) => {
            const result = await blogCollection.find().toArray()
            res.send(result)
        })
        //get featured blog from database
        app.get('/api/v1/blogs/sorted', async(req, res) =>{
            // const result = await blogCollection.find().sort({"longDescription.length": -1 }).limit(10).toArray()
            const result = await blogCollection.aggregate([
                {
                    $addFields: {
                        descriptionLength: { $strLenCP: "$longDescription"}
                    }
                },
                {
                    $sort: {
                        descriptionLength: -1
                    }
                },
                {
                    $limit: 10
                }
            ]).toArray()
            res.send(result)
        })
        //get recent blog from database
        app.get('/api/v1/recent', async(req, res) =>{
            const result = await blogCollection.find().sort({"postDate": -1}).limit(6).toArray()
            res.send(result)
        })

        //add blog to database
        app.post('/api/v1/addblog', async (req, res) => {
            const blog = req.body
            const result = await blogCollection.insertOne(blog)
            res.send(result)
        })

        //find individual blog
        app.get('/api/v1/blogs/:id', async (req, res) => {
            const id = req.params.id
            const query = {
                _id: new ObjectId(id)
            }
            const result = await blogCollection.findOne(query)
            res.send(result)
        })

        //update blog
        app.put('/api/v1/blogs/:id', async (req, res) => {
            const id = req.params.id
            const data = req.body
            const query = {
                _id: new ObjectId(id)
            }
            const options = { upsert: true }
            const updatedBlog = {
                $set: {
                    title: data.title,
                    category: data.category,
                    photo: data.photo,
                    shortDescription: data.shortDescription,
                    longDescription: data.longDescription,
                    postDate: data.postDate,
                    owner: data.owner
                }
            }
            const result = await blogCollection.updateOne(query, updatedBlog, options)
            res.send(result)
        })

        //get comment
        app.get('/api/v1/comments', async(req, res)=>{
            let query = {}
            if(req.query?.blogId){
                query = {
                    blogId: req.query.blogId
                }
            }
            const result = await commentCollection.find(query).toArray()
            res.send(result)
        })

        //post comment
        app.post('/api/v1/comments', async(req, res)=>{
            const comment = req.body
            const result = await commentCollection.insertOne(comment)
            res.send(result)
        })

        //get wishlist
        app.get('/api/v1/wishlists', async(req,res)=>{
            let query = {}
            if(req.query?.owner){
                query = {
                    owner: req.query.owner
                }
            }
            const result = await wishlistCollection.find(query).toArray()
            res.send(result)
        })
        //post wishlist
        app.post('/api/v1/wishlists', async(req, res)=>{
            const wishlist = req.body
            const result = await wishlistCollection.insertOne(wishlist)
            res.send(result)
        })
        //delete a blog from wishlist
        app.delete('/api/v1/wishlists/:id', async(req,res)=>{
            const id = req.params.id
            const query = {
                _id: new ObjectId(id)
            }
            const result = await wishlistCollection.deleteOne(query)
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
    res.send('Blog Website Server is Running')
})
app.listen(port, () => {
    console.log(`Blog website server is running on port: ${port}`)
})