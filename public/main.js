// Escena simple en Babylon.js

// Función para cargar el modelo ninja
function loadNinjaModel(scene) {
  return new Promise((resolve, reject) => {
    console.log('Intentando cargar modelo ninja...');
    BABYLON.SceneLoader.ImportMesh("", "model/", "low_poly_ninja_rigged.glb", scene, 
      (meshes, particleSystems, skeletons, animationGroups) => {
        console.log('Modelo cargado exitosamente');
        console.log('Meshes:', meshes.length);
        console.log('Skeletons:', skeletons.length);
        console.log('Animation Groups:', animationGroups.length);
        
        // Crear nodo raíz para el personaje
        const root = new BABYLON.TransformNode('ninjaRoot', scene);
        
        // Crear un contenedor para las mallas que puede rotar
        const meshContainer = new BABYLON.TransformNode('ninjaContainer', scene);
        meshContainer.parent = root;
        
        // Escalar el modelo (ajusta estos valores según necesites)
        meshContainer.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8);
        
        // Agrupar todas las mallas bajo el contenedor
        meshes.forEach(mesh => {
          if (mesh.parent === null) {
            mesh.parent = meshContainer;
          }
        });
        
        // Calcular el bounding box para centrar el pivote en los pies
        const boundingInfo = meshContainer.getHierarchyBoundingVectors();
        const minY = boundingInfo.min.y;
        
        // Ajustar la posición del contenedor para que el pivote esté en los pies
        meshContainer.position.y = -minY;
        
        // Buscar huesos para animación procedural
        let bones = null;
        if (skeletons.length > 0) {
          const skeleton = skeletons[0];
          console.log('Huesos disponibles:', skeleton.bones.map(b => b.name));
          
          // Intentar encontrar huesos de extremidades (nombres comunes)
          bones = {
            leftArm: skeleton.bones.find(b => 
              b.name.toLowerCase().includes('leftarm') || 
              b.name.toLowerCase().includes('l_arm') ||
              b.name.toLowerCase().includes('arm.l') ||
              b.name.toLowerCase().includes('upperarm_l')
            ),
            rightArm: skeleton.bones.find(b => 
              b.name.toLowerCase().includes('rightarm') || 
              b.name.toLowerCase().includes('r_arm') ||
              b.name.toLowerCase().includes('arm.r') ||
              b.name.toLowerCase().includes('upperarm_r')
            ),
            leftLeg: skeleton.bones.find(b => 
              b.name.toLowerCase().includes('leftleg') || 
              b.name.toLowerCase().includes('l_leg') ||
              b.name.toLowerCase().includes('leg.l') ||
              b.name.toLowerCase().includes('thigh_l')
            ),
            rightLeg: skeleton.bones.find(b => 
              b.name.toLowerCase().includes('rightleg') || 
              b.name.toLowerCase().includes('r_leg') ||
              b.name.toLowerCase().includes('leg.r') ||
              b.name.toLowerCase().includes('thigh_r')
            )
          };
          
          console.log('Huesos encontrados:', {
            leftArm: bones.leftArm?.name,
            rightArm: bones.rightArm?.name,
            leftLeg: bones.leftLeg?.name,
            rightLeg: bones.rightLeg?.name
          });
        }
        
        const ninjaData = {
          root: root,
          container: meshContainer,
          meshes: meshes,
          skeletons: skeletons,
          animationGroups: animationGroups,
          bones: bones,
          // Compatibilidad con código anterior
          armL: { pivot: root, bone: bones?.leftArm },
          armR: { pivot: root, bone: bones?.rightArm },
          legL: { pivot: root, bone: bones?.leftLeg },
          legR: { pivot: root, bone: bones?.rightLeg }
        };
        
        resolve(ninjaData);
      },
      null, // onProgress
      (scene, message, exception) => {
        console.error('Error cargando modelo:', message, exception);
        reject(new Error(message));
      }
    );
  });
}

