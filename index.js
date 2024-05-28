let VERTEX_SHADER = `
    precision mediump float;
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    attribute vec3 a_Normal;
    attribute vec4 a_Color;
    varying vec2 v_UV;
    varying vec3 v_Normal;
    varying vec4 v_Color;
    varying vec4 v_VertPos;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    uniform bool u_lightOn;

    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
        v_Normal = a_Normal;
        v_Color = a_Color;
        v_VertPos = u_ModelMatrix * a_Position;
    }
`;

let FRAGMENT_SHADER = `
    precision mediump float;
    varying vec2 v_UV;
    varying vec3 v_Normal;
    varying vec4 v_Color;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform int u_whichTexture;
    uniform vec3 u_lightPos;
    uniform vec3 u_cameraPos;
    varying vec4 v_VertPos;
    uniform bool u_lightOn;

    void main() {
        if (u_whichTexture == -3) {
            gl_FragColor = vec4((v_Normal + 1.0) / 2.0, 1.0);
        } else if (u_whichTexture == -2) {
            gl_FragColor = u_FragColor;
        } else if (u_whichTexture == -1) {
            gl_FragColor = vec4(v_UV, 1.0, 1.0);
        } else if (u_whichTexture == 0) {
            gl_FragColor = texture2D(u_Sampler0, v_UV);
        } else if (u_whichTexture == 1) {
            gl_FragColor = texture2D(u_Sampler1, v_UV);
        } else {
            gl_FragColor = u_FragColor;
        }

        vec3 lightVector = vec3(v_VertPos) - u_lightPos;
        float r = length(lightVector);

        vec3 L = normalize(lightVector);
        vec3 N = normalize(v_Normal);
        float nDotL = max(dot(N, L), 0.0);

        vec3 R = reflect(L, N);
        vec3 E = normalize(u_cameraPos - vec3(v_VertPos));

        float specular = pow(max(dot(E, R), 0.0), 10.0);
        vec3 diffuse = vec3(gl_FragColor) * nDotL * 0.7;
        vec3 ambient = vec3(gl_FragColor) * 0.3;

        if (u_lightOn) {
            if (u_whichTexture == 0) {
                gl_FragColor = vec4(specular + diffuse + ambient, 1.0);
            } else {
                gl_FragColor = vec4(diffuse + ambient, 1.0);
            }
        } else {
            gl_FragColor = vec4(diffuse + ambient, 1.0);
        }
    }
`;

let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let a_Color;
let u_FragColor;
let u_whichTexture;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_lightOn;
let u_lightPos;

function setUpWebGL() {
    canvas = document.getElementById("webgl");
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log("Failed to get WebGL context.");
        return -1;
    }
    gl.enable(gl.DEPTH_TEST);
}

function vGLSL() {
    if (!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER)) {
        console.log("Failed to load/compile shaders");
        return -1;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    }

    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get the storage location of a_Normal');
        return;
    }

    a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return;
    }

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }

    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0){
        console.log("Failed to get the storage location of u_Sampler0");
        return false;
    }

    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1){
        console.log("Failed to get the storage location of u_Sampler1");
        return false;
    }

    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture){
        console.log("Failed to get the storage location of u_whichTexture");
        return false;
    }

    u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
    if (!u_lightPos) {
        console.log('Failed to get the storage location of u_lightPos');
        return false;
    }

    u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
    if (!u_lightOn) {
        console.log('Failed to get the storage location of u_lightOn');
        return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function initTextures() {
    var image1 = new Image();
    if (!image1) {
        console.log("Failed to create the image1 object");
        return false;
    }
    image1.onload = function () { sendTextureToGLSL(image1, 0); };
    image1.src = 'Pixel Art.jpeg';

    var image2 = new Image();
    if (!image2) {
        console.log("Failed to create the image2 object");
        return false;
    }
    image2.onload = function () { sendTextureToGLSL(image2, 1); };
    image2.src = 'Sky.jpg';

    return true;
}

function sendTextureToGLSL(image, textureUnit) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log("Failed to create the texture object");
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    if (textureUnit === 0) {
        gl.uniform1i(u_Sampler0, 0);
    } else if (textureUnit === 1) {
        gl.uniform1i(u_Sampler1, 1);
    }
    console.log('Finished loadTexture');
}

let g_globalAngle = 0;
let g_lastSegmentAngle = 0;
let g_secondLastSegmentAngle = 0;
let g_animation = false;
let g_normal = false;
let g_lightPos = [0, 1, -2];
let mouseDown = false;
let lastMouseX = null;
let lastMouseY = null;
let camera;
let blockMap = {};

let g_startTime = performance.now();
let g_seconds = 0;

