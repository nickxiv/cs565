// CS 535 - Computer Graphics
// Project #2
// Nick Martin - jnmartin8@crimson.ua.edu
// This WebGL project allows for creation a modification of tetriminos from Tetris. (https://en.wikipedia.org/wiki/Tetris)

// Add: To add a tetrimino, a user can use the left mouse button to drag the corresponding
// original tetrimino located within the top band. When an original tetrimino is selected to
// be dragged, a duplicate is made out of the original. It is the duplicate that is actually
// dragged. The original one stays at the same location. The goal is to place the duplicate in
// the middle band, but it is okay to leave the duplicate in the top band. Of course the
// duplicate will be immediately deleted if it is moved into the bottom band. Please see the
// Delete operation below for details.

// Move: To move a duplicate tetrimino, use the left mouse button to drag it. The original
// tetrimino can't be moved.

// Rotate: To rotate a duplicate tetrimino, hold down the SHIFT key and then use the left
// mouse button to click one of its four minos. The tetrimino will rotate 90 degrees
// counterclockwise about the center of the mino that is clicked. The original tetrimino can't
// be rotated.

// Delete: At the end of the moving or rotating operation, if the tetrimino intersects with the
// bottom band, the tetrimino will be deleted. Since an original tetrimino can't be moved or
// rotated, it can't be deleted.

//#region Global vars
"use strict"

var canvas;
var gl;

var projection; // projection matrix uniform shader variable location
var transformation; // projection matrix uniform shader variable location
var vPosition;
var fColor;

// state representation
var Blocks; // seven blocks
var line1, line2; // band borders
var BlockIdToBeMoved; // this block is moving
var MoveCount;
var OldX;
var OldY;
var stopRefreshing = false;
//#endregion
//#region Classes
class CPiece {
    constructor(n, color, x0, y0, x1, y1, x2, y2, x3, y3) {
        this.NumVertices = n;
        this.color = color;
        this.points = [];
        this.points.push(vec2(x0, y0));
        this.points.push(vec2(x1, y1));
        this.points.push(vec2(x2, y2));
        this.points.push(vec2(x3, y3));
        // this.colors=[];
        // for (var i=0; i<4; i++) this.colors.push(color);
        this.vBuffer = 0;
        // this.cBuffer=0;
        this.OffsetX = 0;
        this.OffsetY = 0;
        this.Angle = 0;
    }
    UpdateOffset(dx, dy) {
        this.OffsetX += dx;
        this.OffsetY += dy;
    };

    SetOffset(dx, dy) {
        this.OffsetX = dx;
        this.OffsetY = dy;
    };

    UpdateAngle(deg) {
        this.Angle += deg;
    };

    SetAngle(deg) {
        this.Angle = deg;
    };

    isLeft(x, y, id) {
        var id1 = (id + 1) % this.NumVertices;
        return (y - this.points[id][1]) * (this.points[id1][0] - this.points[id][0]) > (x - this.points[id][0]) * (this.points[id1][1] - this.points[id][1]);
    };

    transform(x, y) {
        var theta = -Math.PI / 180 * this.Angle; // in radians
        var x2 = this.points[0][0] + (x - this.points[0][0] - this.OffsetX) * Math.cos(theta) - (y - this.points[0][1] - this.OffsetY) * Math.sin(theta);
        var y2 = this.points[0][1] + (x - this.points[0][0] - this.OffsetX) * Math.sin(theta) + (y - this.points[0][1] - this.OffsetY) * Math.cos(theta);
        return vec2(x2, y2);
    };

    isInside(x, y) {
        var p = this.transform(x, y);
        for (var i = 0; i < this.NumVertices; i++) {
            if (!this.isLeft(p[0], p[1], i))
                return false;
        }
        return true;
    };

    init() {
        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

        // this.cBuffer = gl.createBuffer();
        // gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );
        //gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW );
    };

    draw() {
        var tm = translate(this.points[0][0] + this.OffsetX, this.points[0][1] + this.OffsetY, 0.0);
        tm = mult(tm, rotate(this.Angle, vec3(0, 0, 1)));
        tm = mult(tm, translate(-this.points[0][0], -this.points[0][1], 0.0));
        gl.uniformMatrix4fv(transformation, gl.TRUE, flatten(tm));

        // send the color as a uniform variable
        gl.uniform4fv(fColor, flatten(this.color));

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        if (this.NumVertices == 3) {
            gl.drawArrays(gl.TRIANGLES, 0, this.NumVertices);
        }
        else {
            gl.drawArrays(gl.TRIANGLE_FAN, 0, this.NumVertices);
        }
    };
}

