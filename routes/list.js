const express = require('express')
const { checkAuthentication, checkAuthenticationAndPass } = require('../controllers/authMiddleware')
const { listHome, listRecommendations, listLibrary, listLiked, listProfile, listChannel, deleteHistory, deleteLibrary } = require('../controllers/listControl')

const router = express.Router()

router
.get('/home', listHome)
.get('/recommend', checkAuthenticationAndPass, listRecommendations)
.get('/library', checkAuthentication, listLibrary)
.get('/liked', checkAuthentication, listLiked)
.get('/profile', checkAuthentication, listProfile)
.get('/channel', listChannel)
.delete('/history', checkAuthentication, deleteHistory)
.delete('/library', checkAuthentication, deleteLibrary)

module.exports = router