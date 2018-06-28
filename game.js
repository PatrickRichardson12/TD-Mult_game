//JAVA SCRIPT FOR LOOPS ARE WEIRD IF YOU DO AN I IN ONE SPOT YOU CANT ENTER ANOTHER FUNCTION AND USE I AGAIN ITS THE SAME I
//Micaela list: bomb to clear map // SPEED UP LEL LOL KEK //
//COOL STUFF TO ADD SPRINT BAR // LET MICAELA PICK A POWER UP // shoot multiple bullets? wall through walls? size changes? invisibility until shooting i could randomize enemy movement //
//2 health minions?
//set up movement based on time not preformance. //windows request animation frame??

var socket = io();

var canvas
var canvasContext

var gameOver = false;

//walls
const WALL_THICKNESS = 25;
const WALL = WALL_THICKNESS / 2;
const WALL_LENGTH = 125;
var walls = []; //these are the two values that we use when checking if its ok to cross over the inner walls

//Player info
var player

var movement = {
    up: false,
    down: false,
    left: false,
    right: false,
    sprint: false
}

var bullet = {
    up: false,
    down: false,
    left: false,
    right: false,
    x: null,
    y: null
}

//var moveSpeed = 0.8;
//var sprintSpeed = 1.2;
var playerWidth = 35;
var playerLength = 35;
var sprint = 0;
var sprinting = false;
var player_path;
var direction = 'right';
//var powerUp = []; // x, y, name

//bullet info
//var bullets = [];
//const BULLET_SPEED = 6;
var bulletWidth = 4;
var bulletLength = 4;
var shoot_delay = 500;
var start_time = Date.now();
var d = Date.now();
var last_Shot = Date.now();

//enemies
var enemies = [];
var enemy_width = 28;
var enemy_length = 28;
//var takedowns = 0;

var keys = [];
var info = {
    takedowns: 0
}

window.onload = function () {
    /*resources.load([
        'Top_Down_Survivor/handgun/idle/survior-idle_handgun_0.png'
    ]);*/
    canvas = document.getElementById('canvas');
    canvas.width = 1000;
    canvas.height = 1000;
    canvasContext = canvas.getContext('2d');
    setInterval(function () {
        if (!sprinting && sprint < 10) {
            sprint += 1;
        }
        //if ((powerUp.length < 1 && Math.floor(Math.random() * 100) + 1) > 95)
            //powerUp.push({ x: Math.floor(Math.random() * (canvas.width - WALL_THICKNESS * 2)) + WALL_THICKNESS, y: Math.floor(Math.random() * (canvas.height - WALL_THICKNESS * 2)) + WALL_THICKNESS, name: 'bomb' });
    }, 1000);
    setInterval(function () {
        if (sprinting && sprint > 0) {
            sprint -= 1;
        }
    }, 500);

    socket.emit('new player');
    socket.on('state', function (players, bulletsArray, enemyArray, gameOver_Server, powerUp_Array,info_Array) {
        gameOver = gameOver_Server;
        if (!gameOver) {
            // geting server info
            info = info_Array
            bullets = bulletsArray
            enemies = enemyArray;
            powerUp = powerUp_Array;

            drawMap();
            for (var id in players) {
                player = players[id];
                drawPlayer();
                if (socket.id == id) { //THIS IS YOU anything specific to you goes here (aka that specific client)
                    emitReset();
                    movePlayer();
                    shoot();  //its fine using player.x & y in there since this is only called on their turn.
                }
            }
            drawThings();
        }
        else {
            drawMap();
            game_Over();
        }
        socket.emit('movement', movement);      //by putting this in here we only respond if the server has contacted us
        socket.emit('bullet', bullet);          //I could uncomment the below code and we'd send data even if the server hasnt spoken to us IDK which is better.
    });

//    setInterval(function () {
//        socket.emit('movement', movement);
//        socket.emit('bullet', bullet);
//    }, 1000 / 60);

    wallArray();
    window.addEventListener('keydown', addMovement);
    window.addEventListener('keyup', removeMovement);
    window.addEventListener('mousedown', reset_game);
}

