//Tipos de comunicación:
/*File communication (EXPRESS):
    +El cliente pide al servido un archivo (Ex: playerImg.png)

            mywebsite.com   :2000       /client/playerImg.png
    URL =   DOMAIN          PORT        PATH*/

/*Package communication (Socket.io):
    +El cliente envia datos al servidor (Ex: input)
    +El servidor envia datos al cliente (Ex: Enemy position)*/


/*EXPRESS====EXPRESS====EXPRESS====EXPRESS====EXPRESS====EXPRESS====EXPRESS====EXPRESS====EXPRESS====EXPRESS*/
var express = require('express');
var app = express();
var serv = require('http').Server(app); //Creamos el servidor

app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));
//De esta forma solo se puede acceder '/' (y te redirecciona a /client/index) y a lo que hay dentro de '/client'
//No se podría acceder, por ejemplo, a /server/archivoSecreto.xml

serv.listen(2000); //El puerto al que escucha el servidor
/*===========================================================================================================*/

var SOCKET_LIST = {};
var PLAYER_LIST = {};

/*PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER*/
var Player = function(id){
    var self = {
        x: 250,
        y:250,
        id: id,
        number:"" + Math.floor(10 * Math.random()),
        pressingRight: false,
        pressingLeft: false,
        pressingUp: false,
        pressingDown: false,
        maxSpd:10
    }
    //MOVIMIENTO
    self.udaptePosition = function(){
        if(self.pressingRight)
            self.x += self.maxSpd;
        if(self.pressingLeft)
            self.x -= self.maxSpd;
        if(self.pressingDown)
            self.y += self.maxSpd;
        if(self.pressingUp){
            self.y -= self.maxSpd;
        }
    }
    return self;
}
/*==========================================================================================================*/

/*SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO*/
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    socket.id = Math.random(); //CAMBIAR ESTO A ALGO MAS PRO
    SOCKET_LIST[socket.id] = socket;

    var player = Player(socket.id);
    PLAYER_LIST[socket.id] = player;

    socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
    })

    socket.on('keyPress', function(data){
        if(data.inputId === 'left')
           player.pressingLeft = data.state;
        if(data.inputId === 'right')
            player.pressingRight = data.state;
        if(data.inputId === 'up')
            player.pressingUp = data.state;
        if(data.inputId === 'down')
            player.pressingDown = data.state;
    });
});
/*=================================================================================================================*/

/*LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP*/
setInterval(function(){ //LOOP
    var pack = [] //tendrá la información de cada player
    for(var i in PLAYER_LIST){
        var player = PLAYER_LIST[i];
        player.udaptePosition(); //Muevete vago!
        pack.push({
            x:player.x,
            y:player.y,
            number:player.number
        });
    }
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('newPos',pack);
    }
},1000/25); //Será llamado cada 40ms
/*============================================================================================================*/

