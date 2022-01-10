import * as fs from 'fs-extra';
import { Log, Run } from 'sarif';

import { LogOptions } from '../types/node-sarif-builder';

import { SarifRunBuilder } from './sarif-run-builder';
import { setOptionValues } from './utils';

// SARIF Builder
export class SarifBuilder {
  // Default run value
  log: Log = {
    $schema: 'http://json.schemastore.org/sarif-2.1.0-rtm.4',
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
    this.log.runs = this.log.runs.map(run => this.completeRunFields(run));
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
        'Your SARIF log is invalid, please solve SARIF_BUILDER_INVALID messages'
      );
    }
    return sarifJson;
  }

  completeRunFields(run: Run): Run {
    // Collect all missing artifacts from results
    run.artifacts = run.artifacts || [];
    for (const result of run.results) {
      for (const location of result.locations || []) {
        if (location?.physicalLocation?.artifactLocation?.uri &&
          run.artifacts.filter(artifact => artifact?.location?.uri === location.physicalLocation.artifactLocation.uri).length === 0) {
          // Add result to driver artifact only if not existing 
          run.artifacts.push(location.physicalLocation.artifactLocation);
        }
      }
    }
    // Build artifacts indexes
    const artifactIndexes = Object.fromEntries(run.artifacts.map((artifact, index) => {
      return [artifact?.location?.uri, index];
    }));
    // Build rules indexes
    const rulesIndexes = Object.fromEntries((run?.tool?.driver?.rules || []).map((rule, index) => {
      return [rule.id, index];
    }));

    // Update index in results with computed values
    run.results = run.results.map(result => {
      // Set rule index in results
      if (rulesIndexes[result.ruleId]) {
        result.ruleIndex = rulesIndexes[result.ruleId]
      }
      // Set artifact index in results
      if (result.locations) {
        result.locations = result.locations.map(location => {
          const uri = location?.physicalLocation?.artifactLocation?.uri;
          if (uri && artifactIndexes[uri] !== undefined && artifactIndexes[uri] !== null) {
            location.physicalLocation.artifactLocation.index = artifactIndexes[uri];
          }
          return location;
        });
      }
      return result;
    })

    return run;
  }
}