function drawMap() {
    colorRect(0, 0, canvas.width, canvas.height, 'black');
    colorWalls(null);
}

function drawPlayer() {
    var playerSprite = new Image();
    playerSprite.src = sprite_Player_Path(null, 0);
    var playerr = sprite({  //player sprite
        context: canvasContext,
        width: playerWidth,
        height: playerLength,
        image: playerSprite,
        x: player.x,
        y: player.y,
        dir : direction
    });
    playerr.render();
    //colorRect(player.x, player.y, playerWidth, playerLength, 'white'); //player
}

function drawThings(){
    draw_powerUps();
    draw_bullets();
    draw_enemy();
}

function game_Over() {
    canvasContext.fillStyle = 'red';
    canvasContext.font = "50px Arial";
    canvasContext.fillText('You Have Died', canvas.width / 3 + 25, canvas.height / 2);
    canvasContext.fillText('Click to Play Again', canvas.width / 3 - 25, canvas.height / 3 * 2)
}

function reset_game() {
    if (gameOver) {
        socket.emit('Reset', true);
    }
}

function colorRect(leftx, topy, width, height, drawColor) {
    canvasContext.fillStyle = drawColor;
    canvasContext.fillRect(leftx, topy, width, height);
}

function colorWalls(level) {
    canvasContext.strokeStyle = 'gray';
    canvasContext.lineWidth = WALL_THICKNESS;
    canvasContext.lineCap = 'square';
    canvasContext.beginPath();
    //walls
    canvasContext.moveTo(WALL, WALL);
    canvasContext.lineTo(WALL, canvas.height - WALL);
    canvasContext.lineTo(canvas.width - WALL, canvas.height - WALL);
    canvasContext.lineTo(canvas.width - WALL, WALL);
    canvasContext.lineTo(WALL, WALL);
    canvasContext.stroke();

    //inner walls
    colorRect(canvas.width / 4, canvas.height / 4, WALL_LENGTH, WALL_THICKNESS, 'gray');
    colorRect(canvas.width / 4, canvas.height / 4, WALL_THICKNESS, WALL_LENGTH, 'gray');
    colorRect(canvas.width / 4 * 3 - WALL_LENGTH + WALL_THICKNESS, canvas.height / 4, WALL_LENGTH, WALL_THICKNESS, 'gray');
    colorRect(canvas.width / 4 * 3, canvas.height / 4, WALL_THICKNESS, WALL_LENGTH, 'gray');
    colorRect(canvas.width / 4 * 3 - WALL_LENGTH + WALL_THICKNESS, canvas.height / 4 * 3 - WALL_THICKNESS, WALL_LENGTH, WALL_THICKNESS, 'gray');
    colorRect(canvas.width / 4 * 3, canvas.height / 4 * 3 - WALL_LENGTH, WALL_THICKNESS, WALL_LENGTH, 'gray');
    colorRect(canvas.width / 4, canvas.height / 4 * 3 - WALL_THICKNESS, WALL_LENGTH, WALL_THICKNESS, 'gray');
    colorRect(canvas.width / 4, canvas.height / 4 * 3 - WALL_LENGTH, WALL_THICKNESS, WALL_LENGTH, 'gray');


    //takedowns & info
    canvasContext.fillStyle = 'black';
    canvasContext.font = '20px Arial';
    canvasContext.fillText('Takedowns : ' + info.takedowns, canvas.width / 8 * 6, canvas.height - 5);
    canvasContext.fillText('WASD to Move Arrow Keys to Shoot                            Space to Sprint', canvas.width / 10, WALL_THICKNESS - 5);
    canvasContext.fillText('Sprint Bar : ', canvas.width / 50, canvas.height - 5);
    canvasContext.strokeStyle = 'black';
    colorRect(canvas.width / 8, canvas.height - WALL_THICKNESS + 5, sprint * 25, WALL_THICKNESS - 10, 'black');
    colorRect(canvas.width / 20 * 9, canvas.height - WALL_THICKNESS, 100, WALL_THICKNESS, 'black');
    colorRect(canvas.width / 20 * 9, 0, 100, WALL_THICKNESS, 'black');
    colorRect(0, canvas.height / 2 - 50, WALL_THICKNESS, 100, 'black');
    colorRect(canvas.width - WALL_THICKNESS, canvas.height / 2 - 50, WALL_THICKNESS, 100, 'black');
    colorRect(canvas.width / 20 * 9, canvas.height, 100, WALL_THICKNESS, 'black');
    colorRect(0, 0, WALL_THICKNESS * 2, WALL_THICKNESS * 2, 'black');
    colorRect(canvas.width - WALL_THICKNESS * 2, canvas.height - WALL_THICKNESS * 2, WALL_THICKNESS * 2, WALL_THICKNESS * 2, 'black');
}

