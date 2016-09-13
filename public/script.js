'use strict';
$(document).ready(function () {
    var socket;

    var endings = {
        'win': 'Well done, You\'ve won the game!',
        'lose': 'Oh sorry, better luck next time!',
        'draw': 'It\'s a tie!'
    };

    function socketConnect(name) {
        socket = io.connect('http://localhost:3000');
        var player = {
            name: name,
            mark: ''
        };

        socket.on('connect', function () {
            socket.emit('player', player);
        });

        socket.on('playerLeft', function () {
            $('.winmessage').html('The other player left the room.');
            $('#basicModal').modal('show');
        });

        socket.on('sign', function (sign) {
            player.mark = sign;
        });

        socket.on('players', function (players) {
            console.log('players', players);
            if (players.length === 1){
                players.push({
                    name: 'Waiting for other player',
                    mark: ''
                });
            }

            var playersHtml = '';
            for (var pl of players) {
                playersHtml += '<div class="status">' + pl.name + ':' +' '+' <span>'+ pl.mark + '</span></div>'
            }
            $('.players').html(playersHtml);
        });


        socket.on('Start Game', function () {
            $('#board button').removeAttr('disabled');
        });

        socket.on('draw', function (sign, position) {
            console.log('move was made with', sign, 'on', position);
            $(position).html(sign).attr('disabled', 'disabled').addClass(sign);
        });

        socket.on('winner', function (resolve) {
            console.log('winner', resolve, player);
            if (resolve == player.mark){
                $('.winmessage').html(endings.win).addClass('win');
            } else if (resolve == 'draw') {
                $('.winmessage').html(endings.draw).addClass('draw');
            } else {
                $('.winmessage').html(endings.lose).addClass('lose');
            }
            setTimeout(function(){
                $('#basicModal').modal('show');
            }, 1000);
        });
    }


    function mark(position) {
        console.log('move made on position', position);
        if ($(position).html() === '') {
            socket.emit("makeMove", position);
        }
    }

    //First row
    $('#00').click(function () {
        mark("#00");
    });
    $('#01').click(function () {
        mark("#01");
    });
    $('#02').click(function () {
        mark("#02");
    });
    // Second row
    $('#10').click(function () {
        mark("#10");
    });
    $('#11').click(function () {
        mark("#11");
    });
    $('#12').click(function () {
        mark("#12");
    });
    // Third Row
    $('#20').click(function () {
        mark("#20");
    });
    $('#21').click(function () {
        mark("#21");
    });
    $('#22').click(function () {
        mark("#22");
    });

    $('.usernameInput').bind("enterKey", function (e) {
        $('.login-holder').hide();
        $('.board-holder').fadeIn();
        socketConnect($('.usernameInput').val());
    });
    $('.usernameInput').keyup(function (e) {
        if (e.keyCode == 13) {
            $(this).trigger("enterKey");
        }
    });

});