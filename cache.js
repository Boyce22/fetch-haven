const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, 'cache');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const saveVariables = (name, variables) => {
  const filePath = path.join(CACHE_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(variables, null, 2), 'utf-8');
};

const loadVariables = (name) => {
  const filePath = path.join(CACHE_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

const listVariableSets = () =>
  fs
    .readdirSync(CACHE_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.basename(f, '.json'));

module.exports = {
  saveVariables,
  loadVariables,
  listVariableSets,
};