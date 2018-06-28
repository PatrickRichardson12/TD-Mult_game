function sprite_Player_Path (type, frame) {
    var type_Anim;
    var image_Name
    switch (type) {
        case 'move':
            type_Anim = 'move';
            break;
        default:
            type_Anim = 'idle';
    }
    image_Name = 'Top_Down_Survivor/handgun/'+ type_Anim + '/survivor-' + type_Anim + '_handgun_' + frame + '.png';
    return image_Name;
}

function sprite(options) {

    var that = {};

    that.context = options.context;
    that.width = options.width;
    that.height = options.height;
    that.image = options.image;
    that.x = options.x;
    that.y = options.y;
    that.dir = options.dir;

    that.render = function () {
        // Draw the animation
        var clipx = 260;
        var clipy = 260;
        if (that.dir == 'up' || that.dir == 'down') {
            clipx = 215;
            clipy = 255;
        }

        if (that.dir == 'right' || that.dir == 'left') {
            clipx = 255;
            clipy = 215;
        }

        that.context.drawImage(
           that.image,
           0,
           0,
           clipx,
           clipy,
           that.x,
           that.y,
           that.width,
           that.height);
    };

    return that;
}