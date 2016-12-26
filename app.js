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

/*SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO*/
var SOCKET_LIST = {};

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    socket.id = Math.random(); //CAMBIAR ESTO A ALGO MAS PRO
    socket.x = 0;
    socket.y = 0;
    socket.number = "" + Math.floor(10 * Math.random());
    SOCKET_LIST[socket.id] = socket;

    socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id];
    })
});
/*=================================================================================================================*/
setInterval(function(){ //LOOP
    var pack = [] //tendrá la información de cada player
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.x+=1;
        socket.y+=1;
        pack.push({
            x:socket.x,
            y:socket.y,
            number:socket.number
        });
    }
    for(var i in SOCKET_LIST){
        socket.emit('newPos',pack);
    }
},1000/25); //Será llamado cada 40ms
