# Base histórica do TSE

O app consulta os resultados históricos pela Cloud Function `tseHistoricalResults`. A função lê CSVs compactados do bucket Firebase Storage e grava respostas consolidadas em `tseHistoricalStaticCache` no Firestore. Assim, consultas do app não baixam os arquivos brutos do TSE.

## Recortes municipais

O acervo municipal inclui 2012, 2014, 2016, 2018, 2020 e 2022. O gerador também aceita 2024. A eleição de 2026 continua usando os JSONs oficiais de divulgação do TSE.

## Fontes

Os arquivos municipais são gerados a partir dos conjuntos oficiais `votacao_candidato_munzona` e `votacao_partido_munzona`, que contêm votos nominais por município e zona e votos válidos de legenda. Presidente é extraído do CSV nacional `BRASIL`; os outros cargos são extraídos do CSV de cada UF.

## Regerar a base

```sh
python3 scripts/build_tse_historical.py --years 2012 2014 2016 2018 2020 2022 2024 --output-dir /private/tmp/tse-output
gcloud storage rsync --recursive /private/tmp/tse-output gs://oassessor-blu.firebasestorage.app/tse-historical
```

Depois de atualizar os arquivos, limpe os documentos antigos da coleção `tseHistoricalStaticCache` ou altere seu namespace antes de publicar. A função lê os arquivos em `tse-historical/{ano}/{UF}.csv.gz` e `tse-historical/{ano}/BR.csv.gz`.

## Zona, local e seção

Esses recortes usam o conjunto oficial `votacao_secao` do TSE. O gerador consolida votos de candidaturas por município, zona, local de votação e seção. Gere e envie os arquivos por partes para não exigir espaço para todo o acervo ao mesmo tempo:

```sh
python3 scripts/build_tse_territorial.py --years 2022 --ufs CE --output-dir /private/tmp/tse-territorial-output
gcloud storage rsync --recursive /private/tmp/tse-territorial-output gs://oassessor-blu.firebasestorage.app/tse-territorial
```

Repita para os anos e UFs necessários. A Cloud Function procura `tse-territorial/{ano}/{UF}.csv.gz`. Os anos de 2012 a 2024 são aceitos pelo gerador; a eleição de 2026 só poderá oferecer esses recortes quando o TSE publicar o arquivo oficial correspondente. A base não infere bairro a partir do endereço do local de votação.
