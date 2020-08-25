const express=require('express')
const router= new express.Router()
const Task=require('../models/task')
const auth=require('../middleware/auth')

router.post('/tasks',auth, async(req,res)=>{
    //const task=new Task(req.body)

    const task=new Task({
        ...req.body,
        owner: req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task)
    }catch(e){
        res.status(400).send(e)
    }
})


// GET /tasks?limit=1&skip=10
// GET /tasks?sortBy=createdAt:desc
// GET /tasks?completed=true
router.get('/tasks',auth,async (req,res)=>{
    const match={}
    const sort={}

    if(req.query.completed){
        match.completed= (req.query.completed==="true")
    }

    if(req.query.sortBy){
        const parts=req.query.sortBy.split(':')
        sort[parts[0]]= parts[1]==='desc'? -1:1
    }

    try{
        const user=req.user
        await user.populate({
            path:'tasks',
            match,
            options:{
                limit:parseInt(req.query.limit),
                skip:parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(user.tasks)
    }catch(e){
        res.status(500).send()
    }
})

router.get('/tasks/:id',auth,async(req,res)=>{
    const _id=req.params.id
    try{
        const task=await Task.findOne({_id, owner:req.user._id})

        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send()
    }
})

router.patch('/tasks/:id',auth, async(req, res)=>{
    const allowedUpdates=['description', 'completed']
    const updates=Object.keys(req.body)
    const isValidOperation=updates.every((update)=>allowedUpdates.includes(update))

    if(!isValidOperation){
        res.status(400).send({error:"Invalid update!"})
    }
    try{
        const task=await Task.findOne({_id:req.params.id, owner:req.user._id})

        if(!task){
            return res.status(404).send()
        }

        updates.forEach((update)=>{
            task[update]=req.body[update]
        })
        await task.save()

        //const task=await Task.findByIdAndUpdate('5f29556de15f1209ac0c0b0b', req.body, {new:true, runValidators:true})
        
        res.send(task)
    }catch(e){
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id',auth,async(req,res)=>{
    try{
        const task=await Task.findOneAndDelete({_id:req.params.id,owner:req.user._id})
       // const task= await Task.findByIdAndDelete(req.params.id)
        if(!task){
            res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send()
    }
})

module.exports=router
