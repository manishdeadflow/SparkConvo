'use strict'

const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const { createMessage, createLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/user')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const pathDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(pathDirectoryPath))

let msg = "Joined";
io.on('connection', (socket) => {
    console.log("new connection!")

    //New user joins
    socket.on('join', ({ username, room }, acknow) => {
        const { error, user } = addUser({
            id: socket.id,
            username,
            room
        })
        if (error) {
            return acknow(error)
        }

        socket.join(user.room)

        socket.emit('sendMsg', createMessage(username, msg))
        socket.broadcast.to(user.room).emit('sendMsg', createMessage(username, `${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        acknow()
    })


    socket.on('reply', (msg, acknow) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('sendMsg', createMessage(user.username, msg))
        acknow('Recieved! ')
    })

    socket.on('sendLocation', (coords, acknow) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMsg',
            createLocationMessage(user.username, `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`))
        acknow()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        io.to(user.room).emit('sendMsg', createMessage(user.username, `${user.username} has left`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

    })
})

server.listen(port, () => {
    console.log('Server started at ' + port)
})