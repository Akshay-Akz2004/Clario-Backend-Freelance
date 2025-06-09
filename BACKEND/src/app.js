import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import router from '../src/routes/users.routes.js';

const app = express();
app.set("port", process.env.PORT || 3000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ extended: true, limit: "40kb" }));
app.use('/api/v1/users', router);

let connections = {};
let messages = {};
let timeOnline = {};

const server = createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
    socket.on("join-call", (path) => {
        if (connections[path] === undefined) {
            connections[path] = [];
        }

        connections[path].push(socket.id);
        timeOnline[socket.id] = new Date();

        for (let a = 0; a < connections[path].length; a++) {
            io.to(connections[path][a]).emit("user-joined", socket.id, connections[path]);
        }

        if (messages[path] !== undefined) {
            for (let a = 0; a < messages[path].length; ++a) {
                io.to(socket.id).emit(
                    "chat-message",
                    messages[path][a]['data'],
                    messages[path][a]['sender'],
                    messages[path][a]['socket-id-sender']
                );
            }
        }
    });

    socket.on("signal", (toID, message) => {
        io.to(toID).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
        const [matchingRoom, found] = Object.entries(connections)
            .reduce(([matchingRoom, isFound], [roomKey, roomValue]) => {
                if (!isFound && roomValue.includes(socket.id)) {
                    return [roomKey, true];
                }
                return [matchingRoom, isFound];
            }, ['', false]);

        if (found === true) {
            if (messages[matchingRoom] === undefined) {
                messages[matchingRoom] = [];
            }

            messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id });
            console.log("message", matchingRoom, ":", sender, data);
            connections[matchingRoom].forEach((elem) => {
                io.to(elem).emit("chat-message", data, sender, socket.id);
            });
        }
    });

    socket.on("disconnect", () => {
        var diffTime = Math.abs(timeOnline[socket.id] - new Date());
        var key;

        for (const [k, v] of Object.entries(connections)) {
            for (let a = 0; a < v.length; ++a) {
                if (v[a] === socket.id) {
                    key = k;

                    for (let b = 0; b < connections[key].length; ++b) {
                        io.to(connections[key][b]).emit('user-left', socket.id);
                    }

                    var index = connections[key].indexOf(socket.id);
                    connections[key].splice(index, 1);

                    if (connections[key].length === 0) {
                        delete connections[key];
                    }
                }
            }
        }
    });
});

app.get('/', (req, res) => {
    return res.json({ message: 'Welcome to the Chat Application' });
});

const startServer = async () => {
    await mongoose.connect("mongodb+srv://Akshay:sXWfOyEeXgIfr0ce@cluster0.k9xo7md.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    console.log("Database connected successfully");
    server.listen(app.get("port"), () => {
        console.log(`Server is running on port ${app.get("port")}`);
    });
};

startServer();