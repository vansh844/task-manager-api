const express=require('express')
const router= new express.Router()
const User=require('../models/user')
const auth=require('../middleware/auth')
const multer=require('multer')
const {sendWelcomeEmail, sendCancelationEmail}=require('../emails/account')
const sharp = require('sharp')

const upload=multer({
    limits:{
        fileSize:1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            cb(new Error('Please upload an image'))
        }
        cb(undefined, true)
    }
})

router.post('/users', async(req, res)=>{
    const user= new User(req.body)

    try{
        await user.save()
        sendWelcomeEmail(user.email,user.name)
        const token= await user.generateAuthToken()
        res.status(201).send({user,token})
    }catch(e){
        res.status(400).send(e)
    }
    

    // user.save().then(()=>{
    //     res.status(201).send(user)
    // }).catch((e)=>{
    //     res.status(400).res.send(e)
    // })
})

router.post('/users/login', async(req, res)=>{
    try{
        const user= await User.findByCredentials(req.body.email, req.body.password)
        const token= await user.generateAuthToken()
        res.send({user, token})
    }catch(e){
        res.status(400).send()
    }
})

router.post('/users/logout',auth, async(req, res)=>{
    try{
        req.user.tokens=req.user.tokens.filter((token)=>{
            return token.token!==req.token
        })
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send(e)
    }
})

router.post('/users/logoutAll', auth, async(req, res)=>{
    try{
        req.user.tokens=[]
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.get('/users/me',auth,async (req,res)=>{
    res.send(req.user)
})

router.post('/users/me/avatar',auth,upload.single('avatar'),async (req,res)=>{
    const buffer=await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
    req.user.avatar=buffer
    await req.user.save()
    res.send()
},(error,req,res,next)=>{
    res.status(400).send({error:error.message})
})

router.delete('/users/me/avatar',auth,async(req,res)=>{
    req.user.avatar=undefined
    await req.user.save()
    res.send()
})

router.patch('/users/me',auth, async (req, res)=>{
    const updates=Object.keys(req.body)
    const allowedUpdates=['name', 'password', 'email', 'age']
    const isValidOperation=updates.every((update)=>allowedUpdates.includes(update))

    if(!isValidOperation){
        res.status(400).send({error:"Invalid update"})
    }
    try{
        updates.forEach((update)=>{
            req.user[update]=req.body[update]
        })
        await req.user.save()

        //const user= await User.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators:true})
        res.send(req.user)
    }catch(e){
        res.status(400).send(e)
    }
})

//access /:id using req.params.id

router.delete('/users/me',auth, async(req, res)=>{
    try{
        // const user=await User.findByIdAndDelete(req.user._id)
        // if(!user){
        //     return res.status(404).send()
        // }
        
        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user)
    }catch(e){
        res.status(500).send()
    }
})

router.get('/users/:id/avatar',async (req,res)=>{
    try{
        const user=await User.findById(req.params.id)
        if(!user||!user.avatar){
            throw new Error()
        }
        res.set('Content-Type','image/png')
        res.send(user.avatar)
    }catch(e){
        res.status(404).send()
    }
})


module.exports=router