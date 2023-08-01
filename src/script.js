import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import * as dat from 'lil-gui'

THREE.ColorManagement.enabled = false

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

const audioControl = {
    play: function () {
        sound.play();
    },
    stop: function () {
        sound.stop();
    }
};

gui.add(audioControl, 'play').name('Play Audio');
gui.add(audioControl, 'stop').name('Stop Audio');





// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Models
 */
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null

gltfLoader.load(
    '/models/GameBoy.gltf',
    (gltf) => {
        // Once the model is loaded, add it to the scene
        const model = gltf.scene;
        scene.add(model);

        // Hide the loading screen with a slow transition fade
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0'; // Set opacity to 0 for fade-out effect
        setTimeout(() => {
            loadingScreen.style.display = 'none'; // Hide the loading screen after the fade-out is complete
        }, 2000); // Adjust the time (in milliseconds) to match the transition duration
    },
    undefined,
    (error) => {
        console.error('Error loading the 3D model:', error);
    }
);




/** Weather */


// Fog
const fog = new THREE.Fog('#262837', 1, 15)
scene.fog = fog




/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0x555555)

scene.add(ambientLight)

const moonLight = new THREE.DirectionalLight('#b9d5ff', 0.12)
moonLight.castShadow = true
moonLight.shadow.mapSize.width = 256
moonLight.shadow.mapSize.height = 256
moonLight.shadow.camera.far = 15
moonLight.position.set(4, 5, - 2)

gui.add(moonLight, 'intensity').min(0).max(10).step(0.001)
gui.add(moonLight.position, 'x').min(- 5).max(5).step(0.001)
gui.add(moonLight.position, 'y').min(- 5).max(5).step(0.001)
gui.add(moonLight.position, 'z').min(- 5).max(5).step(0.001)
scene.add(moonLight)



/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(-2, 2, -5)

scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 1, 0)
controls.enableDamping = true

// Limit vertical rotation angle (avoid looking below the 3D model)
const minPolarAngle = Math.PI / 4; // Minimum vertical angle in radians (45 degrees)
const maxPolarAngle = Math.PI / 2.5; // Maximum vertical angle in radians (70 degrees)
controls.minPolarAngle = minPolarAngle;
controls.maxPolarAngle = maxPolarAngle;

/**
 * Audio
 */

// create an AudioListener and add it to the camera
const listener = new THREE.AudioListener();
camera.add(listener);

// create a global audio source
const sound = new THREE.Audio(listener);

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load('audio/zeldaMusic.mp3', function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
    sound.play(true);
});





/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.outputColorSpace = THREE.LinearSRGBColorSpace
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setClearColor('#26333e')
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))



// Firefly particle system
const fireflyCount = 30;
const fireflyGeometry = new THREE.BufferGeometry();
const fireflyPositions = new Float32Array(fireflyCount * 3);
const fireflySpeeds = new Float32Array(fireflyCount);
const fireflyColors = new Array(fireflyCount);

for (let i = 0; i < fireflyCount; i++) {
    fireflyPositions[i * 3 + 0] = (Math.random() - 0.5) * 10; // X position
    fireflyPositions[i * 3 + 1] = (Math.random() - 0.5) * 5; // Y position
    fireflyPositions[i * 3 + 2] = (Math.random() - 0.5) * 5; // Z position
    fireflySpeeds[i] = 0.01 + Math.random() * 0.04; // Speed of the firefly 
    fireflyColors[i] = new THREE.Color(Math.random(), Math.random(), Math.random()); // Random color for each firefly
}


fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
fireflyGeometry.setAttribute('speed', new THREE.BufferAttribute(fireflySpeeds, 1));

const fireflyMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      attribute float speed;
      varying vec3 vColor;
  
      void main() {
        vColor = color;
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 4.0;
        gl_Position = projectionMatrix * modelViewPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
  
      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `,
    transparent: false,
    vertexColors: true,
});
const fireflyParticleSystem = new THREE.Points(fireflyGeometry, fireflyMaterial);
scene.add(fireflyParticleSystem);


// FireFly Light effect
const light = new THREE.PointLight(0xffffff, 1.0); // White light with full intensity
scene.add(light);


// function updateLightIntensity() {
//     const time = Date.now() * 0.001; // Convert milliseconds to seconds
//     const intensity = 0.5 + 0.5 * Math.sin(time * 2.0); // Adjust the frequency here
//     light.intensity = intensity;
// }

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () => {
    const elapsedTime = clock.getElapsedTime()



    if (mixer) {
        mixer.update(elapsedTime)
    }


    // Move the fireflies around smoothly
    const positions = fireflyGeometry.attributes.position.array;
    const speeds = fireflyGeometry.attributes.speed.array;
    for (let i = 0; i < fireflyCount; i++) {
        const x = positions[i * 3 + 0];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];

        // Calculate the new position using lerp
        positions[i * 3 + 0] = THREE.MathUtils.lerp(x, x + speeds[i] * (Math.random() - 0.5), 0.1);
        positions[i * 3 + 1] = THREE.MathUtils.lerp(y, y + speeds[i] * (Math.random() - 0.5), 0.1);
        positions[i * 3 + 2] = THREE.MathUtils.lerp(z, z + speeds[i] * (Math.random() - 0.5), 0.1);

        // Wrap around the scene if they go out of bounds
        positions[i * 3 + 0] = (positions[i * 3 + 0] + 5) % 10 - 5;
        positions[i * 3 + 1] = (positions[i * 3 + 1] + 5) % 10 - 5;
        positions[i * 3 + 2] = (positions[i * 3 + 2] + 5) % 10 - 5;
    }

    fireflyGeometry.attributes.position.needsUpdate = true;


    // Update the light positions to match the fireflies' positions
    light.position.set(camera.position.x, camera.position.y, camera.position.z);

    // // Update light intensity
    // updateLightIntensity();





    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()





