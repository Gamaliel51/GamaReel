const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const emailValidator = require('deep-email-validator')
const multer = require('multer')
const cors =  require('cors')
const {Login, User, Token} = require('../schemas')
const { checkAuthentication, checkValidEmail } = require('../controllers/authMiddleware')
require('dotenv').config()

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({storage: storage});


router
.post('/signup', upload.single('file'), async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    try{
        const passwordHash = await bcrypt.hash(req.body.password, 10)

        const thumb = req.file

        const takenUser = await User.findOne({channelName: req.body.channelName})
        const takenLogin = await Login.findOne({email: req.body.email})
        if(!takenUser && !takenLogin){
            const loginDetail = new Login({
                email: req.body.email,
                password: passwordHash
            })

            const newUser = new User({
                email: req.body.email,
                About: req.body.about,
                channelName: req.body.channelName,
                channelVideos: [],
                likedVideos: [],
                history: [],
                picture: thumb.buffer,
                status: 'inactive',
            })

            await loginDetail.save()
            await newUser.save()
            
            
            const token = jwt.sign({ email: req.body.email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
            const dataToken = new Token({
                email: req.body.email,
                token: token,
            })

            await dataToken.save()

            const validationLink = `${process.env.HOST_URL}validatesignin?token=${token}`

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
                },
            })

            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: req.body.email,
                subject: 'GamaReel - Verify Account',
                text: `Please click this link to validate your GamaReel account: ${validationLink}`,
                html: `Please click <a href="${validationLink}">this link</a> to validate your GamaReel account.`,
            };
            
            await transporter.sendMail(mailOptions)

            return res.json({status: 'ok'})
        }
        else if(takenLogin){
            return res.json({status: 'email taken'})
        }
        else{
            return res.json({status: 'username taken'})
        }

        
    }
    catch(err){
        console.error(err)
        res.status(500).send('error')
    }
})
.post('/login', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    try{
        const username = req.body.username
        const password = req.body.password
        
        
        const mail = await Login.findOne({email: username})
        if(!mail){
            const user = await User.findOne({channelName: username})
            if(!user){
                return res.json({status: 'wrong username or password'})
            }

            const nmail = await Login.findOne({email: user.email})
            try{
                if(await bcrypt.compare(password, nmail.password)){

                    const activeUser = await User.findOne({email: nmail.email})
                    if(activeUser.status === 'inactive'){
                        return res.json({status: 'inactive'})
                    }

                    const accessToken = jwt.sign({name: nmail.email}, process.env.ACCESS_TOKEN, {expiresIn: '1d'})
                    const refreshToken = undefined

                    res.json({accessToken: accessToken, refreshToken: refreshToken})
                }
                else{
                    res.json({accessToken: null, status: 'wrong username or password'})
                }
            }
            catch(err){
                console.error(err)
                res.status(500).end()
            }
        }
        else{
            try{
                if(await bcrypt.compare(password, mail.password)){

                    const activeUser = await User.findOne({email: mail.email})
                    if(activeUser.status === 'inactive'){
                        return res.json({status: 'inactive'})
                    }

                    const accessToken = jwt.sign({name: mail.email}, process.env.ACCESS_TOKEN, {expiresIn: '1d'})
                    const refreshToken = undefined

                    res.json({accessToken: accessToken, refreshToken: refreshToken})
                }
                else{
                    res.json({accessToken: null, status: 'wrong username or password'})
                }
            }
            catch(err){
                console.error(err)
                res.status(500).end()
            }
        }
    }
    catch(err){
        res.sendStatus(500)
    }

})
.get('/validatesignin', cors(), async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    try{
        const token = req.query.token
        const { email } = jwt.verify(token, process.env.ACCESS_TOKEN);
        const userToken = await Token.findOne({token: token})
        if(userToken && email){
            const user = await User.findOne({email: userToken.email})
            user.status = 'active'
            await user.save()

            return res.json({status: 'ok'})
        }
        res.json({status: 'error'})
    }
    catch(err){
        console.error(err)
    }
})
.delete('/logout', checkAuthentication, async (req, res) => {
    try{
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.json({status: 'loggedout'})
    }
    catch(err){
        res.sendStatus(500)
    }
})



module.exports = router