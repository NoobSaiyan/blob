// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");
const glslify = require('glslify');

const settings = {
  dimensions:[1024,1024],
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
  attributes: { antialias: true }
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  // WebGL background color
  renderer.setClearColor("white", 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  const vertexShader = glslify(`
  varying vec2 vUv;
  uniform float time;
  #pragma glslify: noise = require('glsl-noise/simplex/4d');

  void main () {
    vUv = uv;
    vec3 transformed = position.xyz;
    float offset = 0.0;
    offset += 0.5 * noise(vec4(position.xyz * 0.5, time * 0.25));
    offset += 0.25 * noise(vec4(position.xyz * 1.5, time * 0.25));
    transformed += normal * offset;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`);

const fragmentShader = glslify(`
  varying vec2 vUv;
  uniform float time;
  #pragma glslify: hsl2rgb = require('glsl-hsl2rgb');
  void main () {
    float hue = mix(0.2, 0.5, sin(vUv.x * 3.14));
    vec3 color = hsl2rgb(vec3(hue, 0.5, vUv.y));
    gl_FragColor = vec4(color, 1.0);
  }
`);

  // Setup a geometry
  const geometry = new THREE.SphereGeometry(1, 64, 64);

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.ShaderMaterial({
      flatShading: true,
      // wireframe: true,
      side: THREE.DoubleSide,
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 }
      }
    })
  );
  scene.add(mesh);
  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ time }) {
      mesh.rotation.y = time/2;
      mesh.material.uniforms.time.value = time;
      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
