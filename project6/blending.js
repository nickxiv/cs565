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

var numQuadrilaterals = 9;               // 3 interior walls, 3 paintings, 3 frames
var numVertices  = numQuadrilaterals * 6; // 6 vertices per quadrilateral

var program;


var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var brickTexture;
var tileTexture;
var wallpaperTexture;
var tableTexture;
var pres1Texture;
var pres2Texture;
var pres3Texture;

var modelViewMatrix, modelViewMatrixLoc;
var projectionMatrix, projectionMatrixLoc;

var eye = vec3(0.25, 0.0, 0.25);
var at = vec3(1, 0.0, 0.0);

var up =  vec3(1.0, 0.0, 0.0);

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
var isPaused = false;
var chosenFrame = 1;
var leftPaintingIndex = 0;
var paintingTextures = [];
var clock = 0;

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


function quad(a, b, c, d) { // 6 vertices per quadrilateral
    quadPoints(vertices[a], vertices[b], vertices[c], vertices[d]);
}

function quadPoints(a, b, c, d) {
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


function interior()
{
    quad( 3, 0, 4, 7 ); // left wall
    quad( 5, 4, 0, 1 ); // back wall
    quad( 6, 5, 1, 2 ); // right wall
}

function paintings() {
    quadPoints(                             // left
        vec4( 0.25, -0.825, -0.25, 1.0 ),    //3
        vec4( -0.25, -0.5,  -0.25, 1.0 ),   //0
        vec4( -0.25, -0.5, 0.25, 1.0 ),   //4
        vec4( 0.25, -0.825, 0.25, 1.0 )     //7
    );

    quadPoints(                             // back painting
        vec4( -0.499,  0.25, -0.25, 1.0 ),   //5
        vec4( -0.499, -0.25, -0.25, 1.0 ),   //4
        vec4( -0.499, -0.25,  0.25, 1.0 ),   //0
        vec4( -0.499,  0.25,  0.25, 1.0 )    //1
    );
    quadPoints(                             // right 
        vec4( 0.25,  0.825, -0.25, 1.0 ),    //6
        vec4( -0.25,  0.5, -0.25, 1.0 ),   //5
        vec4( -0.25,  0.5,  0.25, 1.0 ),   //1
        vec4( 0.25,  0.825,  0.25, 1.0 )     //2
    );
}

function frames() {
    quadPoints(                             // left
        vec4( 0.25, -0.824, -0.25, 1.0 ),    //3
        vec4( -0.25, -0.5,  -0.25, 1.0 ),   //0
        vec4( -0.25, -0.5, 0.25, 1.0 ),   //4
        vec4( 0.25, -0.824, 0.25, 1.0 )     //7
    );

    quadPoints(                             // back painting
        vec4( -0.498,  0.251, -0.251, 1.0 ),   //5
        vec4( -0.498, -0.251, -0.251, 1.0 ),   //4
        vec4( -0.498, -0.251,  0.251, 1.0 ),   //0
        vec4( -0.498,  0.251,  0.251, 1.0 )    //1
    );
    quadPoints(                             // right 
        vec4( 0.25,  0.824, -0.25, 1.0 ),    //6
        vec4( -0.25,  0.5, -0.25, 1.0 ),   //5
        vec4( -0.25,  0.5,  0.25, 1.0 ),   //1
        vec4( 0.25,  0.824,  0.25, 1.0 )     //2
    );
}


function table() {                      //translation and scalar of floor
    quadPoints(    
        vec4( -0.3,  0.3,  0.4, 1.0 ),
        vec4( -0.3, -0.3,  0.4, 1.0 ),
        vec4( 0.3, -0.3,  0.4, 1.0 ),
        vec4( 0.3,  0.3,  0.4, 1.0 ),
    );
}

function slideshow() {                  //scalar of table
    quadPoints(    
        vec4( -0.2,  0.2,  0.39, 1.0 ),
        vec4( -0.2, -0.2,  0.39, 1.0 ),
        vec4( 0.2, -0.2,  0.39, 1.0 ),
        vec4( 0.2,  0.2,  0.39, 1.0 ),
    );
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
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
    
    interior();
    paintings();
    frames();

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

    wallpaperTexture = configureTexture(document.getElementById("wallpaper"));

    frame1Texture = configureTexture(document.getElementById("frame1"));
    frame2Texture = configureTexture(document.getElementById("frame2"));
    frame3Texture = configureTexture(document.getElementById("frame3"));
    frame4Texture = configureTexture(document.getElementById("frame4"));
    frame5Texture = configureTexture(document.getElementById("frame5"));

    pres1Texture = configureTexture(document.getElementById("pres1"));
    pres2Texture = configureTexture(document.getElementById("pres2"));
    pres3Texture = configureTexture(document.getElementById("pres3"));
    pres4Texture = configureTexture(document.getElementById("pres4"));
    pres5Texture = configureTexture(document.getElementById("pres5"));
    pres6Texture = configureTexture(document.getElementById("pres6"));
    pres7Texture = configureTexture(document.getElementById("pres7"));
    pres8Texture = configureTexture(document.getElementById("pres8"));
    pres9Texture = configureTexture(document.getElementById("pres9"));
    pres10Texture = configureTexture(document.getElementById("pres10"));

    paintingTextures = [pres1Texture, pres2Texture, pres3Texture, pres4Texture, pres5Texture, pres6Texture, pres7Texture, pres8Texture, pres9Texture, pres10Texture];

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    thetaLoc = gl.getUniformLocation(program, "theta"); 
    
    document.getElementById("ShiftLeftButton").onclick = function(){
        leftPaintingIndex = (leftPaintingIndex + 1) % 10;
    };
    document.getElementById("ShiftRightButton").onclick = function(){
        leftPaintingIndex--;
        if (leftPaintingIndex < 0) leftPaintingIndex = 9;
    };
    document.getElementById("Frame1Button").onclick = function () { chosenFrame = 1; };
    document.getElementById("Frame2Button").onclick = function () { chosenFrame = 2; };
    document.getElementById("Frame3Button").onclick = function () { chosenFrame = 3; };
    document.getElementById("Frame4Button").onclick = function () { chosenFrame = 4; };
    document.getElementById("Frame5Button").onclick = function () { chosenFrame = 5; };

    render();
 
}

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
    gl.bindTexture(gl.TEXTURE_2D, wallpaperTexture);
    gl.drawArrays(gl.TRIANGLES, 0, 3 * numVertices / numQuadrilaterals);
        
    gl.bindTexture(gl.TEXTURE_2D, getCircleArray(paintingTextures, leftPaintingIndex));
    gl.drawArrays(gl.TRIANGLES, 3 * numVertices / numQuadrilaterals, 1 * numVertices / numQuadrilaterals);

    gl.bindTexture(gl.TEXTURE_2D, getCircleArray(paintingTextures, leftPaintingIndex + 1));
    gl.drawArrays(gl.TRIANGLES, 4 * numVertices / numQuadrilaterals, 1 * numVertices / numQuadrilaterals);
        
    gl.bindTexture(gl.TEXTURE_2D, getCircleArray(paintingTextures, leftPaintingIndex + 2));
    gl.drawArrays(gl.TRIANGLES, 5 * numVertices / numQuadrilaterals, 1 * numVertices / numQuadrilaterals);

    
    switch (chosenFrame) {
        case 1:
            gl.bindTexture(gl.TEXTURE_2D, frame1Texture);
            break;
    
        case 2:
            gl.bindTexture(gl.TEXTURE_2D, frame2Texture);
            break;
    
        case 3:
            gl.bindTexture(gl.TEXTURE_2D, frame3Texture);
            break;
    
        case 4:
            gl.bindTexture(gl.TEXTURE_2D, frame4Texture);
            break;
            
        default:
            gl.bindTexture(gl.TEXTURE_2D, frame5Texture);
            break;
    }
    gl.drawArrays(gl.TRIANGLES, 6 * numVertices / numQuadrilaterals, 3 * numVertices / numQuadrilaterals);
    
}

function getCircleArray(array, i) {
    if (i <= -1) return array[array.length - 1];
    if (i >= array.length) return array[i % array.length];
    else return array[i];
}
