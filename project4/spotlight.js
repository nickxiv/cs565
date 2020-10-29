// CS 535 - Computer Graphics
// Project #4
// Nick Martin - jnmartin8@crimson.ua.edu
// This WebGL project demonstrates 3D modelling, viewing, and lighting in WebGL

// A room is constructed using quadrilaterals drawn using the drawArrays function to make the walls and floor.

// Lighting is used to light up the room. The source of the light can be moved by clicking 1-5. The default is 1.

// In order to get a good view of the lighting, the camera can be moved by clicking A-F. The default is A.

// The lighting exhibits spot lighting in WebGL, and the cutoff angle can be increased and decreased by clicking the corresponding buttons.


var canvas;
var gl;
var program;

var numTimesToSubdivide = 3;
 
var index = 0;

var pointsArray = [];
var normalsArray = [];


var near = -10;
var far = 10;
var left = -2.0;
var right = 2.0;
var ytop = 2.0;
var bottom = -2.0;
    
var lightPosition = vec4(-1.5, -0.5, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 20.0;
var cutoff = 0.5;

var ctm;
var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eyeLoc;

var eye = vec3(-1.5, 1, 1);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 0.0, 1.0);
    
function triangle(a, b, c) {

     // normals are vectors
     
     normalsArray.push(a[0],a[1], a[2], 0.0);
     normalsArray.push(b[0],b[1], b[2], 0.0);
     normalsArray.push(c[0],c[1], c[2], 0.0);
     
     
     pointsArray.push(a);
     pointsArray.push(b);      
     pointsArray.push(c);
     
     index += 3;
    }
    
function rectangle(a, b, c, d) {
        triangle(a, b, d);
        triangle(b, c, d);
}

function constructRoom() {
    constructFloor();
    constructWalls();
}

function constructFloor() {
    rectangle(
        vec4(-1.5, -1, 0, 1), 
        vec4(-1.5, 1, 0, 1), 
        vec4(-0.5, 1, 0, 1), 
        vec4(-0.5, -1, 0, 1));
    
    rectangle(
        vec4(-0.5, 0, 0, 1),  
        vec4(-0.5, 1, 0, 1), 
        vec4(0.5, 1, 0, 1), 
        vec4(0.5, 0, 0, 1));
    
    rectangle(
        vec4(0.5, -1, 0, 1), 
        vec4(0.5, 1, 0, 1), 
        vec4(1.5, 1, 0, 1), 
        vec4(1.5, -1, 0, 1));
}

function constructWalls() {
    buildWall(-1.5, -1, -1.5, 1);
    buildWall(-1.5, 1, 1.5, 1);
    buildWall(1.5, 1, 1.5, -1);
    buildWall(1.5, -1, 0.5, -1);
    buildWall(0.5, -1, 0.5, 0);
    buildWall(0.5, 0, -0.5, 0);
    buildWall(-0.5, 0, -0.5, -1);
    buildWall(-0.5, -1, -1.5, -1);    
}

function buildWall(x1, y1, x2, y2) {
    rectangle(
        vec4(x1, y1, 0, 1),
        vec4(x1, y1, 1, 1),
        vec4(x2, y2, 1, 1),
        vec4(x2, y2, 0, 1));

}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 0.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );    
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    constructRoom();
    
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    lightPositionLoc = gl.getUniformLocation(program, "lightPosition")

    document.getElementById("ButtonA").onclick = function(){
        eye = vec3(-1.5, 1, 1);
        init();
    };
    document.getElementById("ButtonB").onclick = function(){
        eye = vec3(0, 1, 1);
        init();
    };

    document.getElementById("ButtonC").onclick = function(){
        eye = vec3(1.5, 1, 1);
        init();
    };

    document.getElementById("ButtonD").onclick = function(){
        eye = vec3(-1.5, -1, 1);
        init();
    };

    document.getElementById("ButtonE").onclick = function(){
        eye = vec3(0, -1, 1);
        init();
    };

    document.getElementById("ButtonF").onclick = function(){
        eye = vec3(1.5, -1, 1);
        init();
    };

    document.getElementById("Button1").onclick = function(){
        lightPosition = vec4(-0.75, -0.25, 0.25, 0);
        init();
    };

    document.getElementById("Button2").onclick = function(){
        lightPosition = vec4(-0.75, 0.25, 0.25, 0);
        init();
    };

    document.getElementById("Button3").onclick = function(){
        lightPosition = vec4(0, 0.5, 0.25, 0);
        init();
    };

    document.getElementById("Button4").onclick = function(){
        lightPosition = vec4(1.5, 0.5, 1, 0);
        init();
    };

    document.getElementById("Button5").onclick = function(){
        lightPosition = vec4(1.5, -0.5, 1, 0);
        init();
    };
    document.getElementById("DecreaseCutoff").onclick = function(){
        if (cutoff >= 0.0) cutoff -= 0.05;
        console.log(cutoff);
        init();
    };
    document.getElementById("IncreaseCutoff").onclick = function(){
        if (cutoff <= 1.0) cutoff += 0.05;
        console.log(cutoff);
        init();
    };

    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );
    gl.uniform1f( gl.getUniformLocation(program, 
       "cutoff"),cutoff );

    render();
}

function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
    gl.uniform3fv(gl.getUniformLocation(program, "eyePosition"), flatten(eye));
       

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    gl.uniform4fv(lightPositionLoc,flatten(lightPosition) ); 
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );

    for( var i=0; i<index; i+=3) gl.drawArrays( gl.TRIANGLES, i, 3 );

    window.requestAnimFrame(render);
}
