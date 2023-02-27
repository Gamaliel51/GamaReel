const express = require('express')
const multer = require('multer');
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {Video, User, Login} = require('../schemas')
const { Readable } = require('stream');
const { checkAuthentication } = require('../controllers/authMiddleware');
require('dotenv').config()

const router = express.Router()

const uri = process.env.MONGODB_URI

mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
const db = mongoose.connection


const storage = multer.memoryStorage()
const upload = multer({storage: storage});

router.post('/', upload.single('file'), async (req, res) => {
    const authHeader = req.body.token
    const token = authHeader.split(' ')[1]
    try{
        jwt.verify(token, process.env.ACCESS_TOKEN, async (err, userResult) => {
            if(err){
                return res.sendStatus(403)
            }
            const thumb = req.file

            const loginDetail = await Login.findOne({email: userResult.name})

            const user = await User.findOne({email: userResult.name})

            if(req.body.description){
                user.About = req.body.description
            }
            
            if(thumb){
                user.picture = thumb.buffer
            }

            if(req.body.password !== ''){
                const passwordHash = await bcrypt.hash(req.body.password, 10)
                loginDetail.password = passwordHash
            }
            await user.save()
            await loginDetail.save()

            res.redirect(`${process.env.HOST_URL}profile`)
            
        })
    }
    catch{
        res.status(500).send('error')
    }
})


module.exports = router