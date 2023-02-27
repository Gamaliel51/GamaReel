const express = require('express')
const mongoose = require('mongoose')
const { checkAuthentication, checkAuthenticationAndPass } = require('../controllers/authMiddleware')
const { Video, User } = require('../schemas')
require('dotenv').config()

const router = express.Router()

router.get('/', checkAuthenticationAndPass, async (req, res) => {
    try{
        let videoName = req.query.name
        let channel = req.query.channel

        let video = await Video.findOne({videoId: `${videoName}_${channel}`})
        res.json(video)
        const update = await Video.updateOne({videoId: `${videoName}_${channel}`}, {views: (video.views + 1)})
        if(req.user){
            const user = await User.findOne({email: req.user.name})
            if(user.history.includes(`${videoName}_${channel}`)){
                let temp = user.history.filter((id) => id !== `${videoName}_${channel}`)
                temp.push(`${videoName}_${channel}`)
                user.history = temp
                await user.save()
            }
            else{
                let temp = user.history
                temp.push(`${videoName}_${channel}`)
                user.history = temp
                await user.save()
            }
        }
    }
    catch(err){
        res.sendStatus(500)
    }
})
.post('/like', checkAuthentication, async (req, res) => {
    try{
            
        const user = await User.findOne({email: req.user.name})
        let temp = user.likedVideos
        if(temp.includes(req.body.videoId)){
            temp = temp.filter((item) => item !== req.body.videoId)
            user.likedVideos = temp

            const video = await Video.findOne({videoId: req.body.videoId})
            let num = video.likes
            video.likes = num - 1

            await video.save()
            await user.save()

            return res.json({status: 'unliked'})
        }
        if(user.dislikedVideos.includes(req.body.videoId)){
            let disliketemp = user.dislikedVideos
            disliketemp = disliketemp.filter((item) => item !== req.body.videoId)
            user.dislikedVideos = disliketemp

            const video = await Video.findOne({videoId: req.body.videoId})
            let num = video.dislikes
            video.dislikes = num - 1
            await video.save()
        }
        temp.push(req.body.videoId)
        user.likedVideos = temp

        const video = await Video.findOne({videoId: req.body.videoId})
        let num = video.likes
        video.likes = num + 1

        await video.save()
        await user.save()

        res.json({status: 'ok'})
    }
    catch(err){
        res.sendStatus(500)
    }
})
.post('/dislike', checkAuthentication, async (req, res) => {
    try{
            
        const user = await User.findOne({email: req.user.name})
        let temp = user.dislikedVideos
        if(temp.includes(req.body.videoId)){
            temp = temp.filter((item) => item !== req.body.videoId)
            user.dislikedVideos = temp

            const video = await Video.findOne({videoId: req.body.videoId})
            let num = video.dislikes
            video.dislikes = num - 1

            await video.save()
            await user.save()

            return res.json({status: 'undisliked'})
        }
        if(user.likedVideos.includes(req.body.videoId)){
            let liketemp = user.likedVideos
            liketemp = liketemp.filter((item) => item !== req.body.videoId)
            user.likedVideos = liketemp

            const video = await Video.findOne({videoId: req.body.videoId})
            let num = video.likes
            video.likes = num - 1

            await video.save()
        }
        temp.push(req.body.videoId)
        user.dislikedVideos = temp

        const video = await Video.findOne({videoId: req.body.videoId})
        let num = video.dislikes
        video.dislikes = num + 1

        await video.save()
        await user.save()

        res.json({status: 'ok'})
    }
    catch(err){
        res.sendStatus(500)
    }
})

module.exports = router