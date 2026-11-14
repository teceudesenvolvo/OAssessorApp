import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BarChart3, Vote } from 'lucide-react-native';
import { useAppTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, TSE_HISTORICAL_URL } from '../ApiConfig';

const TSE_BASE = 'https://resultados.tse.jus.br/oficial';
const YEAR_OPTIONS = [2026, 2024, 2022, 2020, 2018, 2016, 2014, 2012];
const UF_OPTIONS = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'],
  ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'],
  ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'],
  ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'], ['PE', 'Pernambuco'], ['PI', 'Piauí'],
  ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'], ['RS', 'Rio Grande do Sul'],
  ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'],
  ['SE', 'Sergipe'], ['TO', 'Tocantins'],
];

const FEDERAL_CODES = {
  Presidente: '1', Governador: '3', Senador: '5',
  'Deputado federal': '6', 'Deputado estadual/distrital': '7',
};
const LOCAL_CODES = { Prefeito: '11', Vereador: '13' };
const CARGO_OPTIONS = [
  { label: 'Presidente', type: 'general' },
  { label: 'Governador', type: 'general' },
  { label: 'Senador', type: 'general' },
  { label: 'Dep. Federal', type: 'general', apiLabel: 'Deputado federal' },
  { label: 'Dep. Estadual', type: 'general', apiLabel: 'Deputado estadual/distrital' },
  { label: 'Prefeito', type: 'municipal' },
  { label: 'Vereador', type: 'municipal' },
];

