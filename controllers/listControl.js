const { Video, User } = require("../schemas")
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { ObjectId } = require("mongodb")
require('dotenv').config()

const listHome = async (req, res) => {
    try{
        const result = await Video.aggregate([{$sample: { size: 16}}])
        res.json(result)
    }
    catch(err){
        res.sendStatus(500)
    }
}

const listRecommendations = async (req, res) => {
    try{
        const count = await Video.countDocuments()
        const random = Math.floor(Math.random() * count)
        if(!req.user){
            const result = await Video.aggregate([{$sample: { size: 40}}]).skip(random)
            res.json(result)
        }
        else{
            let genres = []
            const user = await User.findOne({email: req.user.name})
            const video1 = await Video.findOne({videoName: user.history[0]})
            const video2 = await Video.findOne({videoName: user.history[1]})
            const result = await Video.find({$or: [{Genres: { $in: video1.Genres}}, {Genres: { $in: video2.Genres}}], $where: {$ne: user.history}})
            res.json(result)
        }
    }
    catch(err){
        res.sendStatus(500)
    }
}

const listLibrary = async (req, res) => {
    try{
        const user = req.user
        
        const mailSearch = await User.findOne({email: user.name}).select('channelVideos savedVideos')

        let saved = []
        let channel = []

        for(let i = 0; i < mailSearch.savedVideos.length; i++){
            let result = await Video.findOne({videoId: mailSearch.savedVideos[i]})
            if(result){
                saved.push(result)
            }
        }
        for(let i = 0; i < mailSearch.channelVideos.length; i++){
            let result = await Video.findOne({videoId: mailSearch.channelVideos[i]})
            if(result){
                channel.push(result)
            }
        }

        res.json({saved: saved, channel: channel})
    }
    catch(err){
        res.sendStatus(500)
    }
}

const listLiked = async (req, res) => {
    try{
        const user = await User.findOne({email: req.user.name}).select('likedVideos dislikedVideos')
        res.json({liked: user.likedVideos, disliked: user.dislikedVideos})
    }
    catch(err){
        res.sendStatus(500)
    }
}

const listProfile = async (req, res) => {

    try{
        const user = req.user

        const userSearch = await User.findOne({channelName: user.name}).select('email channelName About')
        if(!userSearch){
            const mailSearch = await User.findOne({email: user.name}).select('email channelName About history')
            let history = []

            for(let i = 0; i < mailSearch.history.length; i++){
                const result = await Video.findOne({videoId: mailSearch.history[i]})
                if(result){
                    history.push(result)
                }
            }
            return res.json({user: mailSearch, history: history})
        }

        res.json({user: userSearch, history: result})
    }
    catch(err){
        res.sendStatus(500)
    }
}

const listChannel = async (req, res) => {
    try{
        const channelName = req.query.name

        const videos = await Video.find({channelName: channelName}).select('videoName videoId channelName views likes dislikes description Genres')

        const user = await User.findOne({channelName: channelName}).select('About')

        res.json({about: user.About, result: videos, status: 'success'})
    }
    catch(err){
        res.sendStatus(500)
    }

}

const deleteHistory = async (req, res) => {
    try{
        const user = req.user
        const videoId = req.query.videoId
        const currentUser = await User.findOne({email: user.name})

        let temp = currentUser.history.filter((id) => id !== videoId)
        currentUser.history = temp

        await currentUser.save()
        res.json({status: 'ok'})
    }
    catch(err){
        res.sendStatus(500)
    }
}

const deleteLibrary = async (req, res) => {
    try{
        const videoId = req.query.videoId
        const user = await User.findOne({email: req.user.name})
        if(user.savedVideos.includes(videoId)){
            let temp = user.savedVideos.filter((id) => id !== videoId)
            user.savedVideos = temp
            
            await user.save()
            return res.json({status: 'ok', section: 'saved'})
        }
        if(user.channelVideos.includes(videoId)){

            const uri = process.env.MONGODB_URI

            mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
            const db = mongoose.connection

            const bucket = new mongoose.mongo.GridFSBucket(db, {bucketName: 'videos'})

            db.collection('videos.files').findOne({filename: videoId}, async (err, result) => {
                if(err){
                    console.error(err)
                }
                bucket.delete(ObjectId(result._id))

                let temp = user.channelVideos.filter((id) => id !== videoId)
                user.channelVideos = temp
                
                await user.save()

                await Video.deleteOne({videoId: videoId})


                res.json({status: 'ok', section: 'yours'})

            })
            
        }
    }
    catch(err){
        res.sendStatus(500)
    }
}

module.exports = {listHome, listRecommendations, listLibrary, listLiked, listProfile, listChannel, deleteHistory, deleteLibrary}