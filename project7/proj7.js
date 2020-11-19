// CS 535 - Computer Graphics
// Project #6
// Nick Martin - jnmartin8@crimson.ua.edu
// This WebGL project demonstrates 3D modelling, viewing, interaction, texture mapping, and blending in WebGL.

// A room is constructed using quadrilaterals drawn using the drawArrays function to construct the walls, paintings, and picture frames.

// These quadrilaterals are then mapped with textures to give them a more homey feel.

// The paintings on the wall display pictures of some of the first presidents of the United States.
// You can cycle through these presidents using the shift left and shift right buttons.
// You can also select various pictures frames using the Frame 1-5 buttons.


// Please note: the room is not a perfect square; the left and right walls have been angled out so that one can see them and the paintings when viewing from the front.

var canvas;
var gl;

const VERTICES_PER_QUAD = 6; // 6 vertices per quadrilateral
var program;


var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var limeTexture;
var beigeTexture;
var boardTexture;
var wallpaper1Texture;
var ceilingTexture;

var modelViewMatrix, modelViewMatrixLoc;
var projectionMatrix, projectionMatrixLoc;

var eye = vec3(0.0, 0.0, 1);
var at = vec3(0.0, 0.0, 0.0);
var up =  vec3(0.0, 1.0, 0.0);

var near    = 10;
var far     = -10;
var left    = 1.0;
var right   = -1.0;
var ytop    = -1.0;
var bottom  = 1.0;

var texCoord = [
    vec2(1, 0),
    vec2(1, 1),
    vec2(0, 1),
    vec2(0, 0)
];

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),  //0
    vec4( -0.5,  0.5,  0.5, 1.0 ),  //1
    vec4( 0.5,  0.95,  0.5, 1.0 ),   //2
    vec4( 0.5, -0.95,  0.5, 1.0 ),   //3
    vec4( -0.5, -0.5, -0.5, 1.0 ),  //4
    vec4( -0.5,  0.5, -0.5, 1.0 ),  //5
    vec4( 0.5,  0.95, -0.5, 1.0 ),   //6
    vec4( 0.5, -0.95, -0.5, 1.0 )    //7
];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;
var theta = [45.0, 45.0, 45.0];

var thetaLoc;

var flag = false;
var showCeilings = false;
var chosenWallpaper = 2;

function configureTexture( image ) {
    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 
         gl.RGBA, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    
    return texture;
}


function quad(a, b, c, d) { 
    quadPoints(vertices[a], vertices[b], vertices[c], vertices[d]);
}

function quadPoints(a, b, c, d) { // 6 vertices per quadrilateral

    pointsArray.push(a); 
    colorsArray.push(vec4( 1.0, 1.0, 1.0, 1.0 )); 
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(b); 
    colorsArray.push(vec4( 1.0, 1.0, 1.0, 1.0 ));
    texCoordsArray.push(texCoord[1]); 

    pointsArray.push(c); 
    colorsArray.push(vec4( 1.0, 1.0, 1.0, 1.0 ));
    texCoordsArray.push(texCoord[2]); 
  
    pointsArray.push(a); 
    colorsArray.push(vec4( 1.0, 1.0, 1.0, 1.0 ));
    texCoordsArray.push(texCoord[0]); 

    pointsArray.push(c); 
    colorsArray.push(vec4( 1.0, 1.0, 1.0, 1.0 ));
    texCoordsArray.push(texCoord[2]); 

    pointsArray.push(d); 
    colorsArray.push(vec4( 1.0, 1.0, 1.0, 1.0 ));
    texCoordsArray.push(texCoord[3]);   

}


function board() {
    quadPoints(
        vec4( -1, 1, 0, 1.0),
        vec4( -1, -1, 0, 1.0),
        vec4( 1, -1, 0, 1.0),
        vec4( 1, 1, 0, 1.0)
        );
}

function roomInteriors() {
    billiardRoomInterior();
    kitchenInterior();
}

function roomExteriors() {
    billiardRoomExterior();
    kitchenExterior();
}

