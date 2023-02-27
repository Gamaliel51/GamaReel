const express = require('express')
const { checkAuthentication } = require('../controllers/authMiddleware')
const { User } = require('../schemas')


const router = express.Router()

router.post('/add', checkAuthentication, async (req, res) => {
    try{
        const videoId = req.body.videoId
        const user = await User.findOne({email: req.user.name})
        if(user.savedVideos.includes(videoId)){
            return res.json({status: 'ok'})
        }
        if(user.channelVideos.includes(videoId)){
            return res.json({status: 'ok'})
        }
        let temp = user.savedVideos
        temp.push(videoId)
        user.savedVideos = temp
        await user.save()
        res.json({status: 'ok'})
    }
    catch(err){
        console.error(err)
    }
})




module.exports = router