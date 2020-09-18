// CS 535 - Computer Graphics
// Project #1
// Nick Martin - jnmartin8@crimson.ua.edu
// This WebGL project creates Koch Snowflakes. (https://en.wikipedia.org/wiki/Koch_snowflake)

// The number of iterations is assigned to the global variable, iterations.

// The most complex part is function findTop, in which we use vector rotation in order to find 
// the apex of each equilateral triangle, given its two base points as vectors.

// Each iteration only creates the left and right triangles, therefore we must find the bottom
// triangle separately. When we do this, we must also rotate the opposite direction, hence the
// argument invert which we set to true in that case.

var canvas;
var gl;

var points = [];

var iterations = 3;

window.onload = function init() {
    // #region WebGL init
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // #endregion
        

    // #region Data logic

    // Initialize and draw corners of initial triangle.
    
    var vertices = [
        vec2(-0.5, -0.5),
        vec2(0, 0.5),
        vec2(0.5, -0.5)
    ];
    var a = vertices[0], b = vertices[1], c = vertices[2];

    triangle(a, b, c);

    if (iterations !== 0) {
        
        // draws left and right triangles
        divideTriangle(a, b, c, iterations);

        // draws bottom triangle
        acFirstThird = mix(a, c, 1.0 / 3.0);
        acSecondThird = mix(a, c, 2.0 / 3.0);
        acTop = findTop(acFirstThird, acSecondThird, true);
        triangle(acFirstThird, acTop, acSecondThird);
        
        divideTriangle(acFirstThird, acTop, acSecondThird, iterations - 1, true);
    }

    // #endregion

    // #region WebGL config

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate our shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
    //#endregion
};


// #region Helpers
function triangle( a, b, c )
{
    points.push(a, b, c);
}

function divideTriangle(a, b, c, count, invert = false)
{
    if (count === 0) {
        triangle(a, b, c)
    } 
    else {
        // find the triangles on each side

        var abFirstThird = mix(a, b, 1.0 / 3.0);
        var abSecondThird = mix(a, b, 2.0 / 3.0);
        var abTop = findTop(abFirstThird, abSecondThird, invert);
        
        var bcFirstThird = mix(b, c, 1.0 / 3.0);
        var bcSecondThird = mix(b, c, 2.0 / 3.0);
        var bcTop = findTop(bcFirstThird, bcSecondThird, invert);
        
        var acFirstThird = mix(a, c, 1.0 / 3.0);
        var acSecondThird = mix(a, c, 2.0 / 3.0);

        triangle(abFirstThird, abTop, abSecondThird);
        triangle(bcFirstThird, bcTop, bcSecondThird);
        --count;
        
        divideTriangle(abFirstThird, abTop, abSecondThird, count, invert);
        divideTriangle(abSecondThird, b, bcFirstThird, count, invert);
        divideTriangle(bcFirstThird, bcTop, bcSecondThird, count, invert);
        divideTriangle(acFirstThird, a, abFirstThird, count, invert);
        divideTriangle(bcSecondThird, c, acSecondThird, count, invert);
    };
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length);
}


function triangleHeight(sideLength) {
    return Math.sqrt(3) / 2 * sideLength
}

function findTop(u, v, invert = false) {
    var dx = v[0] - u[0];
    var dy = v[1] - u[1];

    var degree = invert ? -60 : 60; 

    var x = (Math.cos(degree * (Math.PI / 180.0)) * dx - Math.sin(degree * (Math.PI / 180.0)) * dy + u[0]);
    var y = (Math.sin(degree * (Math.PI / 180.0)) * dx + Math.cos(degree * (Math.PI / 180.0)) * dy + u[1]);
    

    return vec2(x, y);
}
// #endregion
