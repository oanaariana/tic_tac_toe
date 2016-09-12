'use strict';
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
//var uuid = require('./helpers/uuid');
var numPlayers = 0;


app.use(express.static(__dirname + '/public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});



var previousMove = {};
var rooms = {};
var boards = {};

var roomNum = 0; // ulterior roomNum++ after a room is full
var roomPrefix = 'room';
var players = {};
var blocketRoom = {};

// var room = roomPrefix + roomNum;


io.on('connection', function (socket) {
    console.log('Player connected!', socket.id);
    previousMove[roomPrefix + roomNum] = previousMove[roomPrefix + roomNum] || '';
    rooms[roomPrefix + roomNum] = rooms[roomPrefix + roomNum] || []; // create room if not exist
    // if (rooms[roomPrefix + roomNum]){ //same as above
    //     rooms[roomPrefix + roomNum] = rooms[roomPrefix + roomNum]
    // } else {
    //     rooms[roomPrefix + roomNum] = []
    // }


    if (rooms[roomPrefix + roomNum].length < 2 && !blocketRoom[roomPrefix + roomNum]) { // if room not full
        socket.join(roomPrefix + roomNum); // join user to room in socket.io
        rooms[roomPrefix + roomNum].push(socket.id); // push user in our own room structure
        if (rooms[roomPrefix + roomNum].length == 1 && roomNum == 0){
            socket.sign = 'X';
        } else {
            socket.sign = 'O';
        }
        socket.room = roomPrefix + roomNum; // save room name to user for further use
    } else {
        roomNum++; // roomNum = roomNum + 1;
        rooms[roomPrefix + roomNum] = [];
        rooms[roomPrefix + roomNum].push(socket.id);
        socket.join(roomPrefix + roomNum);
        socket.sign = 'X';
        socket.room = roomPrefix + roomNum;
    }
    socket.emit('sign', socket.sign);

    if (rooms[roomPrefix + roomNum].length === 2) {  //if room is full
        io.to(socket.room).emit('players', players[socket.room]);
        startGame(roomPrefix + roomNum); //start game
    }

    socket.on('player', function(player){
        players[socket.room] = players[socket.room] || [];
        player.mark = socket.sign;
        players[socket.room].push(player);
        io.to(socket.room).emit('players', players[socket.room]);
    });



    console.log(JSON.stringify(rooms, null, 2));

    socket.on('makeMove', function (position) {
        console.log('room:', socket.room, 'move made by', socket.id, 'on position', position, 'with sign', socket.sign);
        if (socket.sign && socket.sign !== previousMove[socket.room]) { // if not guest and not same player move
            previousMove[socket.room] = socket.sign; // change previousMove to current one
            boards[socket.room][position.replace('#', '')] = socket.sign;
            io.to(socket.room).emit('draw', socket.sign, position); // send move to all clients
            var resolve = checkWinner(boards[socket.room]);
            if (resolve) {
                io.to(socket.room).emit('winner', resolve);
            }
        }

    });


    socket.on('disconnect', function () {
        console.log('Player disconnected!', socket.id);
        blocketRoom[socket.room] = 1;
        io.to(socket.room).emit('playerLeft');
    });

});

function startGame(room) {
    boards[room] = {
        '00': '', '01': '', '02': '',
        '10': '', '11': '', '12': '',
        '20': '', '21': '', '22': ''
    }; //initialize the board for room
    io.to(room).emit('Start Game');
}

function checkFullBoard(board) {
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            if (board['' + i + j] == '') {
                return false;
            }
        }
    }
    return true;
}

function checkWinner(board) {
    var winner = true;
    var i, j;
    var signs = ['X', 'O'];
    for (var sign of signs) {
        for (i = 0; i < 3; i++) {
            winner = true;
            for (j = 0; j < 3; j++) {
                if (board['' + i + j] != sign) {
                    winner = false;
                }
            }

            if (winner == true) {
                return sign;
            }
        }

        for (i = 0; i < 3; i++) {
            winner = true;
            for (j = 0; j < 3; j++) {
                if (board['' + j + i] != sign) {
                    winner = false;
                }
            }
            if (winner == true) {
                return sign;
            }

        }

        winner = true;
        for (j = 0; j < 3; j++) {
            if (board['' + j + j] != sign) {
                winner = false;
            }
        }

        if (winner == true) {
            return sign;
        }

        winner = true;
        for (j = 0; j < 3; j++) {
            if (board['' + j + (3 - j - 1)] != sign) {
                winner = false;
            }
        }

        if (winner == true) {
            return sign;
        }

    }
    if (winner == false && checkFullBoard(board) == false) {
        return 0;
    }
    return 'draw';
}


server.listen(3000, function () {
    console.log('Server is now running');

});