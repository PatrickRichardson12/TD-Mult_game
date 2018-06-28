var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

//
//
//varrrrrs
const WALL_THICKNESS = 25;
const WALL = WALL_THICKNESS / 2;
const WALL_LENGTH = 125;
var walls = [];


var players = {};
var player_Id_Array = [];
var gameOver = false;
var moveSpeed = 3.4;
var sprintSpeed = 5.1;
var playerWidth = 35;
var playerLength = 35;

var powerUp = []; // x, y, name

var bullets = [];
const BULLET_SPEED = 20;
var bulletWidth = 4;
var bulletLength = 4;
var shoot_delay = 500;
var start_time = Date.now();
var d = Date.now();
var last_Shot = Date.now();

var enemies = [];
var enemy_width = 28;
var enemy_length = 28;

var canvas = {
    width: 1000,
    height: 1000
}

var info = {
    takedowns : 0
}

app.set('port', 5000);
app.use(express.static(__dirname));

// Routing
app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, 'game2.html'));
});

server.listen(5000, function () {
    console.log('Starting server on port 5000');
    wallArray();
});


io.on('connection', function (socket) {
    socket.on('new player', function () {
        players[socket.id] = {
            x: 400,
            y: 400,
        };
        player_Id_Array.push(socket.id);
    });
    socket.on('movement', function (data) {
        var player = players[socket.id] || {};
        if (data.sprint)
            moveSpeed = 5.1;
        else
            moveSpeed = 3.4;
            
        if (data.left) {
            player.x -= moveSpeed;
            if (player.x < WALL_THICKNESS) {
                player.x = WALL_THICKNESS;
            }
            if (check_player_movement(player.x, player.y, playerWidth, playerLength)) {
                player.x += moveSpeed;
            }
        }
        if (data.up) {
            player.y -= moveSpeed;
            if (player.y < WALL_THICKNESS) {
                player.y = WALL_THICKNESS;
            }
            if (check_player_movement(player.x, player.y, playerWidth, playerLength)) {
                player.y += moveSpeed;
            }
        }
        if (data.right) {
            player.x += moveSpeed;
            if (player.x > canvas.width - WALL_THICKNESS - playerWidth) {
                player.x = canvas.width - WALL_THICKNESS - playerWidth;
            }
            if (check_player_movement(player.x, player.y, playerWidth, playerLength)) {
                player.x -= moveSpeed;
            }
        }
        if (data.down) {
            player.y += moveSpeed;
            if (player.y > canvas.height - WALL_THICKNESS - playerLength) {
                player.y = canvas.height - WALL_THICKNESS - playerLength;
            }
            if (check_player_movement(player.x, player.y, playerWidth, playerLength)) {
                player.y -= moveSpeed;
            }
        }
    });
    socket.on('bullet', function (data) {
        if (data.up && data.left) {
            bullets.push({ bulletY: data.y + playerLength / 4, bulletX: data.x + playerWidth / 2, dir: 'up-left' });
        }
        else if (data.up && data.right) {
            bullets.push({ bulletY: data.y + playerLength / 4, bulletX: data.x + playerWidth / 2, dir: 'up-right' });
        }
        else if (data.down && data.left) {
            bullets.push({ bulletY: data.y + playerLength / 4, bulletX: data.x + playerWidth / 2, dir: 'down-left' });
        }
        else if (data.down && data.right) {
            bullets.push({ bulletY: data.y + playerLength / 4, bulletX: data.x + playerWidth / 2, dir: 'down-right' });
        }
        else if (data.left) {
            bullets.push({ bulletY: data.y + playerLength / 4, bulletX: data.x + playerWidth / 2, dir: 'left' });
        }
        else if (data.up) {
            bullets.push({ bulletY: data.y + playerLength / 4, bulletX: data.x + playerWidth / 2, dir: 'up' });
        }
        else if (data.right) {
            bullets.push({ bulletY: data.y + playerLength / 4, bulletX: data.x + playerWidth / 2, dir: 'right' });
        }
        else if (data.down) {
            bullets.push({ bulletY: data.y + playerLength / 4, bulletX: data.x + playerWidth / 2, dir: 'down' })
        }
    });
    socket.on('Reset', function () {
        reset_game();
    })
});

setInterval(function () {
    if (!gameOver) {
        player_Gets_Pow(); //did anyone hit a powerup.
        move_bullets(); //this moves and then check to see if bullets hit walls
        move_enemy();
        enemy();
    }
    io.sockets.emit('state', players,bullets,enemies,gameOver,powerUp,info);
}, 1000 / 60);

