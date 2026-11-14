const { gunzipSync } = require('node:zlib');

const allowedYears = new Set([2012, 2014, 2016, 2018, 2020, 2022]);
const allowedUfs = new Set(['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO','BR']);
const cargoCodes = { Presidente: 1, Governador: 3, Senador: 5, 'Deputado federal': 6, 'Deputado estadual/distrital': 7, Prefeito: 11, Vereador: 13 };
const dataCache = new Map();

function* csvRecords(text) {
  const firstLine = text.split(/\r?\n/, 1)[0];
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell.length === 0) quoted = true;
    else if (char === delimiter) { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell.replace(/\r$/, '')); yield row; row = []; cell = ''; }
    else cell += char;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); yield row; }
}

function norm(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/^\uFEFF/, '').trim().toUpperCase(); }
function number(value) { return Number(String(value || '').replace(/\D/g, '')) || 0; }

async function readDataset(year, uf) {
  const key = `${year}_${uf}`;
  if (dataCache.has(key)) return dataCache.get(key);
  dataCache.clear();
  const objectName = `tse-historical/${year}/${uf}.csv.gz`;
  try {
    const [compressed] = await require('firebase-admin').storage().bucket().file(objectName).download();
    const text = gunzipSync(compressed, { maxOutputLength: 1024 * 1024 * 1024 }).toString('utf8');
    dataCache.set(key, text);
    return text;
  } catch (error) {
    if (error.code === 404 || error.code === 'storage/object-not-found') {
      throw new Error(`Base histórica não encontrada no Cloud Storage: ${year}/${uf}.`);
    }
    throw new Error(`Falha ao abrir o CSV histórico ${year}/${uf}: ${error.message}`);
  }
}

async function queryTseHistorical({ year, uf, cargo, turn, municipalityCode }) {
  year = Number(year); turn = Number(turn); uf = String(uf || '').toUpperCase();
  cargo = String(cargo || ''); municipalityCode = municipalityCode ? String(municipalityCode).padStart(5, '0') : '';
  const cargoCode = cargoCodes[cargo];
  const dataUf = cargo === 'Presidente' ? 'BR' : uf;
  if (!allowedYears.has(year) || !allowedUfs.has(dataUf) || !cargoCode || ![1, 2].includes(turn)) throw new Error('Parâmetros de apuração histórica inválidos.');

  const records = csvRecords(await readDataset(year, dataUf));
  const headers = records.next().value?.map(norm) || [];
  const indexes = Object.fromEntries(headers.map((header, index) => [header, index]));
  const pick = (row, names) => { for (const name of names) if (indexes[name] !== undefined) return row[indexes[name]]; return ''; };
  const municipalities = new Map();
  const candidates = new Map();
  const validVotesByMunicipality = new Map();
  const needsMunicipality = cargoCode === 11 || cargoCode === 13;

  for (const row of records) {
    if (number(pick(row, ['TURN'])) !== turn) continue;
    const municipality = String(pick(row, ['MUNICIPALITYCODE'])).padStart(5, '0');
    const municipalityName = pick(row, ['MUNICIPALITYNAME']);
    if (municipality && municipalityName) municipalities.set(municipality, municipalityName);
    if (needsMunicipality && !municipalityCode) continue;
    if (cargo === 'Presidente' && municipalityCode) continue;
    if (municipalityCode && municipality !== municipalityCode) continue;
    if (number(pick(row, ['CARGOCODE'])) !== cargoCode) continue;
    const validVotes = number(pick(row, ['VALIDVOTES']));
    validVotesByMunicipality.set(municipality, validVotes);
    const candidateId = pick(row, ['CANDIDATEID']) || `${pick(row, ['CANDIDATENUMBER'])}_${pick(row, ['NAME'])}`;
    if (!candidateId) continue;
    const current = candidates.get(candidateId) || {
      id: candidateId,
      name: pick(row, ['NAME']),
      number: pick(row, ['CANDIDATENUMBER']),
      party: pick(row, ['PARTY']),
      votes: 0,
      elected: pick(row, ['STATUS']),
    };
    current.votes += number(pick(row, ['VOTES']));
    candidates.set(candidateId, current);
  }

  const municipalityList = [...municipalities.entries()]
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const candidateRows = [...candidates.values()].sort((a, b) => b.votes - a.votes);
  const validVotes = [...validVotesByMunicipality.values()].reduce((sum, value) => sum + value, 0);
  for (const candidate of candidateRows) candidate.percent = validVotes ? candidate.votes * 100 / validVotes : 0;
  return {
    year, uf: dataUf, cargo, turn,
    municipalities: municipalityList,
    candidates: candidateRows,
    summary: { vv: validVotes },
    election: { code: `TSE ${year}`, cycle: `ele${year}` },
  };
}

module.exports = { queryTseHistorical };
