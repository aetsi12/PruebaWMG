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

/*ENTITY====ENTITY====ENTITY====ENTITY====ENTITY====ENTITY====ENTITY====ENTITY====ENTITY====ENTITY====ENTITY*/
var Entity = function(){
    var self = {
        x:250,
        y:250,
        spdX:0,
        spdY:0,
        id:""
    }
    self.update=function(){
        self.updatePosition();
    }
    self.updatePosition = function(){
        self.x += self.spdX;
        self.y += self.spdY;
    }
    return self;
}
/*==========================================================================================================*/

/*BULLET====BULLET====BULLET====BULLET====BULLET====BULLET====BULLET====BULLET====BULLET====BULLET====BULLET====BULLET*/
var Bullet = function(angle){
    var self = Entity();
    self.id = Math.random();
    self.spdX = Math.cos(angle/180*Math.PI) * 10;
    self.spdY = Math.sin(angle/180*Math.PI) * 10;

    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    self.update = function(){
        if(self.timer++ > 100)
            self.toRemove = true;
        super_update();
    }
    Bullet.list[self.id] = self;
    return self;
}
Bullet.list = {};

Bullet.update = function(){
    if(Math.random() < 0.1){
        Bullet(Math.random()*360);
    }

    var pack = [];
    for(var i in Bullet.list){
        var bullet = Bullet.list[i];
        bullet.update();
        pack.push({
            x:bullet.x,
            y:bullet.y,
        });
    }
    return pack;
}
/*====================================================================================================================*/

/*PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER*/
var Player = function(id){
    var self = Entity();
    self.id = id;
    self.number = "" + Math.floor(10 * Math.random());
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.maxSpd = 5;

    var super_update = self.update; //La de ENTITY
    self.update = function(){
        self.updateSpd(); //Calcula la velocidad
        super_update(); //Llama al update() de ENTITY
    }

    self.updateSpd = function(){
        if(self.pressingRight)
            self.spdX = self.maxSpd;
        else if(self.pressingLeft)
            self.spdX = -self.maxSpd;
        else
            self.spdX = 0;
        if(self.pressingDown)
            self.spdY = self.maxSpd;
        else if(self.pressingUp)
            self.spdY = -self.maxSpd;
        else
            self.spdY = 0;
        if((self.pressingDown || self.pressingUp) && (self.pressingLeft || self.pressingRight)){ //PARA QUE EN DIAGONAL NO VAYA MÁS RÁPIDO
            self.spdX = self.spdX*0.75;
            self.spdY = self.spdY*0.75;
        }
    }

    Player.list[id] = self;
    return self;
}

Player.list = {};

Player.onConnect = function(socket){
    var player = Player(socket.id);

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
}
Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
}
Player.update = function(){
    var pack = [] //tendrá la información de cada player

    for(var i in Player.list){
        var player = Player.list[i];
        player.update(); //Muevete vago!
        pack.push({
            x:player.x,
            y:player.y,
            number:player.number
        });
    }
    return pack;
}
/*====================================================================================================================*/

/*SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO*/
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    socket.id = Math.random(); //CAMBIAR ESTO A ALGO MAS PRO
    SOCKET_LIST[socket.id] = socket;
    Player.onConnect(socket);
    socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    })
});
/*=================================================================================================================*/

/*LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP*/
setInterval(function(){ //LOOP
    var pack = { //tendrá la información de los player y las bullets
        player: Player.update(),
        bullet: Bullet.update(),
    }

    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('newPos',pack);
    }
},1000/50); //Será llamado cada 40ms
/*============================================================================================================*/

