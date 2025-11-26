const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos desde /Examen-01
app.use(express.static(path.join(__dirname, 'Examen-01')));

// Servir la carpeta model
app.use('/model', express.static(path.join(__dirname, 'model')));

// Fallback a index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'Examen-01', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