function billiardRoomInterior() {
    quadPoints(
        vec4( 0.97, 0.01, -0.25, 1.0),
        vec4( 0.97, 0.01, 0, 1.0),
        vec4( 0.49, 0.01, 0, 1.0),
        vec4( 0.49, 0.01, -0.25, 1.0)
        );
        
    quadPoints(
        vec4( 0.49, 0.01, -0.25, 1.0),        
        vec4( 0.49, 0.01, 0, 1.0),
        vec4( 0.49, 0.37, 0, 1.0),
        vec4( 0.49, 0.37, -0.25, 1.0),
    ),
    quadPoints(
        vec4( 0.49, 0.37, -0.25, 1.0),
        vec4( 0.49, 0.37, 0, 1.0),
        vec4( 0.97, 0.37, 0, 1.0),
        vec4( 0.97, 0.37, -0.25, 1.0)
    );
    quadPoints(
        vec4( 0.97, 0.37, -0.25, 1.0),
        vec4( 0.97, 0.37, 0, 1.0),
        vec4( 0.97, 0.01, 0, 1.0),
        vec4( 0.97, 0.01, -0.25, 1.0)
    )
}
function kitchenInterior() {
    quadPoints(
        vec4( -0.49, 0.49, -0.25, 1.0),
        vec4( -0.49, 0.49, 0, 1.0),
        vec4( -0.88, 0.49, 0, 1.0),
        vec4( -0.88, 0.49, -0.25, 1.0)
    );
    quadPoints(
        vec4( -0.88, 0.49, -0.25, 1.0),
        vec4( -0.88, 0.49, 0, 1.0),
        vec4( -0.88, 0.57, 0, 1.0),
        vec4( -0.88, 0.57, -0.25, 1.0),
    );
    quadPoints(
        vec4( -0.88, 0.57, -0.25, 1.0),
        vec4( -0.88, 0.57, 0, 1.0),
        vec4( -0.98, 0.57, 0, 1.0),
        vec4( -0.98, 0.57, -0.25, 1.0),
    );
    quadPoints(
        vec4( -0.98, 0.57, 0, 1.0),
        vec4( -0.98, 0.57, -0.25, 1.0),
        vec4( -0.98, 0.96, -0.25, 1.0),
        vec4( -0.98, 0.96, 0., 1.0),
    );
    quadPoints(
        vec4( -0.98, 0.96, -0.25, 1.0),
        vec4( -0.98, 0.96, 0, 1.0),
        vec4( -0.49, 0.96, 0, 1.0),
        vec4( -0.49, 0.96, -0.25, 1.0),

    );
    quadPoints(
        vec4( -0.49, 0.96, -0.25, 1.0),
        vec4( -0.49, 0.96, 0, 1.0),
        vec4( -0.49, 0.49, 0, 1.0),
        vec4( -0.49, 0.49, -0.25, 1.0)
    );        
    // quadPoints(
    //     vec4( 0.49, 0.01, -0.25, 1.0),        
    //     vec4( 0.49, 0.01, 0, 1.0),
    //     vec4( 0.49, 0.37, 0, 1.0),
    //     vec4( 0.49, 0.37, -0.25, 1.0),
    // ),
    // quadPoints(
    //     vec4( 0.49, 0.37, -0.25, 1.0),
    //     vec4( 0.49, 0.37, 0, 1.0),
    //     vec4( 0.97, 0.37, 0, 1.0),
    //     vec4( 0.97, 0.37, -0.25, 1.0)
    // );
    // quadPoints(
    //     vec4( 0.97, 0.37, -0.25, 1.0),
    //     vec4( 0.97, 0.37, 0, 1.0),
    //     vec4( 0.97, 0.01, 0, 1.0),
    //     vec4( 0.97, 0.01, -0.25, 1.0)
    // )
}

