'use strict'

const socket = io()

const $msgForm = document.querySelector('form')
const $messageInput = document.querySelector('input')
const $btnSend = document.querySelector('.btn-send')
const $btnLocation = document.querySelector('.btn-location')
const $message = document.querySelector('.textMessage')

//Templates
const msgTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    const $newMessage = $message.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $message.offsetHeight

    const containerHeight = $message.scrollHeight

    const scrollOffset = $message.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $message.scrollTop = $message.scrollHeight
    }
}

socket.on('sendMsg', (msg) => {
    const html = Mustache.render(msgTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('hh:mm a')
    })

    $message.insertAdjacentHTML('beforeend', html)

    autoscroll()
})

socket.on('locationMsg', (link) => {
    const html = Mustache.render(locationTemplate, {
        username: link.username,
        location: link.url,
        createdAt: moment(link.createdAt).format('hh:mm a')
    })

    $message.insertAdjacentHTML('beforeend', html)

    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('.chat__sidebar').innerHTML = html
})

$msgForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $btnSend.setAttribute('disabled', 'disabled')

    const msg = e.target.elements.message.value

    socket.emit('reply', msg, (ack) => {
        $btnSend.removeAttribute('disabled')
        $messageInput.value = ''
        $messageInput.focus()

        // console.log('Delivered!! ', ack)
    })
})

$btnLocation.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not suppoted in this browser')
    }
    $btnLocation.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords

        socket.emit('sendLocation', { latitude, longitude }, () => {
            $btnLocation.removeAttribute('disabled')

            console.log('Location shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})
