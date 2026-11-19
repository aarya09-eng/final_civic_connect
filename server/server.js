const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Helper to read/write JSON files safely
function readData(file) {
  try {
    const dataPath = path.join(__dirname, 'data', file);
    if (!fs.existsSync(dataPath)) return [];
    const raw = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Read error', file, e);
    return [];
  }
}

function writeData(file, data) {
  try {
    const dir = path.join(__dirname, 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    const dataPath = path.join(dir, file);
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Write error', file, e);
  }
}

// Generic CRUD endpoints for each entity
const entities = ['problems', 'proposals', 'support', 'cases', 'overrides'];

entities.forEach(ent => {
  const file = `${ent}.json`;
  // Get all
  app.get(`/${ent}`, (req, res) => {
    res.json(readData(file));
  });
  // Add new
  app.post(`/${ent}`, (req, res) => {
    const arr = readData(file);
    arr.push(req.body);
    writeData(file, arr);
    res.json({ success: true, item: req.body });
  });
  // Update by id (simple replace)
  app.put(`/${ent}/:id`, (req, res) => {
    const arr = readData(file);
    const idx = arr.findIndex(i => i.id === req.params.id);
    if (idx > -1) {
      arr[idx] = { ...arr[idx], ...req.body };
      writeData(file, arr);
      res.json({ success: true, item: arr[idx] });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`CivicConnect temporary server listening on port ${PORT}`));