function billiardRoomExterior() {
    quadPoints(
        vec4( 0.97, 0.009, -0.25, 1.0),
        vec4( 0.97, 0.009, 0, 1.0),
        vec4( 0.49, 0.009, 0, 1.0),
        vec4( 0.49, 0.009, -0.25, 1.0)
    );
    quadPoints(
        vec4( 0.489, 0.01, -0.25, 1.0),        
        vec4( 0.489, 0.01, 0, 1.0),
        vec4( 0.489, 0.37, 0, 1.0),
        vec4( 0.489, 0.37, -0.25, 1.0),
    );
    quadPoints(
        vec4( 0.49, 0.3701, -0.25, 1.0),
        vec4( 0.49, 0.3701, 0, 1.0),
        vec4( 0.97, 0.3701, 0, 1.0),
        vec4( 0.97, 0.3701, -0.25, 1.0)
    );
    quadPoints(
        vec4( 0.9701, 0.37, -0.25, 1.0),
        vec4( 0.9701, 0.37, 0, 1.0),
        vec4( 0.9701, 0.01, 0, 1.0),
        vec4( 0.9701, 0.01, -0.25, 1.0)
    )
}

function kitchenExterior() {
    quadPoints(
        vec4( -0.49, 0.489, -0.25, 1.0),
        vec4( -0.49, 0.489, 0, 1.0),
        vec4( -0.88, 0.489, 0, 1.0),
        vec4( -0.88, 0.489, -0.25, 1.0)
    );
    quadPoints(
        vec4( -0.881, 0.49, -0.25, 1.0),
        vec4( -0.881, 0.49, 0, 1.0),
        vec4( -0.881, 0.57, 0, 1.0),
        vec4( -0.881, 0.57, -0.25, 1.0),
    );
    quadPoints(
        vec4( -0.88, 0.569, -0.25, 1.0),
        vec4( -0.88, 0.569, 0, 1.0),
        vec4( -0.98, 0.569, 0, 1.0),
        vec4( -0.98, 0.569, -0.25, 1.0),
    );
    quadPoints(
        vec4( -0.981, 0.57, 0, 1.0),
        vec4( -0.981, 0.57, -0.25, 1.0),
        vec4( -0.981, 0.96, -0.25, 1.0),
        vec4( -0.981, 0.96, 0., 1.0),
    );
    quadPoints(
        vec4( -0.98, 0.9601, -0.25, 1.0),
        vec4( -0.98, 0.9601, 0, 1.0),
        vec4( -0.49, 0.9601, 0, 1.0),
        vec4( -0.49, 0.9601, -0.25, 1.0),

    );
    quadPoints(
        vec4( -0.489, 0.96, -0.25, 1.0),
        vec4( -0.489, 0.96, 0, 1.0),
        vec4( -0.489, 0.49, 0, 1.0),
        vec4( -0.489, 0.49, -0.25, 1.0)
    );
}

