const express=require('express')
require('./db/mongoose')
const jwt=require('jsonwebtoken')
const multer=require('multer')
const { ObjectID } = require('mongodb')
const userRouter=require('./routers/user')
const taskRouter=require('./routers/task')

const app=express()
const port=process.env.PORT

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)



app.listen(port, ()=>{
    console.log('The server is up on',port)
})


const Task=require('./models/task')
const User = require('./models/user')
