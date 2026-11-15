const { gunzipSync } = require('node:zlib');

const allowedYears = new Set([2012, 2014, 2016, 2018, 2020, 2022, 2024]);
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

async function readTerritorialDataset(year, uf) {
  const key = `territorial_${year}_${uf}`;
  if (dataCache.has(key)) return dataCache.get(key);
  dataCache.clear();
  const objectName = `tse-territorial/${year}/${uf}.csv.gz`;
  try {
    const [compressed] = await require('firebase-admin').storage().bucket().file(objectName).download();
    const text = gunzipSync(compressed, { maxOutputLength: 1900 * 1024 * 1024 }).toString('utf8');
    dataCache.set(key, text);
    return text;
  } catch (error) {
    if (error.code === 404 || error.code === 'storage/object-not-found') {
      throw new Error(`Base territorial do TSE não encontrada: ${year}/${uf}.`);
    }
    throw new Error(`Falha ao abrir a base territorial ${year}/${uf}: ${error.message}`);
  }
}

async function queryTseTerritorial({ year, uf, cargo, turn, municipalityCode, granularity, zoneCode, locationCode, sectionCode }) {
  year = Number(year); turn = Number(turn); uf = String(uf || '').toUpperCase();
  cargo = String(cargo || ''); municipalityCode = municipalityCode ? String(municipalityCode).padStart(5, '0') : '';
  zoneCode = zoneCode ? String(zoneCode).padStart(4, '0') : '';
  locationCode = locationCode ? String(locationCode).padStart(4, '0') : '';
  sectionCode = sectionCode ? String(sectionCode).padStart(4, '0') : '';
  const cargoCode = cargoCodes[cargo];
  const allowedGranularities = new Set(['zone', 'location', 'section']);
  if (!allowedYears.has(year) || !allowedUfs.has(uf) || !cargoCode || ![1, 2].includes(turn) || !municipalityCode || !allowedGranularities.has(granularity)) {
    throw new Error('Parâmetros de análise territorial inválidos.');
  }
  const localElection = year % 4 === 0;
  if (localElection !== (cargoCode === 11 || cargoCode === 13)) throw new Error('Cargo não corresponde ao tipo de eleição deste ano.');
  if (granularity === 'location' && !zoneCode) throw new Error('Selecione uma zona antes do local de votação.');
  if (granularity === 'section' && (!zoneCode || !locationCode)) throw new Error('Selecione zona e local antes da seção.');

  const dataUf = cargo === 'Presidente' ? 'BR' : uf;
  const records = csvRecords(await readTerritorialDataset(year, dataUf));
  const headers = records.next().value?.map(norm) || [];
  const indexes = Object.fromEntries(headers.map((header, index) => [header, index]));
  const pick = (row, names) => { for (const name of names) if (indexes[name] !== undefined) return row[indexes[name]]; return ''; };
  const zones = new Map(), locations = new Map(), sections = new Map(), candidates = new Map();
  for (const row of records) {
    if (number(pick(row, ['TURN'])) !== turn || number(pick(row, ['CARGOCODE'])) !== cargoCode) continue;
    const municipality = String(pick(row, ['MUNICIPALITYCODE'])).padStart(5, '0');
    if (municipality !== municipalityCode) continue;
    const zone = String(pick(row, ['ZONECODE'])).padStart(4, '0');
    const location = String(pick(row, ['LOCATIONCODE'])).padStart(4, '0');
    const section = String(pick(row, ['SECTIONCODE'])).padStart(4, '0');
    if (zone && zone !== '0000') zones.set(zone, zone);
    if (zoneCode && zone !== zoneCode) continue;
    if (location && location !== '0000') locations.set(location, pick(row, ['LOCATIONNAME']) || `Local ${location}`);
    if (locationCode && location !== locationCode) continue;
    if (section && section !== '0000') sections.set(section, section);
    if (sectionCode && section !== sectionCode) continue;
    const candidateId = pick(row, ['CANDIDATEID']) || `${pick(row, ['CANDIDATENUMBER'])}_${pick(row, ['NAME'])}`;
    if (!candidateId) continue;
    const current = candidates.get(candidateId) || {
      id: candidateId, name: pick(row, ['NAME']), number: pick(row, ['CANDIDATENUMBER']),
      party: pick(row, ['PARTY']), votes: 0,
    };
    current.votes += number(pick(row, ['VOTES']));
    candidates.set(candidateId, current);
  }
  const candidateRows = [...candidates.values()].filter(item => item.name).sort((a, b) => b.votes - a.votes);
  const hasTerritorySelection = granularity === 'zone' ? Boolean(zoneCode) : granularity === 'location' ? Boolean(locationCode) : Boolean(sectionCode);
  const selectedRows = hasTerritorySelection ? candidateRows : [];
  const validVotes = selectedRows.reduce((sum, item) => sum + item.votes, 0);
  for (const candidate of selectedRows) candidate.percent = validVotes ? candidate.votes * 100 / validVotes : 0;
  const list = values => [...values.entries()].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return {
    year, uf, cargo, turn, candidates: selectedRows, summary: { vv: validVotes },
    zones: list(new Map([...zones].map(([code]) => [code, `Zona ${code}`]))),
    locations: list(locations), sections: list(new Map([...sections].map(([code]) => [code, `Seção ${code}`]))),
    election: { code: `TSE ${year}`, cycle: `ele${year}` },
  };
}

