import * as fs from 'fs-extra';
import { Log, Run } from 'sarif';

import { LogOptions } from '../types/node-sarif-builder';

import { EXTENSIONS_LANGUAGES } from './languages';
import { SarifRunBuilder } from './sarif-run-builder';
import { setOptionValues } from './utils';

// SARIF Builder
export class SarifBuilder {
  // Default run value
  log: Log = {
    $schema: 'http://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [],
  };

  // Initialize SARIF Log builder
  constructor(options: LogOptions = {}) {
    setOptionValues(options, this.log);
  }

  addRun(sarifRunBuilder: SarifRunBuilder) {
    this.log.runs.push(sarifRunBuilder.run);
  }

  generateSarifFileSync(file: string) {
    const sarifJsonString = this.buildSarifJsonString();
    fs.writeFileSync(file, sarifJsonString, 'utf8');
  }

  async generateSarifFile(file: string) {
    const sarifJsonString = this.buildSarifJsonString();
    await fs.writeFile(file, sarifJsonString, 'utf8');
  }

  buildSarifOutput() {
    // Complete runs
    this.log.runs = this.log.runs.map((run) => this.completeRunFields(run));
    return this.log;
  }

  // Build final sarif json, complete when possible
  buildSarifJsonString(options = { indent: false }) {
    this.buildSarifOutput();
    const sarifJson = options.indent
      ? JSON.stringify(this.log, null, 2)
      : JSON.stringify(this.log);
    if (sarifJson.includes('SARIF_BUILDER_INVALID')) {
      throw new Error(
        'Your SARIF log is invalid, please solve SARIF_BUILDER_INVALID messages',
      );
    }
    return sarifJson;
  }

  completeRunFields(run: Run): Run {
    // Collect all missing artifacts from results
    run.artifacts = run.artifacts || [];
    const existingArtifactUris = new Set(
      run.artifacts.map((a) => a?.location?.uri).filter(Boolean),
    );

    for (const result of run.results || []) {
      for (const location of result.locations || []) {
        const uri = location?.physicalLocation?.artifactLocation?.uri;
        if (uri && !existingArtifactUris.has(uri)) {
          // Add result to driver artifact only if not existing
          const lastDot = uri.lastIndexOf('.');
          const ext = lastDot !== -1 ? uri.slice(lastDot + 1) : '';
          const language = EXTENSIONS_LANGUAGES[ext] || 'unknown';
          run.artifacts.push({
            sourceLanguage: language,
            location: { uri },
          });
          existingArtifactUris.add(uri);
        }
      }
    }

    // Build artifact index map (uri -> index) for O(1) lookups
    const artifactIndexMap = new Map<string, number>();
    run.artifacts.forEach((artifact, index) => {
      const uri = artifact?.location?.uri;
      if (uri) {
        artifactIndexMap.set(uri, index);
      }
    });

    // Build rules index map (id -> index) for O(1) lookups
    const rulesIndexMap = new Map<string, number>();
    (run?.tool?.driver?.rules || []).forEach((rule, index) => {
      rulesIndexMap.set(rule.id, index);
    });

    // Update index in results with computed values
    for (const result of run.results || []) {
      // Set rule index in results
      const ruleIndex = rulesIndexMap.get(result.ruleId);
      if (ruleIndex !== undefined) {
        result.ruleIndex = ruleIndex;
      }
      // Set artifact index in results
      if (result.locations) {
        for (const location of result.locations) {
          const uri = location?.physicalLocation?.artifactLocation?.uri;
          if (uri) {
            const artIndex = artifactIndexMap.get(uri);
            if (artIndex !== undefined) {
              location.physicalLocation.artifactLocation.index = artIndex;
            }
          }
        }
      }
    }

    return run;
  }
}