setInterval(function () {
    if ((powerUp.length < 1 && Math.floor(Math.random() * 100) + 1) > 96)
        powerUp.push({ x: Math.floor(Math.random() * (canvas.width - WALL_THICKNESS * 2)) + WALL_THICKNESS, y: Math.floor(Math.random() * (canvas.height - WALL_THICKNESS * 2)) + WALL_THICKNESS, name: 'bomb' });
}, 1000);




//game details 
function check_player_movement(X1, Y1, Width1, Length1) {
    for (i = 0; i < walls.length; i += 2) {
        if (collide(X1, Y1, Width1, Length1, walls[i].wallX, walls[i].wallY, WALL_LENGTH, WALL_THICKNESS)) {
            return true;
        }
        if (collide(X1, Y1, Width1, Length1, walls[i + 1].wallX, walls[i + 1].wallY, WALL_THICKNESS, WALL_LENGTH)) {
            return true;
        }
    }
    return false;
}

function wallArray() {
    var wallObject = { wallX: canvas.width / 4, wallY: canvas.height / 4 }
    walls.push(wallObject)
    wallObject = { wallX: canvas.width / 4, wallY: canvas.height / 4 }
    walls.push(wallObject)
    wallObject = { wallX: canvas.width / 4 * 3 - WALL_LENGTH + WALL_THICKNESS, wallY: canvas.height / 4 }
    walls.push(wallObject)
    wallObject = { wallX: canvas.width / 4 * 3, wallY: canvas.height / 4 }
    walls.push(wallObject)
    wallObject = { wallX: canvas.width / 4 * 3 - WALL_LENGTH + WALL_THICKNESS, wallY: canvas.height / 4 * 3 - WALL_THICKNESS }
    walls.push(wallObject)
    wallObject = { wallX: canvas.width / 4 * 3, wallY: canvas.height / 4 * 3 - WALL_LENGTH }
    walls.push(wallObject)
    wallObject = { wallX: canvas.width / 4, wallY: canvas.height / 4 * 3 - WALL_THICKNESS }
    walls.push(wallObject)
    wallObject = { wallX: canvas.width / 4, wallY: canvas.height / 4 * 3 - WALL_LENGTH }
    walls.push(wallObject)
}
function move_bullets() {
    for (i = 0; i < bullets.length; i++) { //bullet off map
        switch (bullets[i].dir) {
            case 'left':
                bullets[i].bulletX -= BULLET_SPEED;
                break;
            case 'up':
                bullets[i].bulletY -= BULLET_SPEED;
                break;
            case 'right':
                bullets[i].bulletX += BULLET_SPEED;
                break;
            case 'down':
                bullets[i].bulletY += BULLET_SPEED;
                break;
            case 'up-left':
                bullets[i].bulletY -= BULLET_SPEED / 2;
                bullets[i].bulletX -= BULLET_SPEED / 2;
                break;
            case 'up-right':
                bullets[i].bulletY -= BULLET_SPEED / 2;
                bullets[i].bulletX += BULLET_SPEED / 2;
                break;
            case 'down-right':
                bullets[i].bulletY += BULLET_SPEED / 2;
                bullets[i].bulletX += BULLET_SPEED / 2;
                break;
            case 'down-left':
                bullets[i].bulletY += BULLET_SPEED / 2;
                bullets[i].bulletX -= BULLET_SPEED / 2;
                break;
        }
    }
    bullets_hit_enemies();
    bullets_hit_walls();
}

function bullets_hit_walls() {
    for (i = 0; i < bullets.length; i++) {
        if (bullets[i].bulletX < WALL_THICKNESS || bullets[i].bulletX > canvas.width - WALL_THICKNESS || bullets[i].bulletY < WALL_THICKNESS || bullets[i].bulletY > canvas.height - WALL_THICKNESS) {
            bullets.splice(i, 1); //i-- here??? if we splice
            continue;
        }
        for (j = 0; j < walls.length; j += 2) { //so technically the bullets have different width / length depending on the way they go, but i'm being lazy //i set them to be the same easier
            if (collide(bullets[i].bulletX, bullets[i].bulletY, bulletWidth, bulletLength, walls[j].wallX, walls[j].wallY, WALL_LENGTH, WALL_THICKNESS)) {
                bullets.splice(i, 1);
                break;
            }
            if (collide(bullets[i].bulletX, bullets[i].bulletY, bulletWidth, bulletLength, walls[j + 1].wallX, walls[j + 1].wallY, WALL_THICKNESS, WALL_LENGTH)) {
                bullets.splice(i, 1);
                break;
            }
        }
    }
}