const formatNumber = value => String(Math.round(Number(value || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const formatPercent = value => `${(Number(value || 0)).toFixed(2).replace('.', ',')}%`;
const cleanNumber = value => parseTseNumber(value);

function resultBase(cycle) {
  return `${TSE_BASE}/${cycle}`;
}

function candidateFile(cycle, electionCode, uf, cargoCode, municipalityCode) {
  const election = String(electionCode).padStart(6, '0');
  const region = uf.toLowerCase();
  const prefix = `c${cargoCode.padStart(4, '0')}-e${election}`;
  const scope = municipalityCode ? `${region}${String(municipalityCode).padStart(5, '0')}` : region;
  return `${resultBase(cycle)}/${electionCode}/dados/${region}/${scope}-${prefix}-u.json`;
}

function progressFile(cycle, electionCode, uf) {
  const election = String(electionCode).padStart(6, '0');
  const region = uf.toLowerCase();
  return `${resultBase(cycle)}/${electionCode}/dados/${region}/${region}-e${election}-ab.json`;
}

function freshUrl(url) {
  return `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
}

function parseTseNumber(value) {
  const raw = String(value ?? '0').trim();
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  return Number(normalized) || 0;
}

export const ApuracaoScreen = () => {
  const styles = baseStyles;
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [year, setYear] = useState(2026);
  const [turn, setTurn] = useState(1);
  const [cargo, setCargo] = useState('Governador');
  const [uf, setUf] = useState('CE');
  const [municipality, setMunicipality] = useState(null);
  const [municipalities, setMunicipalities] = useState([]);
  const [municipalityPickerOpen, setMunicipalityPickerOpen] = useState(false);
  const [municipalitySearch, setMunicipalitySearch] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState(null);
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const electionType = year % 4 === 0 ? 'municipal' : 'general';
  const availableCargos = CARGO_OPTIONS.filter(option => option.type === electionType);
  const selectedCargo = CARGO_OPTIONS.find(option => option.label === cargo);
  const apiCargo = selectedCargo?.apiLabel || cargo;
  const isPresident = apiCargo === 'Presidente';
  const isMunicipalCargo = electionType === 'municipal';
  const currentUf = useMemo(() => UF_OPTIONS.find(([code]) => code === uf)?.[1] || uf, [uf]);

  useEffect(() => {
    setCargo(electionType === 'municipal' ? 'Prefeito' : 'Governador');
    setTurn(1);
    setMunicipality(null);
  }, [year, electionType]);

  useEffect(() => {
    let active = true;
    let requestInFlight = false;
    let hasLoadedResults = false;
    let requestStage = 'catálogo de eleições';
    let requestUrl = '';
    const load = async (initialLoad = false) => {
      if (requestInFlight) return;
      requestInFlight = true;
      if (initialLoad) {
        setLoading(true);
        setError('');
        setCandidates([]);
        setSummary(null);
        setProgress(null);
        setElection(null);
      }
      try {
        const candidateUf = isPresident ? 'br' : uf.toLowerCase();
        if (year <= 2022) {
          requestStage = 'base histórica oficial integrada';
          requestUrl = TSE_HISTORICAL_URL;
          const user = auth.currentUser;
          if (!user) throw new Error('Entre na sua conta para consultar os resultados históricos.');
          const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await user.getIdToken()}`,
            },
            body: JSON.stringify({
              year,
              turn,
              uf: isPresident ? 'BR' : uf,
              cargo: apiCargo,
              municipalityCode: isMunicipalCargo ? municipality?.code || '' : '',
            }),
          });
          const responseBody = await response.text();
          let historical;
          try {
            historical = JSON.parse(responseBody);
          } catch {
            const type = response.headers.get('content-type') || 'tipo desconhecido';
            if (response.status === 404) {
              throw new Error('A função tseHistoricalResults não foi encontrada no Firebase. Publique a função no projeto oassessor-blu.');
            }
            if (response.status === 403) {
              throw new Error('O Firebase bloqueou o acesso à função histórica (HTTP 403). Confira se ela permite invocação pública e valida o token do usuário.');
            }
            throw new Error(`O Firebase retornou uma resposta inesperada (HTTP ${response.status}, ${type}). Confira os logs da função tseHistoricalResults.`);
          }
          if (!response.ok) throw new Error(historical?.error || `Serviço histórico respondeu HTTP ${response.status}.`);
          if (!active) return;
          setMunicipalities(historical.municipalities || []);
          if (isMunicipalCargo && !municipality?.code) {
            setMunicipality(null);
            setElection(historical.election || { code: `TSE ${year}`, cycle: `ele${year}` });
            setCandidates([]);
            setSummary(null);
            setProgress(null);
            setError('');
            hasLoadedResults = true;
            return;
          }
          setCandidates(historical.candidates || []);
          setSummary(historical.summary || null);
          setProgress(null);
          setElection(historical.election || { code: `TSE ${year}`, cycle: `ele${year}` });
          setError('');
          hasLoadedResults = true;
          return;
        }
        // Municipal and major-position catalogs often publish the cargo under
        // the national (br) scope, while the result JSON is still stored per UF.
        const catalogUf = electionType === 'municipal' || isPresident ? 'br' : candidateUf;
        const code = (electionType === 'municipal' ? LOCAL_CODES[apiCargo] : FEDERAL_CODES[apiCargo]);
        if (!code) throw new Error('Cargo não disponível para este ano eleitoral.');
        requestStage = 'catálogo de eleições';
        requestUrl = freshUrl(`${TSE_BASE}/comum/config/ele-c.json`);
        const configResponse = await fetch(requestUrl);
        if (!configResponse.ok) throw new Error(`TSE respondeu HTTP ${configResponse.status}.`);
        const config = await configResponse.json();
        if (!active) return;
        const electionYearMatches = (config?.pl || []).flatMap(cycle => (cycle.e || []).map(item => ({ ...item, cycle: cycle.c })))
          .filter(item => {
            const electionDate = String(item.dt || '').split('/');
            const electionYear = Number(electionDate[electionDate.length - 1]);
            return electionYear === year && Number(item.t || 1) === turn;
          });
        const electionMatch = electionYearMatches.find(item => {
          const areas = item.abr || [];
          const hasCargoForScope = areas.some(entry =>
            (entry.cd === catalogUf || entry.cd === 'br')
            && entry.cp?.some(position => String(position.cd) === code),
          );
          return item.cycle === `ele${year}` && String(item.tp) !== '4' && hasCargoForScope;
        }) || ([2024, 2026].includes(year) ? (() => {
          // Use the TSE-published election IDs if catalog scope metadata does
          // not match the selected cargo/UF in a client response.
          const officialCode = year === 2026
            ? (turn === 1 ? (isPresident ? '6257' : '6259') : (isPresident ? '6258' : '6260'))
            : (turn === 1 ? '619' : '620');
          return (config?.pl || []).flatMap(cycle => (cycle.e || []).map(item => ({ ...item, cycle: cycle.c })))
            .find(item => String(item.cd) === officialCode && item.cycle === `ele${year}`);
        })() : null);
        if (!electionMatch) throw new Error(`Catálogo sem eleição para ano ${year}, turno ${turn}, cargo ${code} e abrangência ${catalogUf}.`);
        let selectedMunicipality = null;
        if (isMunicipalCargo) {
          const electionPadded = String(electionMatch.cd).padStart(6, '0');
          requestStage = 'lista de municípios';
          requestUrl = freshUrl(`${resultBase(electionMatch.cycle)}/${electionMatch.cd}/config/mun-e${electionPadded}-cm.json`);
          const municipalityResponse = await fetch(requestUrl);
          if (!municipalityResponse.ok) throw new Error(`Lista de municípios do TSE indisponível (HTTP ${municipalityResponse.status}).`);
          const municipalityConfig = await municipalityResponse.json();
          if (!active) return;
          const area = (municipalityConfig?.abr || []).find(entry => String(entry.cd || entry.cdabr || entry.nmabr || entry.nm).toLowerCase() === uf.toLowerCase());
          const availableMunicipalities = (area?.mu || []).map(item => ({
            code: String(item.cd || item.cdi || '').padStart(5, '0'),
            name: item.nm || item.nm_municipio || item.nome || item.nmabr || '',
          })).filter(item => item.code && item.name).sort((a, b) => {
            const left = a.name.toLowerCase();
            const right = b.name.toLowerCase();
            return left < right ? -1 : left > right ? 1 : 0;
          });
          setMunicipalities(availableMunicipalities);
          selectedMunicipality = availableMunicipalities.find(item => item.code === municipality?.code) || null;
          if (!selectedMunicipality) {
            setMunicipality(null);
            if (!availableMunicipalities.length) throw new Error(`O TSE não publicou municípios para ${uf} nesta eleição.`);
            setElection({ code: electionMatch.cd, cycle: electionMatch.cycle });
            return;
          }
        } else {
          setMunicipalities([]);
          setMunicipality(null);
        }
        const candidateUrl = candidateFile(electionMatch.cycle, electionMatch.cd, candidateUf, code, selectedMunicipality?.code);
        requestStage = 'arquivo de resultados';
        requestUrl = freshUrl(candidateUrl);
        const [candidateResponse, progressResponse] = await Promise.all([
          fetch(requestUrl),
          isMunicipalCargo ? Promise.resolve(null) : fetch(freshUrl(progressFile(electionMatch.cycle, electionMatch.cd, candidateUf))).catch(() => null),
        ]);
        if (!candidateResponse.ok) throw new Error(`Arquivo de resultados do TSE indisponível (HTTP ${candidateResponse.status}).`);
        const candidateData = await candidateResponse.json();
        const progressData = progressResponse?.ok ? await progressResponse.json() : null;
        if (!active) return;
        const areaResult = candidateData?.abr?.[0];
        const selectedRace = (candidateData?.carg || []).find(item => String(item.cd) === code);
        const nominalCandidates = selectedRace
          ? (selectedRace.agr || []).flatMap(group => (group.par || []).flatMap(party => (party.cand || []).map(item => ({ ...item, sg: item.sg || party.sg, _partyName: party.nm }))))
          : areaResult?.cand || candidateData?.cand || candidateData?.candidatos || [];
        const rows = nominalCandidates.map(item => {
          const votes = cleanNumber(item.QT_VOTOS || item.vap);
          const percent = cleanNumber(item.PROP_VOTOS || item.pvap);
          return {
            id: item.SQ_CAND || item.sqcand || item.sqc || `${item.NM_URNA_CAND || item.nmu}-${item.NR_CAND || item.n}`,
            name: item.NM_URNA_CAND || item.NM_CAND || item.nmu || item.nm,
            number: item.NR_CAND || item.n,
            party: item.SG_PARTIDO || item.sgp || item.sg || item._partyName,
            votes,
            percent,
            elected: item.DS_SIT_TOT_TURNO || item.st,
          };
        }).filter(item => item.name).sort((a, b) => b.votes - a.votes);
        setCandidates(rows);
        setSummary(areaResult?.v || candidateData?.v || candidateData?.s || candidateData?.totais || areaResult || null);
        setProgress(areaResult?.s || candidateData?.s || progressData?.e || progressData?.s || progressData?.ab || areaResult || null);
        setElection({ code: electionMatch.cd, cycle: electionMatch.cycle });
        setError('');
        hasLoadedResults = true;
      } catch (loadError) {
        const message = `${requestStage}: ${loadError.message || 'não foi possível carregar os dados do TSE.'}${requestUrl ? `\n${requestUrl}` : ''}`;
        if (active && (initialLoad || !hasLoadedResults)) {
          console.error('[Apuracao TSE]', { stage: requestStage, url: requestUrl, error: loadError });
          setError(message);
        } else if (active) console.warn('Falha ao atualizar resultados do TSE; mantendo os dados já exibidos.', loadError);
      } finally {
        requestInFlight = false;
        if (active && initialLoad) setLoading(false);
      }
    };
    load(true);
    const refreshTimer = year > 2022 ? setInterval(() => load(false), 60_000) : null;
    return () => { active = false; if (refreshTimer) clearInterval(refreshTimer); };
  }, [year, turn, cargo, uf, electionType, apiCargo, isPresident, isMunicipalCargo, municipality?.code]);

  const normalizedMunicipalitySearch = municipalitySearch.trim().toLowerCase();
  const filteredMunicipalities = municipalities.filter(item => item.name.toLowerCase().includes(normalizedMunicipalitySearch));

  const winner = candidates[0];
  const validVotes = cleanNumber(summary?.VOTOS_VALIDOS || summary?.QT_VOTOS_VALIDOS || summary?.vv);
  const precinctCounted = progress?.SECOES_TOTALIZADAS || progress?.QT_SECOES_TOTALIZADAS || progress?.st;
  const precinctTotal = progress?.SECOES_APTAS || progress?.QT_SECOES_APTAS || progress?.sa || progress?.ts;
  const countedPercent = precinctTotal ? (cleanNumber(precinctCounted) / cleanNumber(precinctTotal)) * 100 : 0;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) + 12 }]}>
      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <View style={styles.eyebrow}><Vote size={18} color={colors.primary} /><Text style={[styles.eyebrowText, { color: colors.primary }]}>RESULTADOS OFICIAIS · TSE</Text></View>
        <Text style={[styles.title, { color: colors.headerText }]}>Apuração eleitoral</Text>
        <Text style={[styles.subtitle, { color: colors.headerText, opacity: 0.82 }]}>Consulte resultados eleitorais oficiais por ano, cargo, turno e estado.</Text>
      </View>

      <View style={[styles.controlsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>ANO DA ELEIÇÃO</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {YEAR_OPTIONS.map(option => (
            <TouchableOpacity key={option} style={[styles.chip, { backgroundColor: year === option ? colors.primary : colors.surfaceSecondary }]} onPress={() => setYear(option)}>
              <Text style={[styles.chipText, { color: year === option ? colors.onPrimary : colors.text }]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>CARGO</Text>
        <View style={styles.chipsRow}>
          {CARGO_OPTIONS.map(option => {
            const selected = cargo === option.label;
            const enabled = availableCargos.includes(option);
            return (
              <TouchableOpacity
                key={option.label}
                disabled={!enabled}
                accessibilityState={{ selected, disabled: !enabled }}
                style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.surfaceSecondary, opacity: enabled ? 1 : 0.42 }]}
                onPress={() => setCargo(option.label)}
              >
                <Text style={[styles.chipText, { color: selected ? colors.onPrimary : colors.text }]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[styles.availabilityNote, { color: colors.muted }]}>Os cargos disponíveis variam conforme o tipo de eleição do ano escolhido.</Text>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>TURNO</Text>
        <View style={styles.chipsRow}>
          {[1, 2].map(option => (
            <TouchableOpacity key={option} style={[styles.chip, { backgroundColor: turn === option ? colors.primary : colors.surfaceSecondary }]} onPress={() => setTurn(option)}>
              <Text style={[styles.chipText, { color: turn === option ? colors.onPrimary : colors.text }]}>{option}º turno</Text>
            </TouchableOpacity>
          ))}
        </View>
        {!isPresident && <>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>ESTADO</Text>
          <View style={styles.chipsRow}>
            {UF_OPTIONS.map(([code]) => (
              <TouchableOpacity key={code} style={[styles.ufChip, { backgroundColor: uf === code ? colors.primary : colors.surfaceSecondary }]} onPress={() => { setUf(code); setMunicipality(null); }}>
                <Text style={[styles.chipText, { color: uf === code ? colors.onPrimary : colors.text }]}>{code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>}
        {isMunicipalCargo && <>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>MUNICÍPIO</Text>
          <TouchableOpacity style={[styles.municipalityButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]} onPress={() => { setMunicipalitySearch(''); setMunicipalityPickerOpen(true); }}>
            <Text style={[styles.chipText, { color: colors.text }]}>{municipality?.name || 'Selecionar município'}</Text>
            <Text style={[styles.chipText, { color: colors.primary }]}>Alterar</Text>
          </TouchableOpacity>
        </>}
      </View>

      <View style={styles.resultHeading}>
        <View><Text style={[styles.eyebrowText, { color: colors.primary }]}>{year} · {turn}º TURNO</Text><Text style={[styles.resultTitle, { color: colors.text }]}>{cargo} · {isPresident ? 'Brasil' : isMunicipalCargo ? municipality?.name || currentUf : currentUf}</Text></View>
        <BarChart3 size={22} color={colors.primary} />
      </View>

      {loading ? <View style={[styles.stateCard, { backgroundColor: colors.surface }]}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.muted, { color: colors.muted }]}>Carregando dados oficiais do TSE…</Text></View> : isMunicipalCargo && !municipality && !error ? (
        <View style={[styles.stateCard, { backgroundColor: colors.surface }]}><Text style={[styles.errorTitle, { color: colors.text }]}>Escolha um município</Text><Text style={[styles.muted, { color: colors.muted }]}>Os resultados de prefeito e vereador são publicados por município.</Text><TouchableOpacity style={[styles.chip, { backgroundColor: colors.primary }]} onPress={() => setMunicipalityPickerOpen(true)}><Text style={[styles.chipText, { color: colors.onPrimary }]}>Selecionar município</Text></TouchableOpacity></View>
      ) : error ? (
        <View style={[styles.stateCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Resultado indisponível nesta rota</Text>
          <Text selectable style={[styles.muted, { color: colors.muted }]}>{error}</Text>
        </View>
      ) : candidates.length === 0 ? (
        <View style={[styles.stateCard, { backgroundColor: colors.surface }]}><Text style={[styles.errorTitle, { color: colors.text }]}>Sem dados publicados</Text><Text style={[styles.muted, { color: colors.muted }]}>O arquivo de resultados ainda não está disponível para esta combinação de ano, turno, cargo e estado.</Text></View>
      ) : <>
        {winner && <View style={[styles.winnerCard, { backgroundColor: colors.header }]}>
          <Text style={[styles.winnerLabel, { color: colors.primary }]}>DADOS DE TOTALIZAÇÃO · TSE</Text>
          <Text style={[styles.winnerName, { color: colors.headerText }]}>{formatNumber(candidates.length)} candidaturas</Text>
          {countedPercent > 0 && <Text style={[styles.mutedLight, { color: colors.headerText, opacity: 0.78 }]}>Seções totalizadas: {formatNumber(precinctCounted)} / {formatNumber(precinctTotal)} ({formatPercent(countedPercent)})</Text>}
        </View>}
        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.listTitle, { color: colors.text }]}>Votação nominal</Text>
          {candidates.map((item, index) => <View key={item.id} style={styles.candidateRow}>
            <Text style={[styles.rank, { backgroundColor: colors.surfaceSecondary, color: colors.text }]}>{index + 1}</Text>
            <View style={styles.candidateInfo}><Text style={[styles.candidateName, { color: colors.text }]}>{item.name}</Text><Text style={[styles.candidateMeta, { color: colors.muted }]}>{item.number} · {item.party}</Text></View>
            <View style={styles.voteInfo}><Text style={[styles.voteCount, { color: colors.text }]}>{formatNumber(item.votes)}</Text><Text style={[styles.votePercent, { color: colors.muted }]}>{formatPercent(item.percent)}</Text></View>
          </View>)}
          {validVotes > 0 && <Text style={[styles.footerNote, { color: colors.muted, borderTopColor: colors.border }]}>Votos válidos: {formatNumber(validVotes)}</Text>}
        </View>
      </>}

      <View style={styles.sourceRow}><Text style={[styles.sourceText, { color: colors.muted }]}>Fonte: arquivos públicos do Tribunal Superior Eleitoral. Os dados são apresentados sem projeções.{election ? ` Pleito ${election.code} · ${election.cycle}.` : ''}</Text></View>
      <Modal visible={municipalityPickerOpen} transparent animationType="fade" onRequestClose={() => setMunicipalityPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.pickerCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Escolha um município</Text>
            <TextInput value={municipalitySearch} onChangeText={setMunicipalitySearch} placeholder="Buscar município" placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.text, borderColor: colors.border }]} />
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.municipalityList}>
              {filteredMunicipalities.map(item => <TouchableOpacity key={item.code} style={[styles.municipalityOption, { borderBottomColor: colors.border }]} onPress={() => { setMunicipality(item); setMunicipalityPickerOpen(false); }}><Text style={[styles.chipText, { color: colors.text }]}>{item.name}</Text><Text style={[styles.candidateMeta, { color: colors.muted }]}>{item.code}</Text></TouchableOpacity>)}
            </ScrollView>
            <TouchableOpacity onPress={() => setMunicipalityPickerOpen(false)} style={styles.cancelButton}><Text style={[styles.chipText, { color: colors.primary }]}>Fechar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f4f7f8' },
  content: { padding: 20, paddingTop: 20, paddingBottom: 32 },
  header: { backgroundColor: '#101422', borderRadius: 24, padding: 22, marginBottom: 18 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  eyebrowText: { color: '#6ee794', fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: 'white', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#c4cbd4', fontSize: 14, lineHeight: 20 },
  controlsCard: { backgroundColor: 'white', borderRadius: 20, padding: 18, marginBottom: 24, borderWidth: StyleSheet.hairlineWidth },
  sectionLabel: { color: '#667085', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 14, marginBottom: 9 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, backgroundColor: '#f0f3f4' },
  ufChip: { width: 42, alignItems: 'center', paddingVertical: 9, borderRadius: 20, backgroundColor: '#f0f3f4' },
  availabilityNote: { fontSize: 12, lineHeight: 17, marginTop: 8 },
  municipalityButton: { minHeight: 42, borderRadius: 14, paddingHorizontal: 13, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'center', padding: 20 },
  pickerCard: { maxHeight: '78%', borderRadius: 22, padding: 18 },
  pickerTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  searchInput: { height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 10 },
  municipalityList: { flexGrow: 0 },
  municipalityOption: { minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  cancelButton: { alignSelf: 'flex-end', padding: 10, marginTop: 6 },
  chipSelected: { backgroundColor: '#101422' },
  chipText: { color: '#46505f', fontSize: 12, fontWeight: '700' },
  chipTextSelected: { color: '#6ee794' },
  resultHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingHorizontal: 2 },
  resultTitle: { color: '#101422', fontWeight: '800', fontSize: 22, marginTop: 5 },
  winnerCard: { backgroundColor: '#101422', borderRadius: 20, padding: 20, marginBottom: 14 },
  winnerLabel: { color: '#6ee794', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  winnerName: { color: 'white', fontSize: 24, fontWeight: '800', marginTop: 12 },
  mutedLight: { color: '#b9c2cd', fontSize: 12, marginTop: 8 },
  listCard: { backgroundColor: 'white', borderRadius: 20, padding: 18 },
  listTitle: { color: '#101422', fontWeight: '800', fontSize: 17, marginBottom: 8 },
  candidateRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#edf0f2', paddingVertical: 14, gap: 12 },
  rank: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', backgroundColor: '#eff4f1', color: '#243344', fontSize: 13, fontWeight: '800', paddingTop: 5 },
  candidateInfo: { flex: 1 },
  candidateName: { color: '#101422', fontSize: 13, fontWeight: '800' },
  candidateMeta: { color: '#7b8491', fontSize: 11, marginTop: 4 },
  voteInfo: { alignItems: 'flex-end' },
  voteCount: { color: '#101422', fontSize: 13, fontWeight: '800' },
  votePercent: { color: '#667085', fontSize: 11, marginTop: 4 },
  footerNote: { borderTopWidth: 1, borderTopColor: '#edf0f2', paddingTop: 12, color: '#667085', fontSize: 12 },
  stateCard: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: 'white', borderRadius: 20, padding: 24 },
  errorTitle: { color: '#101422', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  muted: { color: '#667085', fontSize: 13, textAlign: 'center', lineHeight: 19 },
  sourceRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 16, paddingHorizontal: 2 },
  sourceText: { flex: 1, color: '#8792a3', fontSize: 11, lineHeight: 16 },
});

