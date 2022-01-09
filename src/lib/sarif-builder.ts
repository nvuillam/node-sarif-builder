import { Log, Run } from 'sarif';

import { LogOptions, RunOptions } from '../types/node-sarif-builder';

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
}

// SARIF Run builder
export class SarifRunBuilder {
  // Default run value
  run: Run = {
    tool: {
      driver: {
        name:
          process.env.npm_package_name ||
          'ERROR: Please send the tool name in SarifRunBuilder tool property',
      },
    },
  };

  // Initialize SARIF Run builder
  constructor(options: RunOptions = {}) {
    setOptionValues(options, this.run);
  }

  setToolName(name: string) {
    this.run.tool.driver.name = name;
  }
}

function setOptionValues(options, object: any) {
  for (const key in Object.keys(options)) {
    object[key] = options[key];
  }
  return object;
}
