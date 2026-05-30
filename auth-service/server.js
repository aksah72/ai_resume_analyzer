const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://mongo:27017/resumeDB')
.then(() => console.log('MongoDB Connected'));

const UserSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model('User', UserSchema);

app.post('/register', async (req,res)=>{

  const hashedPassword = await bcrypt.hash(req.body.password,10);

  const user = new User({
    email:req.body.email,
    password:hashedPassword
  });

  await user.save();

  res.json({message:'User Registered'});
});

app.post('/login', async (req,res)=>{

  const user = await User.findOne({email:req.body.email});

  if(!user)
    return res.json({message:'User Not Found'});

  const valid = await bcrypt.compare(req.body.password,user.password);

  if(!valid)
    return res.json({message:'Invalid Password'});

  const token = jwt.sign({id:user._id},'secretkey');

  res.json({token});
});

app.listen(5000,()=>{
  console.log('Auth Service Running');
});