function HTMLactions() {
    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    document.onkeydown = keydown;

    document.getElementById('normalOn').onclick = function () { g_normal = true; }
    document.getElementById('normalOff').onclick = function () { g_normal = false; }

    document.getElementById('lightSlideX').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) {g_lightPos[0] = this.value/100; renderScene();} })
    document.getElementById('lightSlideY').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) {g_lightPos[1] = this.value/100; renderScene();} })
    document.getElementById('lightSlideZ').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) {g_lightPos[2] = this.value/100; renderScene();} })

    document.getElementById('lightOn').onclick = function () { gl.uniform1i(u_lightOn, 1); renderScene();};
    document.getElementById('lightOff').onclick = function () { gl.uniform1i(u_lightOn, 0); renderScene();};
}

function main() {
    console.log("Hai :D!!!");

    setUpWebGL();
    vGLSL();
    HTMLactions();
    initTextures();

    camera = new Camera(canvas);
    camera.eye = new Vector3([2, 2, 2]);
    camera.at = new Vector3([0, 0, 0]);
    camera.updateViewMatrix();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.uniform1i(u_lightOn, 1);
    requestAnimationFrame(tick);
}

var g_previousFrameTime = performance.now();

var g_lightStartTime = performance.now();
var g_lightPeriod = 4.0;
var g_lightAmplitude = 2.0;

function tick() {
    var currentTime = performance.now();
    var deltaTime = currentTime - g_previousFrameTime;
    g_previousFrameTime = currentTime;
    g_seconds = (currentTime - g_startTime) / 1000.0;

    var lightTime = (currentTime - g_lightStartTime) / 1000.0;
    g_lightPos[2] = g_lightAmplitude * Math.sin((2 * Math.PI * lightTime) / g_lightPeriod) - 2.0;

    updateAnimationAngles();
    renderScene();

    var fps = 1000 / deltaTime;
    sendTextToHTML("Seconds: " + (currentTime / 1000).toFixed(2) + " fps: " + fps.toFixed(2), "performanceData");

    requestAnimationFrame(tick);
}

function keydown(ev) {
    switch (ev.keyCode) {
        case 87:
            camera.moveForward(0.1);
            break;
        case 83:
            camera.moveBackward(0.1);
            break;
        case 65:
            camera.moveLeft(0.1);
            break;
        case 68:
            camera.moveRight(0.1);
            break;
        case 81:
            camera.panLeft(5);
            break;
        case 69:
            camera.panRight(5);
            break;
        case 67:
            addBlockAtCamera();
            break;
        case 86:
            removeBlockAtCamera();
            break;
    }
    renderScene();
}

function addBlockAtCamera() {
    const blockKey = `${camera.eye.elements[0]},${camera.eye.elements[1]},${camera.eye.elements[2]}`;
    if (!blockMap[blockKey]) {
        const newBlock = new Cube();
        newBlock.matrix.translate(camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]);
        blockMap[blockKey] = newBlock;
    }
}

function removeBlockAtCamera() {
    const blockKey = `${camera.eye.elements[0]},${camera.eye.elements[1]},${camera.eye.elements[2]}`;
    if (blockMap[blockKey]) {
        delete blockMap[blockKey];
    }
}

function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseUp(event) {
    mouseDown = false;
}

let g_XAngle = 0;
let g_YAngle = 0;

function handleMouseMove(event) {
    if (!mouseDown) {
        return;
    }
    const newX = event.clientX;
    const newY = event.clientY;

    const deltaX = newX - lastMouseX;
    const deltaY = newY - lastMouseY;

    g_YAngle = (g_YAngle - deltaX / 5) % 360;
    g_XAngle = (g_XAngle - deltaY / 5) % 360;

    lastMouseX = newX;
    lastMouseY = newY;

    renderScene();
}

function convertCoord(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    return [x, y];
}

function updateAnimationAngles() {
    if (g_animation) {
        g_secondLastSegmentAngle = 45 * Math.sin(g_seconds);
        g_lastSegmentAngle = 45 * Math.cos(g_seconds);
    }
}