class Tetrimino {
    constructor(x1, y1, x2, y2, x3, y3, x4, y4, color, isOriginal = false) {
        this.color = color;
        this.isOriginal = isOriginal;
        this.mino1 = new CPiece(4, color, x1 + 10, y1, x1 + 10, y1 + 10, x1, y1 + 10, x1, y1); // each mino is 10x10
        this.mino2 = new CPiece(4, color, x2 + 10, y2, x2 + 10, y2 + 10, x2, y2 + 10, x2, y2); 
        this.mino3 = new CPiece(4, color, x3 + 10, y3, x3 + 10, y3 + 10, x3, y3 + 10, x3, y3); 
        this.mino4 = new CPiece(4, color, x4 + 10, y4, x4 + 10, y4 + 10, x4, y4 + 10, x4, y4); 
    }

    SetTetriminoAngle(deg) {
        this.mino1.SetAngle(deg);
        this.mino2.SetAngle(deg);
        this.mino3.SetAngle(deg);
        this.mino4.SetAngle(deg);
    };

    SetTetriminoOffset(dx, dy) {
        this.mino1.SetOffset(dx, dy);
        this.mino2.SetOffset(dx, dy);
        this.mino3.SetOffset(dx, dy);
        this.mino4.SetOffset(dx, dy);
    };

    UpdateTetriminoOffset(dx, dy) {
        // if (this.isOriginal) return;
        this.mino1.UpdateOffset(dx, dy);
        this.mino2.UpdateOffset(dx, dy);
        this.mino3.UpdateOffset(dx, dy);
        this.mino4.UpdateOffset(dx, dy);
    };

    UpdateTetriminoAngle(deg) {
        this.mino1.UpdateAngle(deg);
        this.mino2.UpdateAngle(deg);
        this.mino3.UpdateAngle(deg);
        this.mino4.UpdateAngle(deg);
    }

