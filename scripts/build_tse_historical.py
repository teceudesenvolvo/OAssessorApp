#!/usr/bin/env python3
"""Download and consolidate official TSE candidate and party vote archives.

Outputs one compressed CSV per year/UF under functions/tse-data. Candidate and
party votes are aggregated by turn, cargo, municipality and candidate so the
app endpoint never downloads or scans the raw TSE archives at request time.
"""

import argparse
import csv
import gzip
import io
import subprocess
import zipfile
from collections import defaultdict
from pathlib import Path

YEARS = (2012, 2014, 2016, 2018, 2020, 2022)
UFS = ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO')
CDN = 'https://cdn.tse.jus.br/estatistica/sead/odsele'
FIELDS = ('turn', 'cargoCode', 'municipalityCode', 'municipalityName', 'candidateId', 'candidateNumber', 'name', 'party', 'votes', 'validVotes', 'status')


def download(url: str, destination: Path) -> None:
    if destination.exists() and destination.stat().st_size:
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    temp = destination.with_suffix(destination.suffix + '.part')
    print(f'Downloading {url}', flush=True)
    subprocess.run(['curl', '-fL', '--retry', '2', '--max-time', '300', url, '-o', str(temp)], check=True)
    temp.replace(destination)


def number(value) -> int:
    try:
        return int(float(str(value or '0').strip().replace(',', '.')))
    except ValueError:
        return 0


def clean(value) -> str:
    value = str(value or '').strip()
    return '' if value in ('#NULO', '#NULO#', 'NULO') else value


def member_for(zf: zipfile.ZipFile, uf: str) -> str:
    candidates = [name for name in zf.namelist() if name.lower().endswith('.csv') and name.upper().endswith(f'_{uf}.CSV')]
    return candidates[0] if candidates else ''


def rows_for(zf: zipfile.ZipFile, member: str):
    binary = zf.open(member)
    text = io.TextIOWrapper(binary, encoding='latin1', newline='')
    return csv.DictReader(text, delimiter=';', quotechar='"')


