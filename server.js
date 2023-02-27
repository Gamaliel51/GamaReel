const express = require('express')
const mongoose = require('mongoose')
const mongodb = require('mongodb')
const fs = require('fs')
const path = require('path')
const cors =  require('cors')
const {Video, User} = require('./schemas')
const listRoute = require('./routes/list')
const loginRoute = require('./routes/login')
const getVideoInfo = require('./routes/videoInfo')
const librayHandle = require('./routes/libraryHandler')
const uploadRoute = require('./routes/upload')
const updateUserRoute = require('./routes/updateUser')
const reportRoute = require('./routes/report')
const searchRoute = require('./routes/search')
const multer = require('multer');
require('dotenv').config()

const app = express()
const uri = process.env.MONGODB_URI

mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
const db = mongoose.connection

db.once('open', () => {
})

const bucket = new mongoose.mongo.GridFSBucket(db, {bucketName: 'videos'})

const storage = multer.memoryStorage()
const upload = multer({storage: storage})

app.use(express.static(path.join(__dirname + "/public")))
app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use('/list', cors(), listRoute)
app.use('/videoInfo', cors(), getVideoInfo)
app.use('/auth', cors(), loginRoute)
app.use('/library', cors(), librayHandle)
app.use('/uploadvideo', uploadRoute)
app.use('/updateuser', updateUserRoute)
app.use('/search', cors(), searchRoute)
app.use('/report', cors(), reportRoute)

app.get('/watch', async (req, res) => {
    try{
        const vidId = req.query.vid
        res.setHeader('Access-Control-Allow-Origin', '*')

        const vidSearch = await Video.findOne({videoId: vidId}).select('videoName videoId')
        db.collection('videos.files').findOne({filename: vidSearch.videoId}, (err, result) => {

            if(err){
                console.error(err)
            }

            let range = req.headers.range
            const CHUNK_SIZE = 10 ** 6; // 1MB
            let size = result.length
            let start = Number(range.replace(/\D/g, ""))
            let end = Math.min(start + CHUNK_SIZE, size - 1)

            const contentLength = end - start + 1;
            const headers = {
                "Content-Range": `bytes ${start}-${end}/${size}`,
                "Accept-Ranges": "bytes",
                "Content-Length": contentLength,
                "Content-Type": "video/mp4",
            };
            res.writeHead(206, headers)


            bucket.openDownloadStream(result._id, {start, end}).pipe(res)
        })
    }
    catch(err){
        res.sendStatus(500)
    }

})

app.get('/randomvideo', async (req, res) => {
    try{
        const count = await Video.countDocuments()
        const random = Math.floor(Math.random() * count)
        const video = await Video.findOne().skip(random)
        res.redirect(`/watch?vid=${video.videoId}`)
    }
    catch(err){
        res.sendStatus(500)
    }
})

app.get('/thumb', async (req, res) => {
    try{
        const name = req.query.name
        const picSearch = await Video.findOne({videoName: name})

        res.send(picSearch.thumbnail)
    }
    catch(err){
        res.sendStatus(500)
    }
})

app.get('/profilethumb', async (req, res) => {
    try{
        const name = req.query.name
        const picSearch = await User.findOne({channelName: name})

        res.send(picSearch.picture)
    }
    catch(err){
        res.sendStatus(500)
    }
})

app.get('/onlinecheck', cors(), (req, res) => {
    try{
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.json({status: 'ok'})
    }
    catch(err){
        res.sendStatus(500)
    }
})

app.get('/*', function(req,res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("*", (req, res) => {
    res.send("Error")
})

app.listen(process.env.PORT, () => {
    console.log('listening on port')
})
