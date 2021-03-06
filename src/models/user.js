const mongoose=require('mongoose')
const validator=require('validator')
const sharp=require('sharp')
const jwt=require('jsonwebtoken')
const bcrypt=require('bcryptjs')
const Task=require('./task')

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        unique:true,
        type:String,
        required:true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('This is not a valid mail')
            }
        }
    },
    password:{
        type:String,
        required:true,
        minlength:7,
        trim:true,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('contains password')
            }
        }
    },
    age:{
        type:Number,
        default:0,
        validate(value){
            if(value<0){
                throw new Error('Age must be a positive number')
            }
        }
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }],
    avatar:{
        type:Buffer
    }
},{
    timestamps:true
})

//statics-> models
//methods-> instances

userSchema.statics.findByCredentials=async (email, password)=>{
    const user=await User.findOne({email})
    if(!user){
        throw new Error('Unable to login')
    }
    const isMatch=await bcrypt.compare(password,user.password)
    if(!isMatch){
        throw new Error('Unable to login')
    }
    return user
}

userSchema.methods.toJSON=function(){
    const user=this
    const userObject=user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken=async function(){
    const user=this
    const token=jwt.sign({_id:user._id.toString()}, 'thisismynewcourse')
    user.tokens=user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})

//hash the plain text password
userSchema.pre('save',async function(next){
    const user=this

    if(user.isModified('password')){
        user.password= await bcrypt.hash(user.password, 8)
    }

    console.log('Just before running')

    next()
})

userSchema.pre('remove', async function(next){
    const user=this
    await Task.deleteMany({owner:user._id})
})

const User=mongoose.model('User', userSchema)

module.exports=User