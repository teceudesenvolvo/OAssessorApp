# Base histórica do TSE

O app consulta os resultados históricos pela Cloud Function `tseHistoricalResults`. A função lê CSVs compactados do bucket Firebase Storage e grava respostas consolidadas em `tseHistoricalStaticCache` no Firestore. Assim, consultas do app não baixam os arquivos brutos do TSE.

## Anos preparados

2012, 2014, 2016, 2018, 2020 e 2022. Resultados de 2024 e 2026 continuam usando os JSONs de divulgação do TSE.

## Fontes

Os arquivos foram gerados a partir dos conjuntos oficiais `votacao_candidato_munzona` e `votacao_partido_munzona`, que contêm votos nominais por município e zona e votos válidos de legenda. O processamento soma as zonas por município/cargo/turno/candidatura. Presidente é extraído do CSV nacional `BRASIL`; os outros cargos são extraídos do CSV de cada UF.

## Regerar a base

```sh
python3 scripts/build_tse_historical.py --years 2012 2014 2016 2018 2020 2022 --output-dir /private/tmp/tse-output
gcloud storage rsync --recursive /private/tmp/tse-output gs://oassessor-blu.firebasestorage.app/tse-historical
```

Depois de atualizar os arquivos, limpe os documentos antigos da coleção `tseHistoricalStaticCache` ou altere seu namespace antes de publicar. A função lê os arquivos em `tse-historical/{ano}/{UF}.csv.gz` e `tse-historical/{ano}/BR.csv.gz`.
