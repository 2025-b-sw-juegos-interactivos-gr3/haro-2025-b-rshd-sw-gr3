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
  const camera = new BABYLON.ArcRotateCamera('camera', Math.PI / 3, Math.PI / 3, 6, new BABYLON.Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 2;
  camera.upperRadiusLimit = 20;

  // Luz
  const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 0.9;

  // Suelo
  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene);
  const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.18);
  groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
  ground.material = groundMat;

  // Esfera
  const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 1.5, segments: 32 }, scene);
  sphere.position.y = 1;
  const sphereMat = new BABYLON.StandardMaterial('sphereMat', scene);
  sphereMat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1.0);
  sphereMat.emissiveColor = new BABYLON.Color3(0.02, 0.05, 0.1);
  sphere.material = sphereMat;

  // Caja
  const box = BABYLON.MeshBuilder.CreateBox('box', { size: 1 }, scene);
  box.position.set(-2, 0.5, -1.5);
  const boxMat = new BABYLON.StandardMaterial('boxMat', scene);
  boxMat.diffuseColor = new BABYLON.Color3(1.0, 0.5, 0.2);
  box.material = boxMat;

  // Robot multi-malla y animación de caminar
  const robot = createRobot(scene);
  let t = 0;

  // Animación simple
  scene.onBeforeRenderObservable.add(() => {
    const dt = engine.getDeltaTime() / 1000; // segundos
    t += dt;
    sphere.rotation.y += dt * 1.5;
    box.rotation.x += dt * 1.0;
    box.rotation.y += dt * 1.2;

    // Movimiento del robot en un círculo y orientación hacia la tangente
    const r = 2.5;
    const ang = t * 0.6;
    robot.root.position.x = Math.cos(ang) * r;
    robot.root.position.z = Math.sin(ang) * r;
    robot.root.rotation.y = ang + Math.PI / 2;

    // Ciclo de caminata (balanceo de brazos y piernas)
    const swing = Math.sin(t * 4.0);
    const swing2 = Math.sin(t * 4.0 + Math.PI);
    robot.armL.pivot.rotation.x = 0.6 * swing;
    robot.armR.pivot.rotation.x = 0.6 * swing2;
    robot.legL.pivot.rotation.x = 0.6 * swing2;
    robot.legR.pivot.rotation.x = 0.6 * swing;
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
