// Escena simple en Babylon.js
// Utilidad: crea una extremidad con un pivote para animación tipo bisagra
function createLimb(scene, name, length, radius, pivotPosition, material) {
  const pivot = new BABYLON.TransformNode(`${name}Pivot`, scene);
  pivot.position = pivotPosition.clone();

  const limb = BABYLON.MeshBuilder.CreateCylinder(name, { height: length, diameter: radius * 2 }, scene);
  limb.parent = pivot;
  limb.position.y = -length / 2; // el pivote actúa como la "articulación" superior
  limb.material = material;
  return { pivot, limb };
}

// Figura con varias mallas (un robot sencillo) que se mueve
function createRobot(scene) {
  const root = new BABYLON.TransformNode('robotRoot', scene);

  const bodyMat = new BABYLON.StandardMaterial('bodyMat', scene);
  bodyMat.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.6);

  const accentMat = new BABYLON.StandardMaterial('accentMat', scene);
  accentMat.diffuseColor = new BABYLON.Color3(0.9, 0.5, 0.2);

  // Torso
  const torso = BABYLON.MeshBuilder.CreateBox('torso', { width: 0.8, height: 1.2, depth: 0.4 }, scene);
  torso.position.y = 1.3;
  torso.material = bodyMat;
  torso.parent = root;

  // Cabeza
  const head = BABYLON.MeshBuilder.CreateSphere('head', { diameter: 0.5, segments: 16 }, scene);
  head.position.y = torso.position.y + 0.9;
  head.material = accentMat;
  head.parent = root;

  // Brazos (con pivote en el hombro)
  const armL = createLimb(scene, 'armL', 0.9, 0.09, new BABYLON.Vector3(-0.5, 1.7, 0), bodyMat);
  const armR = createLimb(scene, 'armR', 0.9, 0.09, new BABYLON.Vector3(0.5, 1.7, 0), bodyMat);
  armL.pivot.parent = root;
  armR.pivot.parent = root;

  // Piernas (con pivote en la cadera)
  const legL = createLimb(scene, 'legL', 1.1, 0.1, new BABYLON.Vector3(-0.22, 1.0, 0), bodyMat);
  const legR = createLimb(scene, 'legR', 1.1, 0.1, new BABYLON.Vector3(0.22, 1.0, 0), bodyMat);
  legL.pivot.parent = root;
  legR.pivot.parent = root;

  // Pequeño "visor" en la cabeza
  const visor = BABYLON.MeshBuilder.CreateBox('visor', { width: 0.3, height: 0.12, depth: 0.06 }, scene);
  visor.parent = head;
  visor.position.z = -0.25;
  visor.material = new BABYLON.StandardMaterial('visorMat', scene);
  visor.material.emissiveColor = new BABYLON.Color3(0.1, 0.6, 1.0);

  return { root, armL, armR, legL, legR };
}
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