// Función para cargar el modelo de ciudad
function loadCityModel(scene) {
  return new Promise((resolve, reject) => {
    console.log('Intentando cargar modelo de ciudad...');
    BABYLON.SceneLoader.ImportMesh("", "model/", "city_low_poly_free.glb", scene, 
      (meshes, particleSystems, skeletons, animationGroups) => {
        console.log('Ciudad cargada exitosamente');
        console.log('Meshes de ciudad:', meshes.length);
        
        const root = new BABYLON.TransformNode('cityRoot', scene);
        
        // Agrupar todas las mallas de la ciudad
        meshes.forEach(mesh => {
          if (mesh.parent === null) {
            mesh.parent = root;
          }
        });
        
        // Ajustar escala si es necesario (puedes modificar estos valores)
        root.scaling = new BABYLON.Vector3(1, 1, 1);
        root.position.y = 0;
        
        const cityData = {
          root: root,
          meshes: meshes
        };
        
        resolve(cityData);
      },
      null, // onProgress
      (scene, message, exception) => {
        console.error('Error cargando ciudad:', message, exception);
        reject(new Error(message));
      }
    );
  });
}

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

async function createScene() {
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

  // Cargar el modelo de ciudad en lugar del suelo procedimental
  let city;
  try {
    city = await loadCityModel(scene);
    console.log('Ciudad cargada y posicionada');
  } catch (error) {
    console.error('No se pudo cargar la ciudad, creando suelo por defecto');
    // Fallback: suelo simple si falla la carga
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 200, height: 200 }, scene);
    const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    ground.material = groundMat;
  }

  // Cargar modelo ninja en lugar del robot
  let robot;
  try {
    robot = await loadNinjaModel(scene);
    robot.root.position.y = 0; // Posición en el suelo
    camera.lockedTarget = robot.root;
  } catch (error) {
    console.error('No se pudo cargar el modelo ninja, usando robot por defecto');
    robot = createRobot(scene);
    robot.root.position.y = 0.1;
    camera.lockedTarget = robot.root;
  }

  // Eliminar la estructura de arco ya que ahora tenemos una ciudad completa
  // Si quieres mantenerla, descomenta el siguiente código:
  /*
  const structureMat = new BABYLON.StandardMaterial('structureMat', scene);
  structureMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.75);
  structureMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.12);

  const archCenter = robot.root.position.add(new BABYLON.Vector3(0, 0, 2));
  const colL = BABYLON.MeshBuilder.CreateCylinder('archColL', { height: 1.6, diameter: 0.16 }, scene);
  colL.position = new BABYLON.Vector3(archCenter.x - 0.6, 0.8, archCenter.z);
  colL.material = structureMat;

  const colR = BABYLON.MeshBuilder.CreateCylinder('archColR', { height: 1.6, diameter: 0.16 }, scene);
  colR.position = new BABYLON.Vector3(archCenter.x + 0.6, 0.8, archCenter.z);
  colR.material = structureMat;

  const beam = BABYLON.MeshBuilder.CreateBox('archBeam', { width: 1.4, height: 0.18, depth: 0.22 }, scene);
  beam.position = new BABYLON.Vector3(archCenter.x, 1.6, archCenter.z);
  beam.material = structureMat;
  */

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
  const moveSpeed = 2.8;
  const rotSpeed = 2.8;
  let walkT = 0;

  // Animación y control
  scene.onBeforeRenderObservable.add(() => {
    const dt = engine.getDeltaTime() / 1000;

    // Lectura WASD
    const forward = (inputMap['w'] ? 1 : 0) + (inputMap['s'] ? -1 : 0);
    const turn = (inputMap['d'] ? 1 : 0) + (inputMap['a'] ? -1 : 0);

    // Rotación del personaje - solo rotar en Y (mantiene los pies en el suelo)
    if (turn !== 0) {
      robot.root.rotation.y += rotSpeed * turn * dt;
    }

    // Avance/retroceso - el root se mueve, no se inclina
    if (forward !== 0) {
      // Obtener dirección de movimiento basada en la rotación Y del root
      const moveDir = new BABYLON.Vector3(
        Math.sin(robot.root.rotation.y),
        0,
        Math.cos(robot.root.rotation.y)
      );
      robot.root.position.addInPlace(moveDir.scale(moveSpeed * forward * dt));
      walkT += dt;
    }

    // Animación de caminar
    const moving = forward !== 0;

    // Si el modelo tiene animaciones predefinidas, usarlas
    if (robot.animationGroups && robot.animationGroups.length > 0) {
      if (moving) {
        robot.animationGroups.forEach(ag => {
          if (!ag.isPlaying) ag.play(true);
        });
      } else {
        robot.animationGroups.forEach(ag => {
          if (ag.isPlaying) ag.stop();
        });
      }
    } 
    // Si tiene huesos pero no animaciones, animar proceduralmente
    else if (robot.bones && (robot.bones.leftArm || robot.bones.leftLeg)) {
      const swing = Math.sin(walkT * 6.0);
      const swingAmount = moving ? 0.4 : 0;
      
      // Animar brazos
      if (robot.bones.leftArm) {
        const targetRotX = swing * swingAmount;
        robot.bones.leftArm.rotation.x = BABYLON.Scalar.Lerp(
          robot.bones.leftArm.rotation.x, 
          targetRotX, 
          0.2
        );
      }
      if (robot.bones.rightArm) {
        const targetRotX = -swing * swingAmount;
        robot.bones.rightArm.rotation.x = BABYLON.Scalar.Lerp(
          robot.bones.rightArm.rotation.x, 
          targetRotX, 
          0.2
        );
      }
      
      // Animar piernas (opuesto a los brazos)
      if (robot.bones.leftLeg) {
        const targetRotX = -swing * swingAmount * 0.8;
        robot.bones.leftLeg.rotation.x = BABYLON.Scalar.Lerp(
          robot.bones.leftLeg.rotation.x, 
          targetRotX, 
          0.2
        );
      }
      if (robot.bones.rightLeg) {
        const targetRotX = swing * swingAmount * 0.8;
        robot.bones.rightLeg.rotation.x = BABYLON.Scalar.Lerp(
          robot.bones.rightLeg.rotation.x, 
          targetRotX, 
          0.2
        );
      }
      
      // Si no se mueve, volver suavemente a la posición neutral
      if (!moving) {
        if (robot.bones.leftArm) {
          robot.bones.leftArm.rotation.x *= 0.9;
        }
        if (robot.bones.rightArm) {
          robot.bones.rightArm.rotation.x *= 0.9;
        }
        if (robot.bones.leftLeg) {
          robot.bones.leftLeg.rotation.x *= 0.9;
        }
        if (robot.bones.rightLeg) {
          robot.bones.rightLeg.rotation.x *= 0.9;
        }
      }
    }
    // Fallback: animación para el robot por defecto
    else if (robot.armL && robot.armL.pivot && robot.armL.pivot.rotation) {
      const swing = Math.sin(walkT * 6.0) * (moving ? 1 : 0);
      robot.armL.pivot.rotation.x = moving ? 0.6 * swing : robot.armL.pivot.rotation.x * 0.85;
      robot.armR.pivot.rotation.x = moving ? -0.6 * swing : robot.armR.pivot.rotation.x * 0.85;
      robot.legL.pivot.rotation.x = moving ? -0.6 * swing : robot.legL.pivot.rotation.x * 0.85;
      robot.legR.pivot.rotation.x = moving ? 0.6 * swing : robot.legR.pivot.rotation.x * 0.85;
    }
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
  label.text = 'Low Poly City';
  label.color = '#e8eaed';
  label.fontSize = 14;
  rect.addControl(label);

  return scene;
}

createScene().then(scene => {
  console.log('Escena creada, iniciando render loop');
  engine.runRenderLoop(() => {
    if (scene && scene.activeCamera) {
      scene.render();
    }
  });
}).catch(error => {
  console.error('Error creando escena:', error);
});

window.addEventListener('resize', () => {
  engine.resize();
});