function draw_powerUps() {
    if (powerUp.length > 0) {
        //bombb = new Sprite('bomb.png', [powerUp[0].x, powerUp[0].y], [45, 45], 0, [0]);
        //bombb.render(canvasContext);
        colorRect(powerUp[0].x, powerUp[0].y,45,45,'red')
        //just going to go ahead and check collison in here cause i'm lazy and don't want to write another function
        /*
        if (collide(player.x, player.y, playerWidth, playerLength, powerUp[0].x, powerUp[0].y, 45, 45)) {
            takedowns += enemies.length;
            enemies = [];
            powerUp = [];
        }
    */
    }
}

function collide(x1, y1, width1, height1, x2, y2, width2, height2) {
    if (x1 < x2 + width2 && x1 + width1 > x2 && y1 < y2 + height2 && height1 + y1 > y2) {
        return true;
    }
    return false;
}

/*
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
*/

function addMovement(evt) {
    keys[evt.keyCode] = true;
}

function removeMovement(evt) {
    delete keys[evt.keyCode];
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

function movePlayer() {
    //move up
    if (keys[119] || keys[87]) { //possible optimization about moving first. move second after you have done your checks.
        //player.y -= moveSpeed;
        movement.up = true;
        //if (player.y < WALL_THICKNESS) {
          //player.y = WALL_THICKNESS;
            //movement.up = false;
        //}
        //if (check_player_movement(player.x, player.y, playerWidth, playerLength)) {
            //player.y += moveSpeed;
            //movement.up = false;
        //}
        direction = 'up';
    }
    //move down
    if (keys[83] || keys[115]) {
        //player.y += moveSpeed;
        movement.down = true;
        //if (player.y > canvas.height - WALL_THICKNESS - playerLength) {
            //player.y = canvas.height - WALL_THICKNESS - playerLength;
        //}
        //if (check_player_movement(player.x, player.y, playerWidth, playerLength)) {
            //player.y -= moveSpeed;
            //movement.down = false;
        //}
        direction = 'down';
    }
    //move right
    if (keys[100] || keys[68]) {
        //player.x += moveSpeed;
        movement.right = true;
        //if (player.x > canvas.width - WALL_THICKNESS - playerWidth) {
            //player.x = canvas.width - WALL_THICKNESS - playerWidth;
        //}
        //if (check_player_movement(player.x, player.y, playerWidth, playerLength)) {
            //player.x -= moveSpeed;
            //movement.right = false;
        //}
        direction = 'right';
    }
    //move left 
    if (keys[97] || keys[65]) {
        //player.x -= moveSpeed;
        movement.left = true;
        //if (player.x < WALL_THICKNESS) {
            //player.x = WALL_THICKNESS;
        //}
        //if (check_player_movement(player.x, player.y, playerWidth, playerLength)) {
            //player.x += moveSpeed;
            //movement.left = false;
        //}
        direction = 'left';
    }
    if (keys[32] && sprint > 0) {
        sprinting = true;
        //moveSpeed = 1.2;
        movement.sprint = true;
    }
    else {
        sprinting = false;
        //moveSpeed = 0.8;
        movement.sprint = false;
    }
}
function emitReset(){
    movement.up = false;
    movement.down = false;
    movement.left = false;
    movement.right = false;
    movement.sprint = false;

    bullet.up = false;
    bullet.right = false;
    bullet.down = false;
    bullet.left = false;
}

function shoot() {
    //shooting
    d = Date.now();
    if (keys[37] && keys[38]) {
        if (d - last_Shot >= shoot_delay) {
            //bullets.push({ bulletY: player.y + playerLength / 4, bulletX: player.x + playerWidth / 2, dir: 'up-left' });
            bullet.up = true;
            bullet.left = true;
            bullet.x = player.x
            bullet.y = player.y
            last_Shot = Date.now();
        }
    }
    else if (keys[38] && keys[39]) {
        if (d - last_Shot >= shoot_delay) {
            //bullets.push({ bulletY: player.y + playerLength / 4, bulletX: player.x + playerWidth / 2, dir: 'up-right' });
            bullet.up = true;
            bullet.right = true;
            bullet.x = player.x
            bullet.y = player.y
            last_Shot = Date.now();
        }
    }
    else if (keys[40] && keys[37]) {
        if (d - last_Shot >= shoot_delay) {
            //bullets.push({ bulletY: player.y + playerLength / 4, bulletX: player.x + playerWidth / 2, dir: 'down-left' });
            bullet.down = true;
            bullet.left = true;
            bullet.x = player.x
            bullet.y = player.y
            last_Shot = Date.now();
        }
    }
    else if (keys[40] && keys[39]) {
        if (d - last_Shot >= shoot_delay) {
            //bullets.push({ bulletY: player.y + playerLength / 4, bulletX: player.x + playerWidth / 2, dir: 'down-right' });
            bullet.down = true;
            bullet.right = true;
            bullet.x = player.x
            bullet.y = player.y
            last_Shot = Date.now();
        }
    }
    else if (keys[37]) {
        if (d - last_Shot >= shoot_delay) {
            //bullets.push({ bulletY: player.y + playerLength / 4, bulletX: player.x + playerWidth / 2, dir: 'left' });
            bullet.left = true;
            bullet.x = player.x
            bullet.y = player.y
            last_Shot = Date.now();
        }
    }
    else if (keys[38]) {
        if (d - last_Shot >= shoot_delay) {
            //bullets.push({ bulletY: player.y + playerLength / 4, bulletX: player.x + playerWidth / 2, dir: 'up' });
            bullet.up = true;
            bullet.x = player.x
            bullet.y = player.y
            last_Shot = Date.now();
        }
    }
    else if (keys[39]) {
        if (d - last_Shot >= shoot_delay) {
            //bullets.push({ bulletY: player.y + playerLength / 4, bulletX: player.x + playerWidth / 2, dir: 'right' });
            bullet.right = true;
            bullet.x = player.x
            bullet.y = player.y
            last_Shot = Date.now();
        }
    }
    else if (keys[40]) {
        if (d - last_Shot >= shoot_delay) {
            //bullets.push({ bulletY: player.y + playerLength / 4, bulletX: player.x + playerWidth / 2, dir: 'down' });
            bullet.down = true;
            bullet.x = player.x
            bullet.y = player.y
            last_Shot = Date.now();
        }
    }
}

function draw_bullets() {
    for (i = 0; i < bullets.length; i++) { //bullet off map
        //if (bullets[i].bulletX < WALL_THICKNESS || bullets[i].bulletX > canvas.width - WALL_THICKNESS || bullets[i].bulletY < WALL_THICKNESS || bullets[i].bulletY > canvas.height - WALL_THICKNESS) {
         //   bullets.splice(i, 1); //i-- here??? if we splice
          //  continue;
        //}
        switch (bullets[i].dir) {
            case 'left':
                //bullets[i].bulletX -= BULLET_SPEED;
                colorRect(bullets[i].bulletX, bullets[i].bulletY, bulletLength, bulletWidth, 'white');
                break;
            case 'up':
                //bullets[i].bulletY -= BULLET_SPEED;
                colorRect(bullets[i].bulletX, bullets[i].bulletY, bulletWidth, bulletLength, 'white');
                break;
            case 'right':
                //bullets[i].bulletX += BULLET_SPEED;
                colorRect(bullets[i].bulletX, bullets[i].bulletY, bulletLength, bulletWidth, 'white');
                break;
            case 'down':
                //bullets[i].bulletY += BULLET_SPEED;
                colorRect(bullets[i].bulletX, bullets[i].bulletY, bulletWidth, bulletLength, 'white');
                break;
            case 'up-left':
                //bullets[i].bulletY -= BULLET_SPEED / 2;
                //bullets[i].bulletX -= BULLET_SPEED / 2;
                colorRect(bullets[i].bulletX, bullets[i].bulletY, bulletLength, bulletWidth, 'white');
                break;
            case 'up-right':
                //bullets[i].bulletY -= BULLET_SPEED / 2;
                //bullets[i].bulletX += BULLET_SPEED / 2;
                colorRect(bullets[i].bulletX, bullets[i].bulletY, bulletWidth, bulletLength, 'white');
                break;
            case 'down-right':
                //bullets[i].bulletY += BULLET_SPEED / 2;
                //bullets[i].bulletX += BULLET_SPEED / 2;
                colorRect(bullets[i].bulletX, bullets[i].bulletY, bulletLength, bulletWidth, 'white');
                break;
            case 'down-left':
                //bullets[i].bulletY += BULLET_SPEED / 2;
                //bullets[i].bulletX -= BULLET_SPEED / 2;
                colorRect(bullets[i].bulletX, bullets[i].bulletY, bulletWidth, bulletLength, 'white');
                break;
        }
    }
    //bullets_hit_enemies();
    //bullets_hit_walls();
}
//hit walls?
/*
function bullets_hit_walls() {
    for (i = 0; i < bullets.length; i++) {
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

//hit enemies??

function bullets_hit_enemies() {
    for (i = 0; i < bullets.length; i++) {
        for (j = 0; j < enemies.length; j++) {
            if (collide(bullets[i].bulletX, bullets[i].bulletY, bulletWidth, bulletLength, enemies[j].enemyX, enemies[j].enemyY, enemy_width, enemy_length)) {
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                takedowns++;
                break;
            }
        }
    }
}

function enemy_hit_player() {
    for (j = 0; j < enemies.length; j++) {
        if (collide(enemies[j].enemyX, enemies[j].enemyY, enemy_width, enemy_length, player.x, player.y, playerWidth, playerLength))
            gameOver = true;
    }
}



function enemy() {
    d = Date.now();
    enemy_hit_player();
    if (Math.random() < 1 - Math.pow(.99995, (d - start_time) / 1000)) {
        let random_num = Math.floor(Math.random() * (6));
        let random_speed = Math.floor((Math.random() * 16) + 59); //btwn .59-.75 speed for enemies
        random_speed /= 100;
        switch (random_num) {    //spawn locations for enemies
            case 0:
                enemies.push({ enemyX: canvas.width / 2, enemyY: 0, enemy_speed: random_speed })
                break;
            case 1:
                enemies.push({ enemyX: canvas.width / 2, enemyY: canvas.height, enemy_speed: random_speed })
                break;
            case 2:
                enemies.push({ enemyX: 0, enemyY: canvas.height / 2, enemy_speed: random_speed })
                break;
            case 3:
                enemies.push({ enemyX: canvas.width, enemyY: canvas.height / 2, enemy_speed: random_speed })
                break;
            case 4:
                enemies.push({ enemyX: 0, enemyY: 0, enemy_speed: random_speed })
                break;
            case 5:
                enemies.push({ enemyX: canvas.width, enemyY: canvas.height, enemy_speed: random_speed })
                break;
        }
    }
}
*/

function draw_enemy() {
    for (j = 0; j < enemies.length; j++) {
        /*
        let yDiff = enemies[j].enemyY - player.y;
        let xDiff = enemies[j].enemyX - player.x;
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
        */
        colorRect(enemies[j].enemyX, enemies[j].enemyY, enemy_width, enemy_length, 'green');
    }
}