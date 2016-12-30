//Tipos de comunicación:
/*File communication (EXPRESS):
    +El cliente pide al servido un archivo (Ex: playerImg.png)

            mywebsite.com   :2000       /client/playerImg.png
    URL =   DOMAIN          PORT        PATH*/

/*Package communication (Socket.io):
    +El cliente envia datos al servidor (Ex: input)
    +El servidor envia datos al cliente (Ex: Enemy position)*/


/*MONGO====MONGO====MONGO====MONGO====MONGO====MONGO====MONGO====MONGO====MONGO====MONGO====MONGO====MONGO*/
var mongojs = require("mongojs");
var db = mongojs('localhost:27017/myGame', ['account', 'progress']); //url:puerto/bd, ['colección1', 'col2', etc.])
//db.account.insert({username:"b", password:"bb"}); //Insertar!!
/*========================================================================================================*/

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
    self.getDistance = function(pt){
        return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
    }
    return self;
}
/*==========================================================================================================*/

/*BULLET====BULLET====BULLET====BULLET====BULLET====BULLET====BULLET====BULLET====BULLET====BULLET====BULLET====BULLET*/
var Bullet = function(parent,angle){
    var self = Entity();
    self.id = Math.random();
    self.spdX = Math.cos(angle/180*Math.PI) * 10;
    self.spdY = Math.sin(angle/180*Math.PI) * 10;
    self.parent = parent; //No puedes dispararte a ti mismo papu
    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    self.update = function(){
        if(self.timer++ > 100)
            self.toRemove = true;
        super_update();

        var minus = true;
        for(var i in Player.list){
            var p = Player.list[i];
            if(self.getDistance(p) < 32 && self.parent !== p.id){
                p.hp -= 1;

                if(p.hp <= 0){ //Si ha muerto
                    var shooter = Player.list[self.parent];
                    if(shooter) //Si el que dispara no se ha desconectado (porque no podríamos sumarle en el score)
                        shooter.score += p.score+1;
                    p.hp = p.hpMax;
                    p.x = Math.random() * 500;
                    p.y = Math.random() * 500;
                    p.score = 0;
                }

                self.toRemove = true;
            }

        }
    }

    self.getInitPack = function(){
        return{
            id:self.id,
            x:self.x,
            y:self.y,
        };
    }
    self.getUpdatePack = function(){
        return{
            id:self.id,
            x:self.x,
            y:self.y,
        };
    }

    Bullet.list[self.id] = self;
    initPack.bullet.push(self.getInitPack());
    return self;
}
Bullet.list = {};

Bullet.update = function(){
    var pack = [];
    for(var i in Bullet.list){
        var bullet = Bullet.list[i];
        bullet.update();
        if(bullet.toRemove){
            delete Bullet.list[i];
            removePack.bullet.push(bullet.id);
        }else{
            pack.push(bullet.getUpdatePack());
        }
    }
    return pack;
}

Bullet.getAllInitPack = function(){
    var bullets = [];
    for(var i in Bullet.list)
        bullets.push(Bullet.list[i].getInitPack());
    return bullets;
}

/*====================================================================================================================*/

