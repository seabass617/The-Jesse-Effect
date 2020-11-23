import * as THREE from '../node_modules/three/build/three.module.js';

// import {FBXLoader} from './node_modules/three/examples/jsm/loaders/FBXLoader.js'
import {GLTFLoader} from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js'


(function() {
  // Set our main variables
  let scene,  
    renderer,
    camera,
    mixer,
    idle,
    twerk,                   // Animations found in our file                            
  // THREE.js animations mixer                            // Idle, the default state our character returns to
    clock = new THREE.Clock(),
    raycaster = new THREE.Raycaster(),
    currentlyAnimating = false,         // Used for anims, which run to a clock instead of frame rate
 // Used to detect the click on our character
    loaderAnim = document.getElementById('js-loader');
  
    init(); 
    
    // initializing function
    function init() {

      // Import the model
      const MODEL_PATH = '../models/Twerk Test 4.gltf';

      // Select the canvas & set the background color
      const canvas = document.querySelector('#c');
      const backgroundColor = 0xFF2F0A;

      // Init the scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(backgroundColor);
      scene.fog = new THREE.Fog(backgroundColor, 60, 100);

      // Init the renderer
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); // associate to canvas, and take away the jaggys
      renderer.shadowMap.enabled = true; // allow for shadows
      renderer.setPixelRatio(window.devicePixelRatio); // render correctly on mobile
      document.body.appendChild(renderer.domElement); // add the renderer to the DOM

      // Add a camera
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000); //Review params
      camera.position.z = 30 
      camera.position.x = 0;
      camera.position.y = -3;



      const loader = new GLTFLoader();

      loader.load( MODEL_PATH, function ( gltf ) {
        let xbot = gltf.scene;

        let animations = gltf.animations;

        xbot.traverse(o => {
          if (o.isMesh) {
            //add shadows
            o.castShadow = true;
            o.receiveShadow = true;
            //o.material = stacy_mtl;
          }
        });
        
        // Set scale
        xbot.scale.set(7, 7, 7);

        // Move Down
        xbot.position.y = -11;

        // Add to scene
        scene.add(xbot);

        //Remove Loader
        loaderAnim.remove();

        // Add a new mixer
        mixer = new THREE.AnimationMixer(xbot);

        // Find the animations
        let twerkAnim = THREE.AnimationClip.findByName(animations, 'Twerk');
        let idleAnim = THREE.AnimationClip.findByName(animations, 'Idle');

        // Add clipaction to mixer to create the clip
        idle = mixer.clipAction(idleAnim);
        twerk = mixer.clipAction(twerkAnim);

        // Play the idle clip
        idle.play();
        }, 
          undefined, function ( error ) {
            console.error( error );
          } 
      );

      // Add lights -> Experiment here
      let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
      hemiLight.position.set(0, 50, 0);
      // Add hemisphere light to scene
      scene.add(hemiLight);

      let d = 8.25;
      let dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
      dirLight.position.set(-8, 12, 8);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
      dirLight.shadow.camera.near = 0.1;
      dirLight.shadow.camera.far = 1500;
      dirLight.shadow.camera.left = d * -1;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = d * -1;
      // Add directional Light to scene
      scene.add(dirLight);


      // Floor
      let floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
      let floorMaterial = new THREE.MeshPhongMaterial({
        color: 0xF52500, // Play around here to see what happens
        shininess: 0,
      });

      let floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -0.5 * Math.PI; // This is 90 degrees by the way
      floor.receiveShadow = true;
      floor.position.y = -11;
      // Add the floor to the scene
      scene.add(floor);

      // Add Sphere to the background
      let geometry = new THREE.SphereGeometry(8, 32, 32);
      let material = new THREE.MeshBasicMaterial({ color: 0xEFCA08}); // 0xf2ce2e 
      let sphere = new THREE.Mesh(geometry, material);
      sphere.position.z = -15;
      sphere.position.y = -2.5;
      sphere.position.x = -0.00;
      scene.add(sphere);

  
    }

    // Function that will run every frame
    function update() {

      // Run the animation according the the clock rate (if you run to framerate then if the framerate slows, so does the animation)
      if (mixer) {
        mixer.update(clock.getDelta());
      }

      //check for a resize
      if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      }
      renderer.render(scene, camera);
      requestAnimationFrame(update);
    }
    update();

    //Function to Resize the Renderer
    function resizeRendererToDisplaySize(renderer) {
      const canvas = renderer.domElement;
      let width = window.innerWidth;
      let height = window.innerHeight;
      let canvasPixelWidth = canvas.width / window.devicePixelRatio;
      let canvasPixelHeight = canvas.height / window.devicePixelRatio;
    
      const needResize =
        canvasPixelWidth !== width || canvasPixelHeight !== height;
      if (needResize) {
        renderer.setSize(width, height, false);
      }
      return needResize;
    }


    // Add raycasting even listener so that we can detect if someone clicked on our model
    window.addEventListener('click', e => raycast(e));
    window.addEventListener('touchend', e => raycast(e, true));

    function raycast(e, touch = false) {
      let mouse = {};
      if (touch) {
        mouse.x = 2 * (e.changedTouches[0].clientX / window.innerWidth) - 1;
        mouse.y = 1 - 2 * (e.changedTouches[0].clientY / window.innerHeight);
      } else {
        mouse.x = 2 * (e.clientX / window.innerWidth) - 1;
        mouse.y = 1 - 2 * (e.clientY / window.innerHeight);
      }
      // update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
    
      // calculate objects intersecting the picking ray
      let intersects = raycaster.intersectObjects(scene.children, true);
    
      if (intersects[0]) {
        let object = intersects[0].object;
        
        console.log(object);
        console.log(object.type);
      
        if (object.type === 'Mesh') {
        
          if (!currentlyAnimating) {
            currentlyAnimating = true;
            playOnClick();
          }
        }
      }
    }

    // Get a random animation, and play it 
    function playOnClick() {
      playModifierAnimation(idle, 0.25, twerk, 0.25);
    }

    function playModifierAnimation(from, fSpeed, to, tSpeed) {
      to.setLoop(THREE.LoopOnce);
      to.reset();
      to.play();
      from.crossFadeTo(to, fSpeed, true);
      setTimeout(function() {
        from.enabled = true;
        to.crossFadeTo(from, tSpeed, true);
        currentlyAnimating = false;
      }, to._clip.duration * 1000 - ((tSpeed + fSpeed) * 1000));
    }

  })(); // Don't add anything below this line