    RotateTetrimino(x, y) {
        console.log("rotato");
        var theta = (Math.PI / 180) * 90; // in radians
        var mino1Center = FindMinoCenter(this.mino1);
        var mino2Center = FindMinoCenter(this.mino2);
        var mino3Center = FindMinoCenter(this.mino3);
        var mino4Center = FindMinoCenter(this.mino4);

        if (this.mino1.isInside(x, y)) {
            var v2 = new vec2(mino2Center[0] - mino1Center[0] + (this.mino2.OffsetX - this.mino1.OffsetX), mino2Center[1] - mino1Center[1] + (this.mino2.OffsetY - this.mino1.OffsetY));
            
            var dx2 = v2[0] * Math.cos(theta) - v2[1]*Math.sin(theta) - v2[0];
            var dy2 = v2[1] * Math.cos(theta) + v2[0] * Math.sin(theta) - v2[1];
            
            this.mino2.UpdateOffset(dx2, dy2);
            
            var v3 = new vec2(mino3Center[0] - mino1Center[0] + (this.mino3.OffsetX - this.mino1.OffsetX), mino3Center[1] - mino1Center[1] + (this.mino3.OffsetY - this.mino1.OffsetY));
            
            var dx3 = v3[0] * Math.cos(theta) - v3[1]*Math.sin(theta) -v3[0];
            var dy3 = v3[1] * Math.cos(theta) + v3[0] * Math.sin(theta) - v3[1];
            
            this.mino3.UpdateOffset(dx3, dy3);
            
            var v4 = new vec2(mino4Center[0] - mino1Center[0] + (this.mino4.OffsetX - this.mino1.OffsetX), mino4Center[1] - mino1Center[1] + (this.mino4.OffsetY - this.mino1.OffsetY));

            var dx4 = v4[0] * Math.cos(theta) - v4[1]*Math.sin(theta) - v4[0];
            var dy4 = v4[1] * Math.cos(theta) + v4[0] * Math.sin(theta) - v4[1];

            this.mino4.UpdateOffset(dx4, dy4);

        }
        else if (this.mino2.isInside(x, y)) {
            var v1 = new vec2(mino1Center[0] - mino2Center[0] + (this.mino1.OffsetX - this.mino2.OffsetX), mino1Center[1] - mino2Center[1] + (this.mino1.OffsetY - this.mino2.OffsetY));
            
            var dx1 = v1[0] * Math.cos(theta) - v1[1]*Math.sin(theta) - v1[0];
            var dy1 = v1[1] * Math.cos(theta) + v1[0] * Math.sin(theta) - v1[1];
            
            
            this.mino1.UpdateOffset(dx1, dy1);
            
            
            var v3 = new vec2(mino3Center[0] - mino2Center[0] + (this.mino3.OffsetX - this.mino2.OffsetX), mino3Center[1] - mino2Center[1] + (this.mino3.OffsetY - this.mino2.OffsetY));
            
            var dx3 = v3[0] * Math.cos(theta) - v3[1]*Math.sin(theta) -v3[0];
            var dy3 = v3[1] * Math.cos(theta) + v3[0] * Math.sin(theta) - v3[1];
            
            this.mino3.UpdateOffset(dx3, dy3);
            
            var v4 = new vec2(mino4Center[0] - mino2Center[0] + (this.mino4.OffsetX - this.mino2.OffsetX), mino4Center[1] - mino2Center[1] + (this.mino4.OffsetY - this.mino2.OffsetY));

            var dx4 = v4[0] * Math.cos(theta) - v4[1]*Math.sin(theta) - v4[0];
            var dy4 = v4[1] * Math.cos(theta) + v4[0] * Math.sin(theta) - v4[1];

            this.mino4.UpdateOffset(dx4, dy4);
        }
        else if (this.mino3.isInside(x, y)) {
            console.log("mino3");
            var v1 = new vec2(mino1Center[0] - mino3Center[0] + (this.mino1.OffsetX - this.mino3.OffsetX), mino1Center[1] - mino3Center[1] + (this.mino1.OffsetY - this.mino3.OffsetY));
            
            var dx1 = v1[0] * Math.cos(theta) - v1[1]*Math.sin(theta) - v1[0];
            var dy1 = v1[1] * Math.cos(theta) + v1[0] * Math.sin(theta) - v1[1];
            
            
            this.mino1.UpdateOffset(dx1, dy1);
            
            
            var v2 = new vec2(mino2Center[0] - mino3Center[0] + (this.mino2.OffsetX - this.mino3.OffsetX), mino2Center[1] - mino3Center[1] + (this.mino2.OffsetY - this.mino3.OffsetY));
            
            var dx2 = v2[0] * Math.cos(theta) - v2[1] *Math.sin(theta) -v2[0];
            var dy2 = v2[1] * Math.cos(theta) + v2[0] * Math.sin(theta) - v2[1];
            
            this.mino2.UpdateOffset(dx2, dy2);
            
            var v4 = new vec2(mino4Center[0] - mino3Center[0] + (this.mino4.OffsetX - this.mino3.OffsetX), mino4Center[1] - mino3Center[1] + (this.mino4.OffsetY - this.mino3.OffsetY));

            var dx4 = v4[0] * Math.cos(theta) - v4[1]*Math.sin(theta) - v4[0];
            var dy4 = v4[1] * Math.cos(theta) + v4[0] * Math.sin(theta) - v4[1];

            this.mino4.UpdateOffset(dx4, dy4);        
        }
        else if (this.mino4.isInside(x, y)) {
            console.log("mino4");
            var v1 = new vec2(mino1Center[0] - mino4Center[0] + (this.mino1.OffsetX - this.mino4.OffsetX), mino1Center[1] - mino4Center[1] + (this.mino1.OffsetY - this.mino4.OffsetY));
            
            var dx1 = v1[0] * Math.cos(theta) - v1[1] * Math.sin(theta) - v1[0];
            var dy1 = v1[1] * Math.cos(theta) + v1[0] * Math.sin(theta) - v1[1];
            
            
            this.mino1.UpdateOffset(dx1, dy1);
            
            
            var v2 = new vec2(mino2Center[0] - mino4Center[0] + (this.mino2.OffsetX - this.mino4.OffsetX), mino2Center[1] - mino4Center[1] + (this.mino2.OffsetY - this.mino4.OffsetY));
            
            var dx2 = v2[0] * Math.cos(theta) - v2[1] * Math.sin(theta) - v2[0];
            var dy2 = v2[1] * Math.cos(theta) + v2[0] * Math.sin(theta) - v2[1];
            
            this.mino2.UpdateOffset(dx2, dy2);
            
            var v3 = new vec2(mino3Center[0] - mino4Center[0] + (this.mino3.OffsetX - this.mino4.OffsetX), mino3Center[1] - mino4Center[1] + (this.mino3.OffsetY - this.mino4.OffsetY));

            var dx3 = v3[0] * Math.cos(theta) - v3[1] * Math.sin(theta) - v3[0];
            var dy3 = v3[1] * Math.cos(theta) + v3[0] * Math.sin(theta) - v3[1];

            this.mino3.UpdateOffset(dx3, dy3);        }
        else {
            console.log("ERROR");
            return;
        }
        
    }

