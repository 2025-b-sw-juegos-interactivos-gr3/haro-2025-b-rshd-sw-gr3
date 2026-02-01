// Sinapsis - El Templo de la Secuencia (Simon Says 3D)
(() => {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = () => {
        const scene = new BABYLON.Scene(engine);
        
        // --- AMBIENTE CÁLIDO Y MÍSTICO ---
        scene.clearColor = new BABYLON.Color4(0.05, 0.02, 0.01, 1);
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.02;
        scene.fogColor = new BABYLON.Color3(0.15, 0.05, 0);

        const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
        hemi.intensity = 0.3;
        hemi.groundColor = new BABYLON.Color3(0.2, 0.1, 0);

        const glow = new BABYLON.GlowLayer('glow', scene);
        glow.intensity = 0.9;

        // CÁMARA
        const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI/2, Math.PI/2.5, 8, BABYLON.Vector3.Zero(), scene);
        camera.setTarget(new BABYLON.Vector3(0, 1, 0));
        camera.attachControl(canvas, true);
        camera.lowerRadiusLimit = 4;
        camera.upperRadiusLimit = 12;

        // --- ESTADO DEL JUEGO ---
        let state = {
            sequence: [],
            playerSequence: [],
            isShowingSequence: false,
            level: 1,
            points: 0,
            drums: []
        };

        const colors = [
            { name: 'Red', color: new BABYLON.Color3(1, 0.1, 0.1), emissive: new BABYLON.Color3(0.5, 0, 0) },
            { name: 'Amber', color: new BABYLON.Color3(1, 0.6, 0.1), emissive: new BABYLON.Color3(0.5, 0.3, 0) },
            { name: 'Orange', color: new BABYLON.Color3(1, 0.3, 0), emissive: new BABYLON.Color3(0.6, 0.1, 0) },
            { name: 'Gold', color: new BABYLON.Color3(1, 0.8, 0.2), emissive: new BABYLON.Color3(0.5, 0.4, 0.1) }
        ];

        // --- GEOMETRÍA DEL TEMPLO (MATEMÁTICA) ---
        const buildTemple = () => {
            const stoneMat = new BABYLON.StandardMaterial('stone', scene);
            stoneMat.diffuseColor = new BABYLON.Color3(0.2, 0.15, 0.1);
            try {
                const noise = new BABYLON.NoiseProceduralTexture('stoneNoise', 256, scene);
                stoneMat.diffuseTexture = noise;
            } catch(e){}

            // Suelo Octagonal
            const floor = BABYLON.MeshBuilder.CreateCylinder('floor', { diameter: 10, height: 0.5, tessellation: 8 }, scene);
            floor.material = stoneMat;
            floor.position.y = -0.25;

            // Columnas Matemáticas Orbitales
            const columns = [];
            for(let i=0; i<8; i++) {
                const col = BABYLON.MeshBuilder.CreateBox('col'+i, { width: 0.6, depth: 0.6, height: 5 }, scene);
                col.material = stoneMat;
                columns.push(col);
            }

            // Orbe Central (Magic Orb) - AHORA DRAGGABLE PARA EL USUARIO
            const orb = BABYLON.MeshBuilder.CreateSphere('orb', { diameter: 1.2 }, scene);
            orb.position.set(0, 1.8, 0);
            const orbMat = new BABYLON.StandardMaterial('orbMat', scene);
            orbMat.emissiveColor = new BABYLON.Color3(0.1, 1, 0.2); // Verde como la imagen
            orbMat.alpha = 0.8;
            orb.material = orbMat;

            // Telequinesis: Arrastrar el orbe
            const orbDrag = new BABYLON.PointerDragBehavior({dragPlaneNormal: new BABYLON.Vector3(0,1,0)});
            orb.addBehavior(orbDrag);
            orbDrag.onDragStartObservable.add(()=>orbMat.emissiveColor = new BABYLON.Color3(0.5, 1, 0.5));
            orbDrag.onDragEndObservable.add(()=>orbMat.emissiveColor = new BABYLON.Color3(0.1, 1, 0.2));

            // --- FEATURE: PIEDRAS RÚNICAS INTERACTIVAS ---
            const runeMat = new BABYLON.StandardMaterial("runeMat", scene);
            runeMat.emissiveColor = new BABYLON.Color3(0, 0.6, 0.3);
            for(let i=0; i<6; i++) {
                const rune = BABYLON.MeshBuilder.CreatePolyhedron("rune"+i, {type:1, size:0.3}, scene);
                rune.position.set(Math.random()*6-3, 0.8, Math.random()*6-3);
                rune.material = runeMat;
                const rDrag = new BABYLON.PointerDragBehavior({dragPlaneNormal: new BABYLON.Vector3(0,1,0)});
                rune.addBehavior(rDrag);
                scene.onBeforeRenderObservable.add(() => { rune.rotation.y += 0.01; rune.rotation.x += 0.005; });
            }

            // --- FEATURE: SISTEMA DE PARTÍCULAS (POLVO MÁGICO) ---
            const ps = new BABYLON.ParticleSystem("particles", 500, scene);
            ps.particleTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/flare.png", scene);
            ps.emitter = orb; // Las partículas salen del orbe
            ps.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
            ps.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);
            ps.color1 = new BABYLON.Color4(0.3, 1.0, 0.3, 1.0);
            ps.color2 = new BABYLON.Color4(0.1, 0.5, 0.1, 1.0);
            ps.minSize = 0.01;
            ps.maxSize = 0.05;
            ps.minLifeTime = 1.0;
            ps.maxLifeTime = 2.5;
            ps.emitRate = 100;
            ps.gravity = new BABYLON.Vector3(0, 0.2, 0); // Flotan hacia arriba suavemente
            ps.start();

            // Animaciones matemáticas globales
            scene.onBeforeRenderObservable.add(() => {
                const time = Date.now() * 0.001;
                
                // Rotación y flotación del Orbe
                orb.position.y = 1.8 + Math.sin(time * 2) * 0.2;
                orb.rotation.y += 0.02;

                // Columnas orbitales: movimiento sinusoidal y circular
                columns.forEach((col, i) => {
                    const angle = (i * Math.PI * 2) / 8 + (time * 0.2); // Rotación lenta
                    const radius = 4.5 + Math.sin(time + i) * 0.5; // El radio pulsa
                    col.position.set(Math.cos(angle) * radius, 2.5 + Math.sin(time * 0.5 + i) * 0.3, Math.sin(angle) * radius);
                    col.rotation.y = -angle; // Siempre miran al centro
                });

                // Movimiento de los tambores (hover)
                state.drums.forEach((d, i) => {
                    if (!state.isShowingSequence) {
                        d.mesh.position.y = 0.4 + Math.sin(time * 3 + i) * 0.05;
                    }
                });
            });
        };

        // --- CREACIÓN DE TAMBORES ---
        const createDrums = () => {
            for(let i=0; i<4; i++) {
                const angle = (i * Math.PI * 2) / 4 + Math.PI/4;
                const drumMain = BABYLON.MeshBuilder.CreateCylinder('drum'+i, { diameter: 1.2, height: 0.8 }, scene);
                drumMain.position.set(Math.cos(angle)*2.5, 0.4, Math.sin(angle)*2.5);
                
                const mat = new BABYLON.StandardMaterial('drumMat'+i, scene);
                mat.diffuseColor = colors[i].color;
                mat.emissiveColor = colors[i].emissive.scale(0.5);
                drumMain.material = mat;

                const drumTop = BABYLON.MeshBuilder.CreateCylinder('drumTop'+i, { diameter: 1.1, height: 0.1 }, scene);
                drumTop.parent = drumMain;
                drumTop.position.y = 0.4;
                
                state.drums.push({ mesh: drumMain, mat: mat, index: i });
            }
        };

        // --- FLUJO DEL JUEGO ---
        const showSequence = async () => {
            state.isShowingSequence = true;
            state.playerSequence = [];
            
            for(let idx of state.sequence) {
                await new Promise(r => setTimeout(r, 800));
                flashDrum(idx);
                await new Promise(r => setTimeout(r, 400));
            }
            state.isShowingSequence = false;
        };

        const flashDrum = (index) => {
            const drum = state.drums[index];
            if(!drum) return;
            const originalEmissive = drum.mat.emissiveColor.clone();
            drum.mat.emissiveColor = colors[index].color.scale(1.5);
            drum.mesh.scaling.set(1.1, 0.9, 1.1);
            
            setTimeout(() => {
                drum.mat.emissiveColor = originalEmissive;
                drum.mesh.scaling.set(1, 1, 1);
            }, 400);
        };

        const addToSequence = () => {
            state.sequence.push(Math.floor(Math.random() * 4));
        };

        const checkPlayerMove = (index) => {
            if(state.isShowingSequence) return;
            
            flashDrum(index);
            state.playerSequence.push(index);
            
            const step = state.playerSequence.length - 1;
            if(state.playerSequence[step] !== state.sequence[step]) {
                resetGame();
                return;
            }
            
            if(state.playerSequence.length === state.sequence.length) {
                state.points += 100 * state.level;
                state.level++;
                document.getElementById('pointsVal').innerText = state.points;
                document.getElementById('levelVal').innerText = state.level;
                
                const msg = document.getElementById('message');
                msg.innerText = "¡NIVEL UP!";
                msg.style.display = 'block';
                setTimeout(() => {
                    msg.style.display = 'none';
                    nextLevel();
                }, 1500);
            }
        };

        const nextLevel = () => {
            addToSequence();
            showSequence();
        };

        const resetGame = () => {
            state.sequence = [];
            state.level = 1;
            state.points = 0;
            document.getElementById('pointsVal').innerText = "0";
            document.getElementById('levelVal').innerText = "1";
            
            const msg = document.getElementById('message');
            msg.innerText = "¡SECUENCIA INCORRECTA!";
            msg.style.display = 'block';
            setTimeout(() => {
                msg.style.display = 'none';
                document.getElementById('startScreen').style.display = 'block';
            }, 2000);
        };

        // --- INTERACCIÓN ---
        scene.onPointerDown = (evt, pickResult) => {
            if(pickResult.hit && pickResult.pickedMesh) {
                const clicked = state.drums.find(d => d.mesh === pickResult.pickedMesh || d.mesh === pickResult.pickedMesh.parent);
                if(clicked !== undefined) {
                    checkPlayerMove(clicked.index);
                }
            }
        };

        // --- INICIALIZACIÓN ---
        const startBtn = document.getElementById('startBtn');
        startBtn.addEventListener('click', () => {
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('hud').style.display = 'block';
            state.sequence = [];
            addToSequence();
            showSequence();
        });

        buildTemple();
        createDrums();

        return scene;
    };

    const scene = createScene();
    engine.runRenderLoop(() => scene.render());
    window.addEventListener('resize', () => engine.resize());
})();