/*PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER====PLAYER*/
var Player = function(id){
    var self = Entity();
    self.id = id;
    self.number = "" + Math.floor(9 * Math.random()+1);
    self.muerto = false;
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;

    self.pressingAttack = false;
    self.mouseAngle = 0;
    self.bulletTime = 0;

    self.hp = 10;
    self.hpMax = 10;
    self.score = 0;

    self.maxSpd = 5;

    var super_update = self.update; //La de ENTITY
    self.update = function(){
        self.updateSpd(); //Calcula la velocidad
        super_update(); //Llama al update() de ENTITY

        if(self.pressingAttack && self.bulletTime === 0){
            self.shootBullet(self.mouseAngle);
            self.bulletTime += 1;
        }

        if(self.bulletTime !== 0){
            self.bulletTime += 1;
            if(self.bulletTime === 10)
                self.bulletTime = 0;
        }

    }

    self.shootBullet = function(angle){
        var b = Bullet(self.id, angle);
        b.x = self.x;
        b.y = self.y;
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

    self.getInitPack = function(){
        return{
            id:self.id,
            x:self.x,
            y:self.y,
            number:self.number,
            hp:self.hp,
            hpMax:self.hpMax,
            score:self.score,
        };
    }
    self.getUpdatePack = function(){
        return{
            id:self.id,
            x:self.x,
            y:self.y,
            hp:self.hp,
            score:self.score,
        };
    }

    Player.list[id] = self;
    initPack.player.push(self.getInitPack());
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
        if(data.inputId === 'attack')
            player.pressingAttack = data.state;
        if(data.inputId === 'mouseAngle')
            player.mouseAngle = data.state;
    });

    socket.emit('init',{
        selfId:socket.id,
        player: Player.getAllInitPack(),
        bullet: Bullet.getAllInitPack(),
    });
}

Player.getAllInitPack = function(){
    var players = [];
    for(var i in Player.list)
        players.push(Player.list[i].getInitPack());
    return players;
}

Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
}
Player.update = function(){
    var pack = [] //tendrá la información de cada player

    for(var i in Player.list){
        var player = Player.list[i];
        player.update(); //Muevete vago!
        pack.push(player.getUpdatePack());
    }
    return pack;
}
/*====================================================================================================================*/

var DEBUG = true; //PELIGRO PAPU PELIGRO

var USERS = {
    //username:password
    "cosa":"cosa",
    "coso":"coso",
    "cosi":"cosi",
}

var isValidPassword = function(data,callback){
    db.account.find({username:data.username, password:data.password},function(error, result){
        if(result.length > 0)
            callback(true);
        else
            callback(false);
    });
}
var isUsernameTaken = function(data,callback){
    db.account.find({username:data.username},function(error, result){
        if(result.length > 0)
            callback(true);
        else
            callback(false);
    });;
}
var addUser = function(data,callback){
    db.account.insert({username:data.username, password:data.password},function(error){
        callback();
    });
}

/*SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO====SOCKET.IO*/
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    socket.id = Math.random(); //CAMBIAR ESTO A ALGO MAS PRO
    SOCKET_LIST[socket.id] = socket;

    //Player.onConnect(socket);

    socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });

    //CHAT
    socket.on('sendMsgToServer', function(data){
        var playerName = ("" + socket.id).slice(2,7);
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('addToChat', playerName + ': ' + data);
        }
    });
    socket.on('evalServer', function(data){
        if (!DEBUG){
            socket.emit('evalAnswer', "DEBUG MODE OFF");
            return;
        }
        //Esto es peligroso D:
        var res = eval(data);
        socket.emit('evalAnswer', res);
    });

    //LOGIN - REGISTRO
    socket.on('signIn',function(data){
        isValidPassword(data,function(res){
            if(res){
                Player.onConnect(socket);
                socket.emit('signInResponse',{success:true});
            } else {
                socket.emit('signInResponse',{success:false});
            }
        });
    });
    socket.on('signUp',function(data){
        isUsernameTaken(data,function(res){
            if(res){
                socket.emit('signUpResponse',{success:false});
            } else {
                addUser(data,function(){
                    socket.emit('signUpResponse',{success:true});
                });
            }
        });
    });
});
/*=================================================================================================================*/

/*LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP====LOOP*/

var initPack = {player:[], bullet:[]};
var removePack = {player:[], bullet:[]};

setInterval(function(){ //LOOP
    var pack = { //tendrá la información de los player y las bullets
        player: Player.update(),
        bullet: Bullet.update(),
    }

    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('init',initPack);
        socket.emit('update',pack);
        socket.emit('remove',removePack);
    }
    initPack.player = [];
    initPack.bullet = [];
    removePack.bullet = [];
    removePack.player = [];
},1000/50); //Será llamado cada 40ms
/*============================================================================================================*/