    TetriminoIsInside(x, y) {
        return this.mino1.isInside(x, y) || this.mino2.isInside(x, y) || this.mino3.isInside(x, y) || this.mino4.isInside(x, y);
    };

    CrossedBottomBand(i) {
        for (var i = 0; i < 4; ++i) {
            console.log(this.mino1.points[i][1] + this.mino1.OffsetY, this.mino2.points[i][1] + this.mino2.OffsetY, this. mino3.points[i][1] + this.mino3.OffsetY, 
                this.mino4.points[i][1] + this.mino4.OffsetY)
            if (this.mino1.points[i][1] + this.mino1.OffsetY < 200
                || this.mino2.points[i][1] + this.mino2.OffsetY < 200
                || this. mino3.points[i][1] + this.mino3.OffsetY < 200
                || this.mino4.points[i][1] + this.mino4.OffsetY < 200) {
                    return true;
            }
        }
    }

    TetriminoInit() {
        this.mino1.init();
        this.mino2.init();
        this.mino3.init();
        this.mino4.init();
    }

}
//#endregion
//#region Helper functions
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i=0; i<Blocks.length; i++) {
        Blocks[i].mino1.draw();
        Blocks[i].mino2.draw();
        Blocks[i].mino3.draw();
        Blocks[i].mino4.draw();
    }
    line1.draw();
    line2.draw();

    // window.requestAnimFrame(render);
}


function Duplicate(tetriminoTemplate){
    var result = new Tetrimino(10, 580, 20, 580, 10, 570, 20, 570, vec4(1.0, 1.0, 0.0, 1.0), true); // square
    var result = new Tetrimino(tetriminoTemplate.mino1.points[0][0],
        tetriminoTemplate.mino1.points[0][1],
        tetriminoTemplate.mino2.points[0][0], 
        tetriminoTemplate.mino2.points[0][1], 
        tetriminoTemplate.mino3.points[0][0], 
        tetriminoTemplate.mino3.points[0][1], 
        tetriminoTemplate.mino4.points[0][0], 
        tetriminoTemplate.mino4.points[0][1], 
        tetriminoTemplate.color);

        console.log(tetriminoTemplate);
    return result
}