function bullets_hit_enemies() {
    for (i = 0; i < bullets.length; i++) {
        for (j = 0; j < enemies.length; j++) {
            if (collide(bullets[i].bulletX, bullets[i].bulletY, bulletWidth, bulletLength, enemies[j].enemyX, enemies[j].enemyY, enemy_width, enemy_length)) {
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                info.takedowns++;
                break;
            }
        }
    }
}

function collide(x1, y1, width1, height1, x2, y2, width2, height2) {
    if (x1 < x2 + width2 && x1 + width1 > x2 && y1 < y2 + height2 && height1 + y1 > y2) {
        return true;
    }
    return false;
}

function enemy() {
    d = Date.now();
    enemy_hit_player();
    if (Math.random() < 1 - Math.pow(.9997, (d - start_time) / 1000)) {
        let random_num = Math.floor(Math.random() * (6));
        let random_num2 = Math.floor(Math.random() * (player_Id_Array.length));
        let random_speed = Math.floor((Math.random() * 70) + 258); //btwn .59-.75 speed for enemies
        random_speed /= 100;
        switch (random_num) {    //spawn locations for enemies
            case 0:
                enemies.push({ enemyX: canvas.width / 2, enemyY: 0, enemy_speed: random_speed, target:player_Id_Array[random_num2] })
                break;
            case 1:
                enemies.push({ enemyX: canvas.width / 2, enemyY: canvas.height, enemy_speed: random_speed, target: player_Id_Array[random_num2] })
                break;
            case 2:
                enemies.push({ enemyX: 0, enemyY: canvas.height / 2, enemy_speed: random_speed, target: player_Id_Array[random_num2] })
                break;
            case 3:
                enemies.push({ enemyX: canvas.width, enemyY: canvas.height / 2, enemy_speed: random_speed, target: player_Id_Array[random_num2] })
                break;
            case 4:
                enemies.push({ enemyX: 0, enemyY: 0, enemy_speed: random_speed, target: player_Id_Array[random_num2] })
                break;
            case 5:
                enemies.push({ enemyX: canvas.width, enemyY: canvas.height, enemy_speed: random_speed, target: player_Id_Array[random_num2] })
                break;
        }
    }
}

function enemy_hit_player() {
    for (j = 0; j < enemies.length; j++) {
        for (k = 0; k < player_Id_Array.length; k++) {
            if (collide(enemies[j].enemyX, enemies[j].enemyY, enemy_width, enemy_length, players[player_Id_Array[k]].x, players[player_Id_Array[k]].y, playerWidth, playerLength)) {
                gameOver = true;
            }
        }
    }
}

function move_enemy() {
    for (j = 0; j < enemies.length; j++) {
        let yDiff = enemies[j].enemyY - players[enemies[j].target].y;
        let xDiff = enemies[j].enemyX - players[enemies[j].target].x;
        let random_num = Math.floor(Math.random() * 8)
        if ((Math.abs(yDiff) > Math.abs(xDiff) && random_num != 7) || random_num == 0) {
            if (yDiff > 0) {
                enemies[j].enemyY -= enemies[j].enemy_speed;
                if (check_player_movement(enemies[j].enemyX, enemies[j].enemyY, enemy_width, enemy_length)) {
                    enemies[j].enemyY += enemies[j].enemy_speed;
                }
            }
            else {
                enemies[j].enemyY += enemies[j].enemy_speed;
                if (check_player_movement(enemies[j].enemyX, enemies[j].enemyY, enemy_width, enemy_length)) {
                    enemies[j].enemyY -= enemies[j].enemy_speed;
                }
            }
        }
        else {
            if (xDiff > 0) {
                enemies[j].enemyX -= enemies[j].enemy_speed;
                if (check_player_movement(enemies[j].enemyX, enemies[j].enemyY, enemy_width, enemy_length)) {
                    enemies[j].enemyX += enemies[j].enemy_speed;
                }
            }
            else {
                enemies[j].enemyX += enemies[j].enemy_speed;
                if (check_player_movement(enemies[j].enemyX, enemies[j].enemyY, enemy_width, enemy_length)) {
                    enemies[j].enemyX -= enemies[j].enemy_speed;
                }
            }
        }
    }
}

function player_Gets_Pow() {
    if(powerUp.length>0){
        for (k = 0; k < player_Id_Array.length; k++) {
            if (collide(players[player_Id_Array[k]].x, players[player_Id_Array[k]].y, playerWidth, playerLength, powerUp[0].x, powerUp[0].y, 45, 45)) {
                info.takedowns += enemies.length;
                enemies = [];
                powerUp = [];
                break;
            }
        }
    }
}
function reset_game() {
    if (gameOver) {
        gameOver = false;
        start_time = Date.now();
        enemies = [];
        bullets = [];
        powerUp = [];
        info.takedowns = 0;
    }
}