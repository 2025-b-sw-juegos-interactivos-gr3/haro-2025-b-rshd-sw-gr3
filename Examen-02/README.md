# Sinapsis — Prototipo 3D (Babylon.js)

Rápido inicio para el prototipo local.

Pasos:

1. Instala dependencias:

```powershell
npm install
```

2. Inicia servidor de desarrollo:

```powershell
npm run start:dev
```

3. Abre http://localhost:8000/ si el navegador no se abre automáticamente.

Notas:
- El `game.js` intenta cargar modelos GLB remotos (ej. `HVGirl.glb`). Si no tienes acceso a los assets remotos, reemplaza las URLs en `game.js` por tus modelos locales bajo `./assets/`.
- Para crear el material ‘Organic Cellular’ usa el Node Material Editor de Babylon y exporta el JSON para importarlo con `BABYLON.NodeMaterial.Parse(...)`.
