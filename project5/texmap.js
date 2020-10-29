// CS 535 - Computer Graphics
// Project #5
// Nick Martin - jnmartin8@crimson.ua.edu
// This WebGL project demonstrates 3D modelling, viewing, interaction, and texture mapping in WebGL.

// A room is constructed using quadrilaterals drawn using the drawArrays function to construct the walls, floor, paintings, table, and exterior decorating.

// These quadrilaterals are than mapped with textures to give them a more homey feel.

// In order to get a good view of the the room, the camera can be moved between Left, Middle, and Right (default: Middle).

// In the center of the room on the table is a slideshow of the paintings on the wall. One can interact with the slideshow using the Play/Pause, Prev, and Next buttons.
// The slideshow will default to cycling through the images. You can pause the show and then manually cycle through them using Prev and Next.

// Please note: the room is not a perfect square; the left and right walls have been angled out so that one can see them and the paintings when viewing from the front.

var canvas;
var gl;

var numQuadrilaterals = 12;               // one floor, 3 interior walls, 3 exterior walls, 3 paintings, one table, one slideshow
var numVertices  = numQuadrilaterals * 6; // 6 vertices per quadrilateral

var program;


var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var brickTexture;
var tileTexture;
var wallpaperTexture;
var tableTexture;
var painting1Texture;
var painting2Texture;
var painting3Texture;

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
    vec4( 0.5,  0.6,  0.5, 1.0 ),   //2
    vec4( 0.5, -0.6,  0.5, 1.0 ),   //3
    vec4( -0.5, -0.5, -0.5, 1.0 ),  //4
    vec4( -0.5,  0.5, -0.5, 1.0 ),  //5
    vec4( 0.5,  0.6, -0.5, 1.0 ),   //6
    vec4( 0.5, -0.6, -0.5, 1.0 )    //7
];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;
var theta = [45.0, 45.0, 45.0];

var thetaLoc;

var flag = false;
var isPaused = false;
var currentSlideIndex = 0;
var clock = 0;

function configureTexture( image ) {
    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, 
         gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    
    // gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    return texture;
}


function quad(a, b, c, d) { // 6 vertices per quadrilateral
    quadPoints(vertices[a], vertices[b], vertices[c], vertices[d]);
    //  pointsArray.push(vertices[a]); 
    //  colorsArray.push(vec4( 1.0, 1.0, 1.0, 1.0 )); 
    //  texCoordsArray.push(texCoord[0]);

    //  pointsArray.push(vertices[b]); 
    //  colorsArray.push(vec4( 1.0, 1.0, 1.0, 1.0 ));
    //  texCoordsArray.push(texCoord[1]); 

    //  pointsArray.push(vertices[c]); 
    //  colorsArray.push(vec4( 1.0, 1.0, 1.0, 1.0 ));
    //  texCoordsArray.push(texCoord[2]); 
   
    //  pointsArray.push(vertices[a]); 
    //  colorsArray.push(vec4( 1.0, 1.0, 1.0, 1.0 ));
    //  texCoordsArray.push(texCoord[0]); 

    //  pointsArray.push(vertices[c]); 
    //  colorsArray.push(vec4( 1.0, 1.0, 1.0, 1.0 ));
    //  texCoordsArray.push(texCoord[2]); 

    //  pointsArray.push(vertices[d]); 
    //  colorsArray.push(vec4( 1.0, 1.0, 1.0, 1.0 ));
    //  texCoordsArray.push(texCoord[3]);   
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
    quad( 1, 0, 3, 2 ); // floor
    // quad( 2, 3, 7, 6 );  // fourth wall
    quad( 3, 0, 4, 7 ); // left wall
    // quad( 4, 5, 6, 7 );  //ceiling
    quad( 5, 4, 0, 1 ); // back wall
    quad( 6, 5, 1, 2 ); // right wall
}

function exterior() {
    quadPoints(                         // left exterior
        vec4( 0.5, -0.601,  0.5, 1.0 ),  //3
        vec4( -0.5, -0.501,  0.5, 1.0 ), //0
        vec4( -0.5, -0.501, -0.5, 1.0 ), //4
        vec4( 0.5, -0.601, -0.5, 1.0 )   //7
    );
    quadPoints(                         // back exterior
        vec4( -0.501,  0.5, -0.5, 1.0 ), //5
        vec4( -0.501, -0.5, -0.5, 1.0 ), //4
        vec4( -0.501, -0.5,  0.5, 1.0 ), //0
        vec4( -0.501,  0.5,  0.5, 1.0 )  //1
    );
    quadPoints(                         // right exterior
        vec4( 0.5,  0.601, -0.5, 1.0 ),  //6
        vec4( -0.5,  0.501, -0.5, 1.0 ), //5
        vec4( -0.5,  0.501,  0.5, 1.0 ), //1
        vec4( 0.5,  0.601,  0.5, 1.0 )   //2
    );
}

