import * as fs from 'fs-extra';
import {
  ArtifactLocation,
  Log,
  Region,
  ReportingDescriptor,
  Result,
  Run,
} from 'sarif';

import {
  LogOptions,
  SarifResultOptions,
  SarifRuleOptions,
  SarifRunOptions,
} from '../types/node-sarif-builder';

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

  buildSarifJsonString(options = { indent: false }) {
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
}

// SARIF Run builder
export class SarifRunBuilder {
  // Default run value
  run: Run = {
    tool: {
      driver: {
        name:
          process.env.npm_package_name ||
          'SARIF_BUILDER_INVALID: Please send the tool name in SarifRunBuilder tool property, or call setToolName(name)',
        rules: [],
      },
    },
    results: [],
  };

  // Initialize SARIF Run builder
  constructor(options: SarifRunOptions = {}) {
    setOptionValues(options, this.run);
  }

  initSimple(options: { name: string; url?: string }) {
    this.setToolDriverName(options.name);
    if (options.url) {
      this.setToolDriverUri(options.url);
    }
  }

  addResult(sarifResultBuilder: SarifResultBuilder) {
    this.run.results.push(sarifResultBuilder.result);
  }

  setToolDriverName(name: string) {
    this.run.tool.driver.name = name;
  }
  setToolDriverUri(url: string) {
    this.run.tool.driver.informationUri = url;
  }
}

/*
  Rules describing any error that the linter can return
*/
export class SarifRuleBuilder {
  rule: ReportingDescriptor = {
    id: 'SARIF_BUILDER_INVALID: Please send the rule identifier in SarifRuleBuilder ruleId property, or call setRuleId(ruleId)',
  };

  // Initialize SARIF Run builder
  constructor(options: SarifRuleOptions = {}) {
    setOptionValues(options, this.rule);
  }

  initSimple(options: {
    ruleId: string;
    shortDescriptionText?: string;
    fullDescriptionText?: string;
    helpUri?: string;
  }) {
    this.setRuleId(options.ruleId);
    if (options.shortDescriptionText) {
      this.setShortDescriptionText(options.shortDescriptionText);
    }
    if (options.helpUri) {
      this.setHelpUri(options.helpUri);
    }
  }

  setRuleId(ruleId: string) {
    this.rule.id = ruleId;
  }

  setShortDescriptionText(text: string) {
    this.rule.shortDescription.text = text;
    this.rule.help;
  }

  setHelpUri(url: string) {
    this.rule.helpUri = url;
  }
}

export class SarifResultBuilder {
  // Default result value
  result: Result = {
    level: 'error',
    message: {},
    ruleId:
      'SARIF_BUILDER_INVALID: Please send the ruleId name in SarifResultBuilder tool property, or call setRuleId(ruleId)',
  };

  // Initialize SARIF Result builder
  constructor(options: SarifResultOptions = {}) {
    setOptionValues(options, this.result);
  }

  initSimple(options: {
    level: Result.level;
    messageText: string;
    ruleId: string;
    fileUri?: string;
    startLine?: number;
    startColumn?: number;
    endLine?: number;
    endColumn?: number;
  }) {
    this.setLevel(options.level);
    this.setMessageText(options.messageText);
    this.setRuleId(options.ruleId);
    if (options.fileUri) {
      this.setLocationArtifactUri({ uri: options.fileUri });
    }
    if (options.startLine !== null) {
      // Initialize Region with default values with necessary
      const region: Region = {
        startLine: options.startLine,
        startColumn: options.startColumn || 1,
        endLine: options.endLine || options.startLine,
        endColumn: options.endColumn || 1,
      };
      this.setLocationRegion(region);
    }
  }

  setLevel(level: Result.level) {
    this.result.level = level;
  }

  setMessageText(message: string) {
    this.result.message.text = message;
  }

  setRuleId(ruleId: string) {
    this.result.ruleId = ruleId;
  }

  setLocationRegion(region: Region) {
    this.manageInitPhysicalLocation();
    this.result.locations[0].physicalLocation.region = region;
  }

  setLocationArtifactUri(artifactLocation: ArtifactLocation) {
    this.manageInitPhysicalLocation();
    this.result.locations[0].physicalLocation.artifactLocation =
      artifactLocation;
  }

  private manageInitLocation() {
    if (this.result?.locations?.length) {
      return;
    }
    this.result.locations = [{}];
  }

  private manageInitPhysicalLocation() {
    this.manageInitLocation();
    if (this.result?.locations[0].physicalLocation) {
      return;
    }
    this.result.locations[0].physicalLocation = {};
  }
}

function setOptionValues(options, object: any) {
  for (const key of Object.keys(object)) {
    if (options[key] !== undefined) {
      object[key] = options[key];
    }
  }
  return object;
}