def build_year(year: int, source_dir: Path, output_dir: Path) -> None:
    candidates_path = source_dir / f'votacao_candidato_munzona_{year}.zip'
    parties_path = source_dir / f'votacao_partido_munzona_{year}.zip'
    download(f'{CDN}/votacao_candidato_munzona/votacao_candidato_munzona_{year}.zip', candidates_path)
    download(f'{CDN}/votacao_partido_munzona/votacao_partido_munzona_{year}.zip', parties_path)
    year_dir = output_dir / str(year)
    year_dir.mkdir(parents=True, exist_ok=True)

    for uf in UFS:
        candidate_totals = {}
        municipality_names = {}
        party_totals = defaultdict(int)
        valid_nominal_totals = defaultdict(int)

        with zipfile.ZipFile(candidates_path) as candidate_zip:
            member = member_for(candidate_zip, uf)
            for row in rows_for(candidate_zip, member) if member else ():
                turn = number(row.get('NR_TURNO'))
                cargo = number(row.get('CD_CARGO'))
                municipality = str(number(row.get('CD_MUNICIPIO'))).zfill(5)
                if not turn or not cargo or not municipality:
                    continue
                municipality_names[municipality] = clean(row.get('NM_MUNICIPIO'))
                votes = number(row.get('QT_VOTOS_NOMINAIS_VALIDOS') or row.get('QT_VOTOS_NOMINAIS'))
                valid_key = (turn, cargo, municipality)
                valid_nominal_totals[valid_key] += votes
                sq = clean(row.get('SQ_CANDIDATO')) or f"{row.get('NR_CANDIDATO', '')}_{row.get('NM_URNA_CANDIDATO', '')}"
                key = (*valid_key, sq)
                if key not in candidate_totals:
                    candidate_totals[key] = {
                        'turn': turn, 'cargoCode': cargo, 'municipalityCode': municipality,
                        'municipalityName': municipality_names[municipality], 'candidateId': sq,
                        'candidateNumber': clean(row.get('NR_CANDIDATO')),
                        'name': clean(row.get('NM_URNA_CANDIDATO') or row.get('NM_CANDIDATO')),
                        'party': clean(row.get('SG_PARTIDO')), 'votes': 0,
                        'status': clean(row.get('DS_SIT_TOT_TURNO')),
                    }
                candidate_totals[key]['votes'] += votes

        with zipfile.ZipFile(parties_path) as party_zip:
            member = member_for(party_zip, uf)
            for row in rows_for(party_zip, member) if member else ():
                turn = number(row.get('NR_TURNO'))
                cargo = number(row.get('CD_CARGO'))
                municipality = str(number(row.get('CD_MUNICIPIO'))).zfill(5)
                if not turn or not cargo or not municipality:
                    continue
                valid_legenda = row.get('QT_TOTAL_VOTOS_LEG_VALIDOS')
                if valid_legenda in (None, ''):
                    valid_legenda = number(row.get('QT_VOTOS_LEGENDA_VALIDOS')) + number(row.get('QT_VOTOS_NOM_CONVR_LEG_VALIDOS'))
                else:
                    valid_legenda = number(valid_legenda)
                key = (turn, cargo, municipality)
                party_totals[key] += valid_legenda

        destination = year_dir / f'{uf}.csv.gz'
        with gzip.open(destination, 'wt', encoding='utf-8', newline='') as output:
            writer = csv.DictWriter(output, fieldnames=FIELDS)
            writer.writeheader()
            for key, row in candidate_totals.items():
                row['validVotes'] = valid_nominal_totals[key[:3]] + party_totals[key[:3]]
                writer.writerow(row)
        print(f'{year} {uf}: {len(candidate_totals):,} candidate/municipality rows -> {destination.stat().st_size:,} bytes', flush=True)

    # National presidential results are published only in BRASIL members; the
    # UF member CSVs contain state/municipal races but omit cargo 1.
    br_path = year_dir / 'BR.csv.gz'
    by_candidate = defaultdict(lambda: {'row': None, 'votes': 0})
    valid_national = defaultdict(int)
    with zipfile.ZipFile(candidates_path) as candidate_zip:
        member = next((n for n in candidate_zip.namelist() if n.lower().endswith('_brasil.csv')), '')
        for row in rows_for(candidate_zip, member) if member else ():
            if number(row.get('CD_CARGO')) != 1:
                continue
            turn = number(row.get('NR_TURNO'))
            municipality = str(number(row.get('CD_MUNICIPIO'))).zfill(5)
            candidate_id = clean(row.get('SQ_CANDIDATO')) or f"{row.get('NR_CANDIDATO', '')}_{row.get('NM_URNA_CANDIDATO', '')}"
            votes = number(row.get('QT_VOTOS_NOMINAIS_VALIDOS') or row.get('QT_VOTOS_NOMINAIS'))
            key = (turn, municipality, candidate_id)
            if by_candidate[key]['row'] is None:
                by_candidate[key]['row'] = {
                    'turn': turn, 'cargoCode': 1, 'municipalityCode': municipality,
                    'municipalityName': clean(row.get('NM_MUNICIPIO')), 'candidateId': candidate_id,
                    'candidateNumber': clean(row.get('NR_CANDIDATO')),
                    'name': clean(row.get('NM_URNA_CANDIDATO') or row.get('NM_CANDIDATO')),
                    'party': clean(row.get('SG_PARTIDO')), 'votes': 0,
                    'validVotes': 0, 'status': clean(row.get('DS_SIT_TOT_TURNO')),
                }
            by_candidate[key]['votes'] += votes
            valid_national[(turn, municipality)] += votes
    party_votes = defaultdict(int)
    with zipfile.ZipFile(parties_path) as party_zip:
        member = next((n for n in party_zip.namelist() if n.lower().endswith('_brasil.csv')), '')
        for row in rows_for(party_zip, member) if member else ():
            if number(row.get('CD_CARGO')) != 1:
                continue
            turn = number(row.get('NR_TURNO'))
            municipality = str(number(row.get('CD_MUNICIPIO'))).zfill(5)
            valid_legenda = row.get('QT_TOTAL_VOTOS_LEG_VALIDOS')
            if valid_legenda in (None, ''):
                valid_legenda = number(row.get('QT_VOTOS_LEGENDA_VALIDOS')) + number(row.get('QT_VOTOS_NOM_CONVR_LEG_VALIDOS'))
            party_votes[(turn, municipality)] += number(valid_legenda)
    with gzip.open(br_path, 'wt', encoding='utf-8', newline='') as output:
        writer = csv.DictWriter(output, fieldnames=FIELDS)
        writer.writeheader()
        for (turn, municipality, _candidate_id), value in by_candidate.items():
            row = dict(value['row'])
            row['turn'] = turn
            row['cargoCode'] = 1
            row['candidateId'] = _candidate_id
            row['votes'] = value['votes']
            row['validVotes'] = valid_national[(turn, municipality)] + party_votes[(turn, municipality)]
            writer.writerow(row)
    print(f'{year} BR president: {len(by_candidate):,} rows -> {br_path.stat().st_size:,} bytes', flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--years', nargs='*', type=int, default=list(YEARS))
    parser.add_argument('--source-dir', type=Path, default=Path('/private/tmp/tse-source'))
    parser.add_argument('--output-dir', type=Path, default=Path('/private/tmp/tse-output'))
    args = parser.parse_args()
    bad = set(args.years) - set(YEARS)
    if bad:
        parser.error(f'unsupported years: {sorted(bad)}')
    for year in args.years:
        build_year(year, args.source_dir, args.output_dir)


if __name__ == '__main__':
    main()
