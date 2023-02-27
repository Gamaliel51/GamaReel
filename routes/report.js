const express = require('express')
const { Report } = require('../schemas')


const router = express.Router()

router.post('/video', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    try{
        const report = new Report({
            videoId: req.body.videoId
        })
        await report.save()
        res.json({status: 'ok'})
    }
    catch(err){
        res.sendStatus(500)
    }
})

module.exports = router