function createScene() {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.07, 0.07, 0.08, 1);

  // Cámara orbital
  const camera = new BABYLON.ArcRotateCamera('camera', Math.PI / 3, Math.PI / 3, 8, new BABYLON.Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 2;
  camera.upperRadiusLimit = 40;

  // Luz
  const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 0.9;

  // Suelo "pasto gris" (procedimental simple)
  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 200, height: 200 }, scene);
  const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
  groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
  const grassTex = new BABYLON.DynamicTexture('grayGrass', { width: 512, height: 512 }, scene, false);
  const ctx = grassTex.getContext();
  ctx.fillStyle = '#8a8d90';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3500; i++) {
    ctx.fillStyle = i % 2 ? '#7f8286' : '#9a9da1';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
  }
  grassTex.update();
  groundMat.diffuseTexture = grassTex;
  groundMat.diffuseTexture.uScale = 16;
  groundMat.diffuseTexture.vScale = 16;
  ground.material = groundMat;

  // Robot multi-malla
  const robot = createRobot(scene);
  robot.root.position.y = 0.1; // pies sobre el suelo
  // Hacer que la cámara siga al personaje
  camera.lockedTarget = robot.root;

  // Estructura simple: arco cerca del personaje
  const structureMat = new BABYLON.StandardMaterial('structureMat', scene);
  structureMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.75);
  structureMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.12);

  const archCenter = robot.root.position.add(new BABYLON.Vector3(0, 0, 2)); // frente al robot
  const colL = BABYLON.MeshBuilder.CreateCylinder('archColL', { height: 1.6, diameter: 0.16 }, scene);
  colL.position = new BABYLON.Vector3(archCenter.x - 0.6, 0.8, archCenter.z);
  colL.material = structureMat;

  const colR = BABYLON.MeshBuilder.CreateCylinder('archColR', { height: 1.6, diameter: 0.16 }, scene);
  colR.position = new BABYLON.Vector3(archCenter.x + 0.6, 0.8, archCenter.z);
  colR.material = structureMat;

  const beam = BABYLON.MeshBuilder.CreateBox('archBeam', { width: 1.4, height: 0.18, depth: 0.22 }, scene);
  beam.position = new BABYLON.Vector3(archCenter.x, 1.6, archCenter.z);
  beam.material = structureMat;

  // INPUT: WASD
  const inputMap = {};
  scene.onKeyboardObservable.add((kbInfo) => {
    switch (kbInfo.type) {
      case BABYLON.KeyboardEventTypes.KEYDOWN:
        inputMap[kbInfo.event.key.toLowerCase()] = true;
        break;
      case BABYLON.KeyboardEventTypes.KEYUP:
        inputMap[kbInfo.event.key.toLowerCase()] = false;
        break;
    }
  });

  // Parámetros de movimiento y animación
  const moveSpeed = 2.8;   // unidades/seg
  const rotSpeed = 2.8;    // rad/seg
  let walkT = 0;           // fase de caminata

  // Animación y control (reemplaza la animación anterior)
  scene.onBeforeRenderObservable.add(() => {
    const dt = engine.getDeltaTime() / 1000;

    // Lectura WASD
    const forward = (inputMap['w'] ? 1 : 0) + (inputMap['s'] ? -1 : 0); // W avanza, S retrocede
    const turn = (inputMap['d'] ? 1 : 0) + (inputMap['a'] ? -1 : 0);    // D gira derecha, A gira izquierda

    // Rotación del personaje
    if (turn !== 0) {
      robot.root.rotation.y += rotSpeed * turn * dt;
    }

    // Avance/retroceso
    if (forward !== 0) {
      const dir = robot.root.getDirection(BABYLON.Axis.Z);
      robot.root.position.addInPlace(dir.scale(moveSpeed * forward * dt));
      walkT += dt; // avanzar fase de caminata cuando hay movimiento
    }

    // Animación de caminar (balanceo de brazos y piernas)
    const moving = forward !== 0;
    const swing = Math.sin(walkT * 6.0) * (moving ? 1 : 0);

    // Brazos
    robot.armL.pivot.rotation.x = moving ? 0.6 * swing : robot.armL.pivot.rotation.x * 0.85;
    robot.armR.pivot.rotation.x = moving ? -0.6 * swing : robot.armR.pivot.rotation.x * 0.85;
    // Piernas
    robot.legL.pivot.rotation.x = moving ? -0.6 * swing : robot.legL.pivot.rotation.x * 0.85;
    robot.legR.pivot.rotation.x = moving ? 0.6 * swing : robot.legR.pivot.rotation.x * 0.85;
  });

  // GUI minimapa/label
  const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
  const rect = new BABYLON.GUI.Rectangle();
  rect.width = '160px';
  rect.height = '40px';
  rect.cornerRadius = 8;
  rect.color = '#8ab4f8';
  rect.thickness = 1.5;
  rect.background = 'rgba(20,20,24,0.6)';
  rect.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
  rect.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
  rect.top = '-16px';
  rect.left = '-16px';
  advancedTexture.addControl(rect);

  const label = new BABYLON.GUI.TextBlock();
  label.text = 'Babylon.js Demo';
  label.color = '#e8eaed';
  label.fontSize = 14;
  rect.addControl(label);

  return scene;
}

const scene = createScene();

engine.runRenderLoop(() => {
  if (scene && scene.activeCamera) {
    scene.render();
  }
});

window.addEventListener('resize', () => {
  engine.resize();
});
