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
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    console.log('socket connection'); //Cuando haya una conexión esta función será llamada
    socket.on('happy', function(data){
        console.log('the client is happy coz ' +data.reason);
    })

    socket.emit('serverMsg', {
        msg: 'pepepepee!'
    })
})
/*=================================================================================================================*/
