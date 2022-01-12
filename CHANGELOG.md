# Changelog

## UNRELEASED

- Add your updates here :)

## [2.0.0] 2022-01-12

- Mandatory properties `toolDriverName` and `toolDriverVersion` for SarifRunBuilder
- Change default schema version to https://docs.oasis-open.org/sarif/sarif/v2.1.0/cos02/schemas/sarif-schema-2.1.0
- When possible, automatically populate SARIF properties:
    - `artifact.sourceLanguage`
    - `result.locations.location.physicalLocation.artifactLocation.index`
    - `result.ruleIndex`
- Fix bug when initSimple is called without region properties

## [1.0.0] 2022-01-11

- Initial version
