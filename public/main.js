// Escena simple en Babylon.js
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

  // Animación simple
  scene.onBeforeRenderObservable.add(() => {
    sphere.rotation.y += engine.getDeltaTime() * 0.0015;
    box.rotation.x += engine.getDeltaTime() * 0.001;
    box.rotation.y += engine.getDeltaTime() * 0.0012;
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
