#!/usr/bin/env python3
"""Build official TSE vote results at municipality, zone, polling-place and section levels."""
import argparse
import csv
import gzip
import io
import subprocess
import zipfile
from collections import defaultdict
from pathlib import Path

YEARS = (2012, 2014, 2016, 2018, 2020, 2022, 2024)
UFS = ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO')
CDN = 'https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao'
FIELDS = ('turn', 'cargoCode', 'municipalityCode', 'municipalityName', 'zoneCode', 'locationCode', 'locationName', 'sectionCode', 'candidateId', 'candidateNumber', 'name', 'party', 'votes')


def number(value):
    try:
        return int(float(str(value or '0').strip().replace(',', '.')))
    except ValueError:
        return 0


def clean(value):
    value = str(value or '').strip()
    return '' if value in ('#NULO', '#NULO#', 'NULO') else value


def download(url, destination):
    if destination.exists() and destination.stat().st_size:
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    temp = destination.with_suffix(destination.suffix + '.part')
    print(f'Downloading {url}', flush=True)
    subprocess.run(['curl', '-fL', '--retry', '2', '--max-time', '600', url, '-o', str(temp)], check=True)
    temp.replace(destination)


def source_member(archive, year, uf):
    csvs = [name for name in archive.namelist() if name.lower().endswith('.csv')]
    return next((name for name in csvs if f'_{uf}'.lower() in name.lower()), csvs[0] if csvs else '')


def rows_for(archive, member):
    with archive.open(member) as binary:
        text = io.TextIOWrapper(binary, encoding='latin1', newline='')
        yield from csv.DictReader(text, delimiter=';', quotechar='"')


def build(year, uf, source_dir, output_dir):
    archive_path = source_dir / f'votacao_secao_{year}_{uf}.zip'
    download(f'{CDN}/votacao_secao_{year}_{uf}.zip', archive_path)
    totals = defaultdict(int)
    metadata = {}
    with zipfile.ZipFile(archive_path) as archive:
        member = source_member(archive, year, uf)
        if not member:
            raise RuntimeError(f'CSV de votação por seção ausente: {year}/{uf}')
        for row in rows_for(archive, member):
            turn = number(row.get('NR_TURNO'))
            cargo = number(row.get('CD_CARGO'))
            municipality = str(number(row.get('CD_MUNICIPIO'))).zfill(5)
            zone = str(number(row.get('NR_ZONA'))).zfill(4)
            section = str(number(row.get('NR_SECAO'))).zfill(4)
            location = str(number(row.get('NR_LOCAL_VOTACAO'))).zfill(4)
            # Ignore blank, null and invalid vote buckets. These are not
            # candidacies and must not appear as candidates in the results.
            candidate_id = clean(row.get('SQ_CANDIDATO'))
            votes = number(row.get('QT_VOTOS'))
            name = clean(row.get('NM_VOTAVEL'))
            if not (turn and cargo and municipality and zone and section and location and candidate_id and name):
                continue
            key = (turn, cargo, municipality, zone, location, section, candidate_id)
            totals[key] += votes
            metadata[key] = {
                'turn': turn, 'cargoCode': cargo, 'municipalityCode': municipality,
                'municipalityName': clean(row.get('NM_MUNICIPIO')), 'zoneCode': zone,
                'locationCode': location, 'locationName': clean(row.get('NM_LOCAL_VOTACAO')),
                'sectionCode': section, 'candidateId': candidate_id,
                'candidateNumber': clean(row.get('NR_VOTAVEL')), 'name': name,
                'party': clean(row.get('SG_PARTIDO')),
            }
    destination = output_dir / str(year) / f'{uf}.csv.gz'
    destination.parent.mkdir(parents=True, exist_ok=True)
    with gzip.open(destination, 'wt', encoding='utf-8', newline='') as output:
        writer = csv.DictWriter(output, fieldnames=FIELDS)
        writer.writeheader()
        for key, votes in totals.items():
            row = metadata[key]
            row['votes'] = votes
            writer.writerow(row)
    print(f'{year} {uf}: {len(totals):,} territorial rows -> {destination.stat().st_size:,} bytes', flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--years', nargs='*', type=int, default=list(YEARS))
    parser.add_argument('--ufs', nargs='*', default=[*UFS, 'BR'])
    parser.add_argument('--source-dir', type=Path, default=Path('/private/tmp/tse-territorial-source'))
    parser.add_argument('--output-dir', type=Path, default=Path('/private/tmp/tse-territorial-output'))
    args = parser.parse_args()
    if set(args.years) - set(YEARS):
        parser.error(f'unsupported years: {sorted(set(args.years) - set(YEARS))}')
    if set(args.ufs) - {*UFS, 'BR'}:
        parser.error(f'unsupported UFs: {sorted(set(args.ufs) - {*UFS, "BR"})}')
    for year in args.years:
        for uf in args.ufs:
            if uf == 'BR' and year % 4 == 0:
                continue
            build(year, uf, args.source_dir, args.output_dir)


if __name__ == '__main__':
    main()