async function queryTseHistorical({ year, uf, cargo, turn, municipalityCode, zoneCode }) {
  year = Number(year); turn = Number(turn); uf = String(uf || '').toUpperCase();
  cargo = String(cargo || ''); municipalityCode = municipalityCode ? String(municipalityCode).padStart(5, '0') : '';
  zoneCode = zoneCode ? String(zoneCode).padStart(4, '0') : '';
  const cargoCode = cargoCodes[cargo];
  const dataUf = cargo === 'Presidente' ? 'BR' : uf;
  if (!allowedYears.has(year) || !allowedUfs.has(dataUf) || !cargoCode || ![1, 2].includes(turn)) throw new Error('Parâmetros de apuração histórica inválidos.');
  const localElection = year % 4 === 0;
  if (localElection !== (cargoCode === 11 || cargoCode === 13)) throw new Error('Cargo não corresponde ao tipo de eleição deste ano.');

  const records = csvRecords(await readDataset(year, dataUf));
  const headers = records.next().value?.map(norm) || [];
  const indexes = Object.fromEntries(headers.map((header, index) => [header, index]));
  const pick = (row, names) => { for (const name of names) if (indexes[name] !== undefined) return row[indexes[name]]; return ''; };
  const municipalities = new Map();
  const zones = new Map();
  const candidates = new Map();
  const validVotesByArea = new Map();
  const needsMunicipality = cargoCode === 11 || cargoCode === 13;

  for (const row of records) {
    if (number(pick(row, ['TURN'])) !== turn) continue;
    const municipality = String(pick(row, ['MUNICIPALITYCODE'])).padStart(5, '0');
    const municipalityName = pick(row, ['MUNICIPALITYNAME']);
    const zone = String(pick(row, ['ZONECODE']) || '').padStart(4, '0');
    if (municipality && municipalityName) municipalities.set(municipality, municipalityName);
    if (municipality && zone && zone !== '0000' && municipalityCode === municipality) zones.set(zone, zone);
    if (needsMunicipality && !municipalityCode) continue;
    if (cargo === 'Presidente' && municipalityCode) continue;
    if (municipalityCode && municipality !== municipalityCode) continue;
    if (zoneCode && zone !== zoneCode) continue;
    if (number(pick(row, ['CARGOCODE'])) !== cargoCode) continue;
    const validVotes = number(pick(row, ['VALIDVOTES']));
    validVotesByArea.set(`${municipality}_${zone}`, validVotes);
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
  const validVotes = [...validVotesByArea.values()].reduce((sum, value) => sum + value, 0);
  for (const candidate of candidateRows) candidate.percent = validVotes ? candidate.votes * 100 / validVotes : 0;
  return {
    year, uf: dataUf, cargo, turn,
    municipalities: municipalityList,
    zones: [...zones.values()].map(code => ({ code, name: `Zona ${code}` })).sort((a, b) => a.code.localeCompare(b.code)),
    candidates: candidateRows,
    summary: { vv: validVotes },
    election: { code: `TSE ${year}`, cycle: `ele${year}` },
  };
}

module.exports = { queryTseHistorical, queryTseTerritorial };
