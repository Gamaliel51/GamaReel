const express = require('express')
const multer = require('multer');
const mongoose = require('mongoose')
const mongodb = require('mongodb')
const jwt = require('jsonwebtoken')
const {Video, User} = require('../schemas')
const { Readable } = require('stream')
require('dotenv').config()

const router = express.Router()

const uri = process.env.MONGODB_URI
const url = process.env.MONGODB_URL

mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
const db = mongoose.connection


const bucket = new mongoose.mongo.GridFSBucket(db, {bucketName: 'videos'})

const storage = multer.memoryStorage()
const upload = multer({storage: storage});


router.post('/', upload.array('files', 2), async (req, res, next) => {
    try{
        const authHeader = req.body.token
        if(authHeader){

            const token = authHeader.split(' ')[1]
            let username = ''

            jwt.verify(token, process.env.ACCESS_TOKEN, async (err, user) => {
                if(err){
                    return res.sendStatus(403)
                }
        
                const curUser = await User.findOne({email: user.name})
                username = curUser.channelName
                let temp = curUser.channelVideos
                temp.push(`${req.body.videoname}_${req.body.channel}`)
                curUser.channelVideos = temp
                await curUser.save()

                if(username !== req.body.channel){
                    return res.status(400)
                }

                try{
                    
                    const thumb = req.files[0]
            
                    const video = new Video({
                        videoName: req.body.videoname,
                        channelName: req.body.channel,
                        videoId: `${req.body.videoname}_${req.body.channel}`,
                        views: 0,
                        likes: 0,
                        dislikes: 0,
                        description: req.body.description,
                        Genres: req.body.genres,
                        thumbnail: thumb.buffer,
                    })
            
                    await video.save()
                    mongodb.MongoClient.connect(url, function(error, client){
                        if(error){
                            console.error(error)
                            return res.sendStatus(500)
                        }
                        const vidUpStream = bucket.openUploadStream(`${req.body.videoname}_${req.body.channel}`)
                        const vidReadStream = new Readable()
                        vidReadStream.push(req.files[1].buffer)
                        vidReadStream.push(null)
                        vidReadStream.pipe(vidUpStream)
                        vidUpStream.on('finish', () => {
                            res.redirect(`${process.env.HOST_URL}profile`)
                        })
                    })
                }
                catch(err){
                    console.error(err)
                    res.sendStatus(500)
                }
                
            })
        }
        else{
            res.status(401)
        }
    }
    catch(err){
        res.sendStatus(500)
    }
})

module.exports = router