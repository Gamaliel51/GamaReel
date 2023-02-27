const mongoose = require('mongoose')

const videoSchema = new mongoose.Schema({
    videoName: String,
    channelName: String,
    videoId: String,
    views: Number,
    likes: Number,
    dislikes: Number,
    description: String,
    Genres: Array,
    thumbnail: Buffer,
})

const loginSchema = new mongoose.Schema({
    email: String,
    password: String,
})

const UserSchema = new mongoose.Schema({
    email: String,
    channelName: String,
    About: String,
    picture: Buffer,
    channelVideos: Array,
    history: Array,
    likedVideos: Array,
    dislikedVideos: Array,
    savedVideos: Array,
    status: String,
})

const TokenSchema = new mongoose.Schema({
    email: String,
    token: String,
})

const ReportSchema = new mongoose.Schema({
    videoId: String,
})


const Video = mongoose.model('Video', videoSchema)
const Login = mongoose.model('Login', loginSchema)
const User = mongoose.model('User', UserSchema)
const Token = mongoose.model('Token', TokenSchema)
const Report = mongoose.model('Report', ReportSchema)

module.exports = {Video, Login, User, Token, Report}