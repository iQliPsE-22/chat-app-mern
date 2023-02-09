const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const socket = require("socket.io");

const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messagesRoute');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.use('/profile_pictures', express.static('profile_pictures'));

//connecting routes
app.use("/api/auth", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chats", chatRoutes);

//connecting db to the app
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("DB connected successfully");
}).catch((err) => {
    console.log(err.message);
});


// creating the server
const server = app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
});

//connecting sockets to the server
const io = socket(server, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true,
    },
});


io.on("connection", (socket) => {
    console.log("Connected to socket.io");
    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
    });

    socket.on("join chat", (room) => {
        socket.join(room);
    });

    socket.on("contacts", (data) => {
        socket.emit("contacts", data);
    });

    socket.on("new message", (newMessageRecieved) => {
        socket.in(newMessageRecieved.chatId).emit("message recieved", newMessageRecieved);
    });

    socket.off("setup", () => {
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    });
});