function FindMinoCenter(mino) {
    var x = ((mino.points[0][0] - mino.points[2][0]) / 2.0);
    var y = ((mino.points[0][1] - mino.points[2][1]) / 2.0);

    var result = new vec2(x + mino.points[3][0], y + mino.points[3][1]);
    console.log(result);
    return result;
}
//#endregion
//#region Window init / main function
window.onload = function initialize() {
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
//#endregion
//#region Mouse events
    canvas.addEventListener("mousedown", function(event){
            if (event.button!=0) return; // left button only
            var x = event.pageX - canvas.offsetLeft;
            var y = event.pageY - canvas.offsetTop;
            y=canvas.height-y;
            if (event.shiftKey) {  // with shift key, rotate counter-clockwise
                for (var i=Blocks.length-1; i>=0; i--) {	// search from last to first
                    if (Blocks[i].TetriminoIsInside(x, y)) {
                        if(Blocks[i].isOriginal) break;

                        // move Blocks[i] to the top
                        var temp=Blocks[i];
                        for (var j=i; j<Blocks.length - 1; j++) Blocks[j] = Blocks[j + 1];
                        Blocks[Blocks.length - 1] = temp;

                        Blocks[Blocks.length - 1].RotateTetrimino(x, y);
                        if(Blocks[Blocks.length - 1].CrossedBottomBand()) Blocks.pop();
                    
                        // redraw
                        window.requestAnimFrame(render);
                        return;
                    }
                }
                return;
            }
            
            for (var i=Blocks.length - 1; i>=0; i--) {	// search from last to first
                if (Blocks[i].TetriminoIsInside(x, y)) {
                    console.log(Blocks[i]); 
                    if (Blocks[i].isOriginal) {
                        Blocks.push(Duplicate(Blocks[i]));
                        i = Blocks.length - 1;
                        Blocks[i].TetriminoInit();
                    }
                    // move Blocks[i] to the top
                    var temp=Blocks[i];
                    for (var j=i; j<Blocks.length -1; j++) Blocks[j]=Blocks[j+1];
                    Blocks[Blocks.length - 1]=temp;
                    // remember the one to be moved
                    BlockIdToBeMoved=Blocks.length - 1;
                    MoveCount=0;
                    OldX=x;
                    OldY=y;
                    // redraw
                    window.requestAnimFrame(render);
                    // render();
                    break;
                }
            }
    });

    canvas.addEventListener("mouseup", function(event){
    stopRefreshing = false;
    if (BlockIdToBeMoved>=0) {
        BlockIdToBeMoved=-1;
    }
    });

    canvas.addEventListener("mousemove", function(event){
if (!stopRefreshing && BlockIdToBeMoved>=0) {  // if dragging
    var x = event.pageX - canvas.offsetLeft;
    var y = event.pageY - canvas.offsetTop;
    y=canvas.height-y;
    Blocks[BlockIdToBeMoved].UpdateTetriminoOffset(x-OldX, y-OldY, BlockIdToBeMoved);

    if(Blocks[BlockIdToBeMoved].CrossedBottomBand()) {
        Blocks = Blocks.filter(function(x) {
            return x !== Blocks[BlockIdToBeMoved];
        })
        stopRefreshing = true;
    }

    else {
    MoveCount++;
    OldX=x;
    OldY=y;   
}
window.requestAnimFrame(render);
    // render();
}
});
//#endregion
//#region GL init
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

//#endregion
//#region Shapes and more GL init and boot
    Blocks=[];
    Blocks.push(new Tetrimino(10, 580, 20, 580, 10, 570, 20, 570, vec4(1.0, 1.0, 0.0, 1.0), true)); // square
    Blocks.push(new Tetrimino(40, 580, 50, 580, 60, 580, 70, 580, vec4(0.0, 1.0, 1.0, 1.0), true)); // line
    Blocks.push(new Tetrimino(90, 570, 100, 570, 110, 570, 100, 580, vec4(1.0, 0.0, 1.0, 1.0), true)); // T
    Blocks.push(new Tetrimino(130, 570, 140, 570, 150, 570, 150, 580, vec4(1.0, 0.5, 0.0, 1.0), true)); // L
    Blocks.push(new Tetrimino(170, 570, 170, 580, 180, 570, 190, 570, vec4(0.0, 0.0, 1.0, 1.0), true)); // J
    Blocks.push(new Tetrimino(210, 570, 220, 570, 220, 580, 230, 580, vec4(0.0, 1.0, 0.0, 1.0), true)); // S
    Blocks.push(new Tetrimino(250, 580, 260, 580, 260, 570, 270, 570, vec4(1.0, 0.0, 0.0, 1.0), true)); // Z

    for (var i=0; i<Blocks.length; i++) {
        Blocks[i].mino1.init();
        Blocks[i].mino2.init();
        Blocks[i].mino3.init();
        Blocks[i].mino4.init();
    }

    BlockIdToBeMoved=-1; // no piece selected

    line1 = new CPiece(4, vec4(0.0, 0.0, 0.0, 1.0), 0, 400, 0, 402, 800, 402, 800, 400);
    line2 = new CPiece(4, vec4(0.0, 0.0, 0.0, 1.0), 0, 200, 0, 202, 800, 202, 800, 200);
    line1.init();
    line2.init();

    projection = gl.getUniformLocation( program, "projection" );
    var pm = ortho( 0.0, canvas.width, 0.0, canvas.height, -1.0, 1.0 );
    gl.uniformMatrix4fv( projection, gl.TRUE, flatten(pm) );

    transformation = gl.getUniformLocation( program, "transformation" );

    fColor = gl.getUniformLocation( program, "fColor" );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    // vColor = gl.getAttribLocation( program, "vColor" );

    render();
}
//#endregion