function paintings() {
    quadPoints(                             // left
        vec4( 0.25, -0.55, -0.25, 1.0 ),    //3
        vec4( -0.25, -0.5,  -0.25, 1.0 ),   //0
        vec4( -0.25, -0.5, 0.25, 1.0 ),   //4
        vec4( 0.25, -0.55, 0.25, 1.0 )     //7
    );

    quadPoints(                             // back 
        vec4( -0.499,  0.25, -0.25, 1.0 ),   //5
        vec4( -0.499, -0.25, -0.25, 1.0 ),   //4
        vec4( -0.499, -0.25,  0.25, 1.0 ),   //0
        vec4( -0.499,  0.25,  0.25, 1.0 )    //1
    );
    quadPoints(                             // right 
        vec4( 0.25,  0.55, -0.25, 1.0 ),    //6
        vec4( -0.25,  0.5, -0.25, 1.0 ),   //5
        vec4( -0.25,  0.5,  0.25, 1.0 ),   //1
        vec4( 0.25,  0.55,  0.25, 1.0 )     //2
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

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    interior();
    exterior();
    paintings();
    table();
    slideshow();

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

    //var image = new Image();
    //image.onload = function() { 
     //   configureTexture( image );
    //}
    //image.src = "SA2011_black.gif"


    // var image = document.getElementById("texImage");
    // configureTexture( image );

    var brickImg = document.getElementById("brick");
    brickTexture=configureTexture(brickImg);
    var tileImg = document.getElementById("tile");
    tileTexture = configureTexture(tileImg);
    var wallpaperImg = document.getElementById("wallpaper");
    wallpaperTexture = configureTexture(wallpaperImg);
    var tableImg = document.getElementById("table");
    tableTexture = configureTexture(tableImg);

    var painting1Img = document.getElementById("img1");
    painting1Texture = configureTexture(painting1Img);
    var painting2Img = document.getElementById("img2");
    painting2Texture = configureTexture(painting2Img);
    var painting3Img = document.getElementById("img3");
    painting3Texture = configureTexture(painting3Img);

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    thetaLoc = gl.getUniformLocation(program, "theta"); 
    
    document.getElementById("LeftButton").onclick = function(){
        eye = vec3(0.0, -0.25, 1.0);
        at =  vec3(0.0, -0.5, 0.5);
    };
    document.getElementById("MiddleButton").onclick = function(){
        eye = vec3(0.25, 0.0, 0.25);
        at = vec3(1, 0.0, 0.0);
    };
    document.getElementById("RightButton").onclick = function(){
        eye = vec3(0.0, 0.25, 1.0);
        at =  vec3(0.0, 0.5, 0.5);
    };
    document.getElementById("PlayPauseButton").onclick = function () { isPaused = !isPaused; };
    document.getElementById("PrevButton").onclick = function () {         
        if (isPaused) currentSlideIndex = currentSlideIndex === 0 ? 2 : (currentSlideIndex - 1) % 3;
    };
    document.getElementById("NextButton").onclick = function () { 
        if (isPaused) currentSlideIndex = (currentSlideIndex + 1) % 3;
    };

    render();
 
}

var render = function(){
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // theta[axis] += 2.0;
    if (flag) theta[axis] += 2.0;
    gl.uniform3fv(thetaLoc, flatten(theta));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    textureAndDraw();

    requestAnimFrame(render);
}

function textureAndDraw() {
    gl.bindTexture(gl.TEXTURE_2D, tileTexture);
    gl.drawArrays(gl.TRIANGLES, 0, 1 * numVertices / numQuadrilaterals);
    
    gl.bindTexture(gl.TEXTURE_2D, wallpaperTexture);
    gl.drawArrays(gl.TRIANGLES, numVertices / numQuadrilaterals, 3 * numVertices / numQuadrilaterals);
    // gl.drawArrays(gl.TRIANGLES, 6,18);
    
    gl.bindTexture(gl.TEXTURE_2D, brickTexture);
    // gl.drawArrays(gl.TRIANGLES, 24,18);
    gl.drawArrays(gl.TRIANGLES, 4 * numVertices / numQuadrilaterals, 3 * numVertices / numQuadrilaterals);
    
    gl.bindTexture(gl.TEXTURE_2D, painting1Texture);
    // gl.drawArrays(gl.TRIANGLES, 24,24);
    gl.drawArrays(gl.TRIANGLES, 7 * numVertices / numQuadrilaterals, 1 * numVertices / numQuadrilaterals);
    
    gl.bindTexture(gl.TEXTURE_2D, painting2Texture);
    // gl.drawArrays(gl.TRIANGLES, 30,30);
    gl.drawArrays(gl.TRIANGLES, 8 * numVertices / numQuadrilaterals, 1 * numVertices / numQuadrilaterals);
    
    gl.bindTexture(gl.TEXTURE_2D, painting3Texture);
    gl.drawArrays(gl.TRIANGLES, 9 * numVertices / numQuadrilaterals, 1 * numVertices / numQuadrilaterals);
    
    gl.bindTexture(gl.TEXTURE_2D, tableTexture);
    gl.drawArrays(gl.TRIANGLES, 10 * numVertices / numQuadrilaterals, 1 * numVertices / numQuadrilaterals);
    
    if (!isPaused) {
        ++clock;
        if (clock > 500) {
            currentSlideIndex = (currentSlideIndex + 1)% 3;
            clock = 0;
        }
    }
    switch (currentSlideIndex) {
        case 0:
            gl.bindTexture(gl.TEXTURE_2D, painting1Texture);
            break;

        case 1:
            gl.bindTexture(gl.TEXTURE_2D, painting2Texture);
            break;
            
        case 2:
            gl.bindTexture(gl.TEXTURE_2D, painting3Texture);
            break;
            
        default:
            gl.bindTexture(gl.TEXTURE_2D, painting1Texture);
            break;
    }

    gl.drawArrays(gl.TRIANGLES, 11 * numVertices / numQuadrilaterals, 1 * numVertices / numQuadrilaterals);

}