function renderScene() {
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

    var globalRotMat = new Matrix4().rotate(g_YAngle, 0, 1, 0);
    globalRotMat.rotate(g_XAngle, 1, 0, 0);

    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
    gl.uniform3fv(u_lightPos, g_lightPos);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var light = new Cube();
    light.color = [2, 2, 0, 1];
    light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    light.matrix.scale(0.1, 0.1, 0.1);
    light.matrix.translate(-0.5, -0.5, -0.5);
    light.textureNum = -4;
    light.render();

    const segmentLength = 0.1;
    const amplitude = 10;
    const waveLength = 1.5;
    const speed = 1;

    let baseMatrix = new Matrix4();

    let segment1 = new Cube();
    let phase1 = g_seconds * speed;
    let angle1 = amplitude * Math.sin(phase1);
    baseMatrix.translate(segmentLength, 0, 0);
    baseMatrix.rotate(angle1, 0, 0, 1);
    segment1.color = [0.1, 0.8, 0.1, 1.0];
    segment1.matrix = new Matrix4(baseMatrix);
    segment1.matrix.scale(segmentLength, 0.05, 0.05);
    if (g_normal) segment1.textureNum = -3;
    segment1.render();

    let segment2 = new Cube();
    let phase2 = g_seconds * speed + (1 / 8) * waveLength;
    let angle2 = amplitude * Math.sin(phase2);
    baseMatrix.translate(segmentLength, 0, 0);
    baseMatrix.rotate(angle2, 0, 0, 1);
    segment2.color = [0.1, 0.8, 0.1, 1.0];
    segment2.matrix = new Matrix4(baseMatrix);
    segment2.matrix.scale(segmentLength, 0.05, 0.05);
    if (g_normal) segment2.textureNum = -3;
    segment2.render();

    let segment3 = new Cube();
    let phase3 = g_seconds * speed + (2 / 8) * waveLength;
    let angle3 = amplitude * Math.sin(phase3);
    baseMatrix.translate(segmentLength, 0, 0);
    baseMatrix.rotate(angle3, 0, 0, 1);
    segment3.color = [0.1, 0.8, 0.1, 1.0];
    segment3.matrix = new Matrix4(baseMatrix);
    segment3.matrix.scale(segmentLength, 0.05, 0.05);
    if (g_normal) segment3.textureNum = -3;
    segment3.render();

    let segment4 = new Cube();
    let phase4 = g_seconds * speed + (3 / 8) * waveLength;
    let angle4 = amplitude * Math.sin(phase4);
    baseMatrix.translate(segmentLength, 0, 0);
    baseMatrix.rotate(angle4, 0, 0, 1);
    segment4.color = [0.1, 0.8, 0.1, 1.0];
    segment4.matrix = new Matrix4(baseMatrix);
    segment4.matrix.scale(segmentLength, 0.05, 0.05);
    if (g_normal) segment4.textureNum = -3;
    segment4.render();

    let segment5 = new Cube();
    let phase5 = g_seconds * speed + (4 / 8) * waveLength;
    let angle5 = amplitude * Math.sin(phase5);
    baseMatrix.translate(segmentLength, 0, 0);
    baseMatrix.rotate(angle5, 0, 0, 1);
    segment5.color = [0.1, 0.8, 0.1, 1.0];
    segment5.matrix = new Matrix4(baseMatrix);
    segment5.matrix.scale(segmentLength, 0.05, 0.05);
    if (g_normal) segment5.textureNum = -3;
    segment5.render();

    let segment6 = new Cube();
    let phase6 = g_seconds * speed + (5 / 8) * waveLength;
    let angle6 = amplitude * Math.sin(phase6);
    baseMatrix.translate(segmentLength, 0, 0);
    baseMatrix.rotate(angle6, 0, 0, 1);
    segment6.color = [0.1, 0.8, 0.1, 1.0];
    segment6.matrix = new Matrix4(baseMatrix);
    segment6.matrix.scale(segmentLength, 0.05, 0.05);
    if (g_normal) segment6.textureNum = -3;
    segment6.render();

    let segment7 = new Cube();
    let angle7 = g_secondLastSegmentAngle;
    baseMatrix.translate(segmentLength, 0, 0);
    baseMatrix.rotate(angle7, 0, 0, 1);
    segment7.color = [0.1, 0.8, 0.1, 1.0];
    segment7.matrix = new Matrix4(baseMatrix);
    segment7.matrix.scale(segmentLength, 0.05, 0.05);
    if (g_normal) segment7.textureNum = -3;
    segment7.render();

    let segment8 = new Cube();
    let angle8 = g_lastSegmentAngle;
    baseMatrix.translate(segmentLength, 0, 0);
    baseMatrix.rotate(angle8, 0, 0, 1);
    segment8.color = [0.1, 0.8, 0.1, 1.0];
    segment8.matrix = new Matrix4(baseMatrix);
    segment8.matrix.scale(segmentLength, 0.05, 0.05);
    if (g_normal) segment8.textureNum = -3;
    segment8.render();

    var sphere = new Sphere();
    sphere.color = [1.0, 1.0, 1.0, 1.0];
    sphere.matrix = new Matrix4();
    if (g_normal) sphere.textureNum = -3;
    sphere.matrix.scale(0.05, 0.05, 0.05);
    sphere.render();

    var skybox = new Cube();
    skybox.color = [0.1, 0.8, 0.1, 1.0];
    skybox.matrix = new Matrix4(); 
    skybox.matrix.translate(-50.5, -.75, -49.5);
    skybox.matrix.scale(90, 90, 90);
    skybox.textureNum = 1;
    skybox.render();

    for (let key in blockMap) {
        blockMap[key].render();
    }

    var duration = performance.now() - g_startTime;
    sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(1000 / duration), "performanceData");
}

function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}
