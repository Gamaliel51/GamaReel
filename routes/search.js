const express = require('express')
const { Video } = require('../schemas')

const router = express.Router()

router.post('/', async (req, res) => {
    try{
        const searchText = req.body.search
        const videos = await Video.find({videoName: new RegExp(`${searchText}`, 'i')})
        if(videos.length !== 0){
            return res.json({status: 'ok', found: videos})
        }
        else{
            return res.json({status: 'none'})
        }
    }
    catch(err){
        console.error(err)
        res.sendStatus(500)
    }
})


module.exports = router