function ceilings() {
    quadPoints(                         // billiard room
        vec4( 0.97, 0.01, -0.25, 1.0),
        vec4( 0.97, 0.37, -0.25, 1.0),
        vec4( 0.49, 0.37, -0.25, 1.0),
        vec4( 0.49, 0.01, -0.25, 1.0),        
    );
    quadPoints(                         // kitchen 1
        vec4( -0.490, 0.489, -0.25, 1.0),
        vec4( -0.490, 0.570, -0.25, 1.0),
        vec4( -0.881, 0.570, -0.25, 1.0),
        vec4( -0.881, 0.489, -0.25, 1.0)
    );
    quadPoints(                         // kitchen 2
        vec4( -0.490, 0.570, -0.25, 1.0),
        vec4( -0.489, 0.96, -0.25, 1.0),
        vec4( -0.981, 0.96, -0.25, 1.0),
        vec4( -0.981, 0.57, -0.25, 1.0)
    )
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    var body = document.getElementById( "body" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    board();
    roomInteriors();
    roomExteriors();
    ceilings();
    // paintings();
    // frames();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    //
    // Initialize a texture
    //

    boardTexture = configureTexture(document.getElementById("board"));
    limeTexture = configureTexture(document.getElementById("lime"));
    beigeTexture = configureTexture(document.getElementById("beige"));
    wallpaper1Texture = configureTexture(document.getElementById("wallpaper1"));
    wallpaper2Texture = configureTexture(document.getElementById("wallpaper2"));
    ceilingTexture = configureTexture(document.getElementById("ceiling"));

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    thetaLoc = gl.getUniformLocation(program, "theta"); 
    
    document.getElementById("ResetCameraButton").onclick = function(){
        eye = vec3(0.0, 0.0, 1.0);
    };
    document.getElementById("ToggleCeilingsButton").onclick = function(){
        showCeilings = !showCeilings;
    };
    document.getElementById("Wallpaper1Button").onclick = function () { chosenWallpaper = 1; };
    document.getElementById("Wallpaper2Button").onclick = function () { chosenWallpaper = 2; };
    document.getElementById("Wallpaper3Button").onclick = function () { chosenWallpaper = 3; };
    document.getElementById("Wallpaper4Button").onclick = function () { chosenWallpaper = 4; };
    document.getElementById("Wallpaper5Button").onclick = function () { chosenWallpaper = 5; };

    body.addEventListener("keydown", function(event) {
        if (event.key === 'a') eye[0] -= 0.05;
        if (event.key === 'd') eye[0] += 0.05;
        if (event.key === 'w') eye[1] += 0.05;
        if (event.key === 's') eye[1] -= 0.05;
    });

    body.addEventListener("wheel", function(event) { // TODO: zoom
        const delta = Math.sign(event.deltaY);
        if (delta === -1) console.log("zoom in");
        else console.log("zoom out");
    });

    render();
 
}

canvas

var render = function(){
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (flag) theta[axis] += 2.0;
    gl.uniform3fv(thetaLoc, flatten(theta));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    textureAndDraw();

    requestAnimFrame(render);
}

function textureAndDraw() {
    gl.bindTexture(gl.TEXTURE_2D, boardTexture);                                // base board, 1 texture
    gl.drawArrays(gl.TRIANGLES, 0, 1 * VERTICES_PER_QUAD);
    
    gl.bindTexture(gl.TEXTURE_2D, limeTexture);                                 // billiard room interior, 4 walls
    gl.drawArrays(gl.TRIANGLES, 1 * VERTICES_PER_QUAD, 4 * VERTICES_PER_QUAD);
    
    gl.bindTexture(gl.TEXTURE_2D, beigeTexture);                                 // kitchen interior, 6 walls
    gl.drawArrays(gl.TRIANGLES, 5 * VERTICES_PER_QUAD, 6 * VERTICES_PER_QUAD);
    
    switch (chosenWallpaper) {
        case 1:
            gl.bindTexture(gl.TEXTURE_2D, wallpaper1Texture);
            break;
    
        case 2:
            gl.bindTexture(gl.TEXTURE_2D, wallpaper2Texture);
            break;
    
    //     case 3:
    //         gl.bindTexture(gl.TEXTURE_2D, wallpaper3Texture);
    //         break;
    
    //     case 4:
    //         gl.bindTexture(gl.TEXTURE_2D, wallpaper4Texture);
    //         break;
            
    //     default:
    //         gl.bindTexture(gl.TEXTURE_2D, wallpaper5Texture);
    //         break;
    }
    gl.drawArrays(gl.TRIANGLES, 11 * VERTICES_PER_QUAD, 10 * VERTICES_PER_QUAD);
    
    
    if (showCeilings) {
        gl.bindTexture(gl.TEXTURE_2D, ceilingTexture);                             // ceilings, 1 billard + 2 kitchen
        gl.drawArrays(gl.TRIANGLES, 21 * VERTICES_PER_QUAD, 3 * VERTICES_PER_QUAD);
    }
    // gl.bindTexture(gl.TEXTURE_2D, getCircleArray(paintingTextures, leftPaintingIndex));
    // gl.drawArrays(gl.TRIANGLES, 3 * VERTICES_PER_QUAD, 1 * VERTICES_PER_QUAD);

    // gl.bindTexture(gl.TEXTURE_2D, getCircleArray(paintingTextures, leftPaintingIndex + 1));
    // gl.drawArrays(gl.TRIANGLES, 4 * VERTICES_PER_QUAD, 1 * VERTICES_PER_QUAD);
        
    // gl.bindTexture(gl.TEXTURE_2D, getCircleArray(paintingTextures, leftPaintingIndex + 2));
    // gl.drawArrays(gl.TRIANGLES, 5 * VERTICES_PER_QUAD, 1 * VERTICES_PER_QUAD);

    
    
}

function getCircleArray(array, i) {
    if (i <= -1) return array[array.length - 1];
    if (i >= array.length) return array[i % array.length];
    else return array[i];
}
