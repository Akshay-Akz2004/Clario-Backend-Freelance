
import bcrypt,{hash} from 'bcrypt';
import {User} from '../models/user.models.js';
import crypto from 'crypto';


const login=async (req,res)=>{

    const {username, password} = req.body;

    if(!username || !password) {
        return res.status(400).json({message: "Username and password are required"});
    }
    try {
        const user=await User.findOne({username});
        if(!user){
            return res.status(404).json({message: "User not found"});
        }

        if(await bcrypt.compare(password, user.password)){
            const token=crypto.randomBytes(20).toString('hex');
            user.token = token;
            await user.save();
            return res.status(200).json({message: "Login successful", token});
        }
    } catch (error) {
        return res.status(500).json({message: "Internal server error"+ error.message});
    }
}


const register=async (req, res) => {
    const {name,username,password} = req.body;
    try{
        const existingUser = await User.findOne({username});
        if(existingUser){
            return res.status(400).json({message: "User already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            username,
            password: hashedPassword
        });

        await newUser.save();
        return res.status(201).json({message: "User registered successfully"});
    }

    catch(error){
        return res.status(500).json({message: "Internal server error"});
    }
}

export {login, register};