import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import router from '../src/routes/users.routes.js';


const app = express();
app.set("port", process.env.PORT || 3000);
app.use(cors());
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({ extended: true, limit: "40kb" }));
app.use('/api/v1/users', router);


const server = createServer(app);
const io = new Server(server)


app.get('/',(req,res)=>{
     return res.json({ message: 'Welcome to the Chat Application' });
})


const startServer = async () => {
    const connectionDB=await mongoose.connect("mongodb+srv://Akshay:sXWfOyEeXgIfr0ce@cluster0.k9xo7md.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    console.log("Database connected successfully");
    server.listen(app.get("port"),()=>{
    console.log(`Server is running on port ${app.get("port")}`);
})
}

startServer()