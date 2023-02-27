const emailValidator = require('deep-email-validator')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const checkAuthentication = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader.split(' ')[1]
    if(!authHeader){
        res.status(401)
        next()
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
        if(err){
            return res.sendStatus(403)
        }
        req.user = user
        next()
    })
}


const checkAuthenticationAndPass = (req, res, next) => {
    const authHeader = req.headers['authorization']
    if(!authHeader){
        next()
    }
    else{
        const token = authHeader.split(' ')[1]
        jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
            if(err){
                return res.sendStatus(403)
            }
            req.user = user
            next()
        })
    }
}

const checkValidEmail = async (email) => {
    return emailValidator.validate(email)
}


module.exports = {checkAuthentication, checkAuthenticationAndPass, checkValidEmail}