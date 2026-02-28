import * as os from 'os';
import * as path from 'path';

import test from 'ava';
import * as fs from 'fs-extra';
import { Log } from 'sarif';

import { SarifBuilder } from './sarif-builder';
import { SarifResultBuilder } from './sarif-result-builder';
import { SarifRuleBuilder } from './sarif-rule-builder';
import { SarifRunBuilder } from './sarif-run-builder';

test('Create SarifBuilder', (t) => {
  const sarifBuilder = new SarifBuilder();
  t.assert(sarifBuilder !== null, 'SarifBuilder has been created');
});

test('Create SarifBuilder with args', (t) => {
  const sarifBuilder = new SarifBuilder({
    $schema: 'http://json.schemastore.org/sarif-2.1.0-rtm.3',
  });
  t.is(
    sarifBuilder.log.$schema,
    'http://json.schemastore.org/sarif-2.1.0-rtm.3',
  );
});

test('Create SarifRunBuilder', (t) => {
  const sarifBuilder = new SarifRunBuilder();
  t.assert(sarifBuilder != null, 'SarifRunBuilder has been created');
});

test('Create SarifRunBuilder and use initSimple', (t) => {
  const sarifRunBuilder = createInitSarifRunBuilder();
  t.assert(sarifRunBuilder != null, 'SarifRunBuilder has been created');
  t.is(sarifRunBuilder.run.tool.driver.name, 'MegaLinter');
});

test('Create SarifResultBuilder', (t) => {
  const sarifResultBuilder = new SarifResultBuilder();
  t.assert(sarifResultBuilder != null, 'SarifResultBuilder has been created');
});

test('Create SarifResultBuilder and set message', (t) => {
  const sarifResultBuilder = new SarifResultBuilder();
  sarifResultBuilder.setMessageText('MegaLinter message');
  t.assert(sarifResultBuilder != null, 'SarifResultBuilder has been created');
  t.is(sarifResultBuilder.result.message.text, 'MegaLinter message');
});

test('Create SarifResultBuilder and use initSimple', (t) => {
  const sarifResultBuilder = createInitSarifResultBuilder();
  t.assert(sarifResultBuilder != null, 'SarifResultBuilder has been created');
  t.is(
    sarifResultBuilder.result.message.text,
    'An assignment operator (=) was used in a conditional test. This is usually a typo, and the comparison operator (==) was intended.',
  );
  t.is(sarifResultBuilder.result.ruleId, 'AssignmentInConditional');
  t.is(
    sarifResultBuilder.result.locations[0].physicalLocation.artifactLocation
      .uri,
    'src/urf/wesh.js',
  );
  t.is(
    sarifResultBuilder.result.locations[0].physicalLocation.region.startLine,
    8,
  );
  t.is(
    sarifResultBuilder.result.locations[0].physicalLocation.region.startColumn,
    1,
  );
  t.is(
    sarifResultBuilder.result.locations[0].physicalLocation.region.endLine,
    8,
  );
  t.is(
    sarifResultBuilder.result.locations[0].physicalLocation.region.endColumn,
    1,
  );
});

test('Create SarifResultBuilder and generate file', (t) => {
  const sarifBuilder = new SarifBuilder();
  const sarifRunBuilder = createInitSarifRunBuilder();
  sarifRunBuilder.addRule(createInitSarifRuleBuilder());
  sarifRunBuilder.addRule(createInitSarifRuleBuilder2());
  sarifRunBuilder.addResult(createInitSarifResultBuilder());
  sarifRunBuilder.addResult(createInitSarifResultBuilder2());
  sarifBuilder.addRun(sarifRunBuilder);
  const outputFile = path.join(
    os.tmpdir(),
    'testSarifBuilder-' + Math.random() + '.sarif',
  );
  sarifBuilder.generateSarifFileSync(outputFile);
  t.assert(fs.existsSync(outputFile), 'Output SARIF file not found');
  const outputSarifObj: Log = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  t.assert(
    outputSarifObj?.runs?.length > 0,
    'No runs found in generated SARIF log',
  );
  t.assert(
    outputSarifObj?.runs[0].tool?.driver?.rules?.length > 1,
    'No rules found in generated SARIF log',
  );
  t.assert(
    outputSarifObj?.runs[0].artifacts.length > 0,
    'No artifacts found in generated SARIF log',
  );
  t.assert(
    outputSarifObj?.runs[0].results?.length > 1,
    'No results found in generated SARIF log',
  );
  t.assert(
    outputSarifObj?.runs[0].results[0].ruleIndex !== null,
    'Result rule index should be set',
  );
  t.assert(
    outputSarifObj?.runs[0].results[0]?.locations[0]?.physicalLocation
      ?.artifactLocation?.index !== null,
    'Result artifact index should be set',
  );
});

test('Create SarifResultBuilder with error', (t) => {
  let error = false;
  try {
    createInitSarifWrongResultBuilder();
  } catch (e) {
    error = true;
    console.log('Error: ' + e.message);
  }
  t.assert(error === true, 'Error should have been triggered');
});

test('Generate SARIF with multiple runs', (t) => {
  const sarifBuilder = new SarifBuilder();

  const runBuilder1 = createInitSarifRunBuilder();
  runBuilder1.addRule(createInitSarifRuleBuilder());
  runBuilder1.addResult(createInitSarifResultBuilder());
  sarifBuilder.addRun(runBuilder1);

  const runBuilder2 = new SarifRunBuilder();
  runBuilder2.initSimple({
    toolDriverName: 'AnotherTool',
    toolDriverVersion: '1.2.3',
  });
  runBuilder2.addRule(createInitSarifRuleBuilder2());
  runBuilder2.addResult(createInitSarifResultBuilder2());
  sarifBuilder.addRun(runBuilder2);

  const outputFile = path.join(
    os.tmpdir(),
    'testSarifBuilder-multi-run-' + Math.random() + '.sarif',
  );
  sarifBuilder.generateSarifFileSync(outputFile);

  const outputSarifObj: Log = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  t.is(outputSarifObj?.runs?.length, 2);
  t.is(outputSarifObj?.runs?.[0]?.tool?.driver?.name, 'MegaLinter');
  t.is(outputSarifObj?.runs?.[1]?.tool?.driver?.name, 'AnotherTool');
  t.is(outputSarifObj?.runs?.[0]?.results?.length, 1);
  t.is(outputSarifObj?.runs?.[1]?.results?.length, 1);
});

test('Generate SARIF with richer tool and result details', (t) => {
  const sarifBuilder = new SarifBuilder();
  const runBuilder = new SarifRunBuilder();
  runBuilder.initSimple({
    toolDriverName: 'DetailTool',
    toolDriverVersion: '9.9.9',
  });

  const ruleBuilder = new SarifRuleBuilder();
  ruleBuilder.initSimple({
    ruleId: 'RICH_RULE',
    shortDescriptionText: 'Short description',
    fullDescriptionText: 'Full description with more detail',
    helpUri: 'https://example.com/rules/RICH_RULE',
  });

  const resultBuilder = new SarifResultBuilder();
  resultBuilder.initSimple({
    level: 'error',
    messageText: 'Something went wrong',
    ruleId: 'RICH_RULE',
    fileUri: 'src/example/file.ts',
    startLine: 12,
  });

  runBuilder.addRule(ruleBuilder);
  runBuilder.addResult(resultBuilder);
  sarifBuilder.addRun(runBuilder);

  const outputFile = path.join(
    os.tmpdir(),
    'testSarifBuilder-detail-' + Math.random() + '.sarif',
  );
  sarifBuilder.generateSarifFileSync(outputFile);

  const outputSarifObj: Log = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  const run = outputSarifObj?.runs?.[0];

  t.is(run?.tool?.driver?.name, 'DetailTool');
  t.is(run?.tool?.driver?.version, '9.9.9');
  t.is(run?.tool?.driver?.rules?.[0]?.id, 'RICH_RULE');
  t.is(
    run?.tool?.driver?.rules?.[0]?.shortDescription?.text,
    'Short description',
  );
  t.is(
    run?.tool?.driver?.rules?.[0]?.fullDescription?.text,
    'Full description with more detail',
  );
  t.is(
    run?.tool?.driver?.rules?.[0]?.helpUri,
    'https://example.com/rules/RICH_RULE',
  );
  t.is(run?.results?.[0]?.level, 'error');
  t.is(run?.results?.[0]?.message?.text, 'Something went wrong');
  t.is(run?.results?.[0]?.ruleId, 'RICH_RULE');
  t.is(
    run?.results?.[0]?.locations?.[0]?.physicalLocation?.artifactLocation?.uri,
    'src/example/file.ts',
  );
  t.is(
    run?.results?.[0]?.locations?.[0]?.physicalLocation?.region?.startLine,
    12,
  );
});

test('Build SARIF JSON string with indent', (t) => {
  const sarifBuilder = new SarifBuilder();
  const runBuilder = createInitSarifRunBuilder();
  runBuilder.addRule(createInitSarifRuleBuilder());
  runBuilder.addResult(createInitSarifResultBuilder());
  sarifBuilder.addRun(runBuilder);

  const sarifJson = sarifBuilder.buildSarifJsonString({ indent: true });
  t.true(sarifJson.includes('\n  "runs"'));
});

test('Build SARIF JSON string throws on invalid markers', (t) => {
  const sarifBuilder = new SarifBuilder();
  const runBuilder = new SarifRunBuilder();
  runBuilder.setToolDriverName(
    'SARIF_BUILDER_INVALID: Please send the tool name in tool.driver.name property, or call setToolName(name)',
  );
  sarifBuilder.addRun(runBuilder);

  t.throws(() => sarifBuilder.buildSarifJsonString(), {
    message: /SARIF log is invalid/i,
  });
});

test('Generate SARIF file async', async (t) => {
  const sarifBuilder = new SarifBuilder();
  const sarifRunBuilder = createInitSarifRunBuilder();
  sarifRunBuilder.addRule(createInitSarifRuleBuilder());
  sarifRunBuilder.addResult(createInitSarifResultBuilder());
  sarifBuilder.addRun(sarifRunBuilder);

  const outputFile = path.join(
    os.tmpdir(),
    'testSarifBuilder-async-' + Math.random() + '.sarif',
  );
  await sarifBuilder.generateSarifFile(outputFile);
  t.true(fs.existsSync(outputFile));
});

test('Complete run fields adds artifacts and sets indexes', (t) => {
  const sarifBuilder = new SarifBuilder();
  const runBuilder = createInitSarifRunBuilder();

  const ruleA = new SarifRuleBuilder();
  ruleA.initSimple({
    ruleId: 'RuleA',
    shortDescriptionText: 'Rule A short',
  });
  const ruleB = new SarifRuleBuilder();
  ruleB.initSimple({
    ruleId: 'RuleB',
    shortDescriptionText: 'Rule B short',
  });

  const resultA = new SarifResultBuilder();
  resultA.initSimple({
    level: 'warning',
    messageText: 'Result A',
    ruleId: 'RuleA',
    fileUri: 'src/one.ts',
    startLine: 1,
  });
  const resultB = new SarifResultBuilder();
  resultB.initSimple({
    level: 'error',
    messageText: 'Result B',
    ruleId: 'RuleB',
    fileUri: 'src/two.js',
    startLine: 2,
  });

  runBuilder.addRule(ruleA);
  runBuilder.addRule(ruleB);
  runBuilder.addResult(resultA);
  runBuilder.addResult(resultB);

  runBuilder.run.artifacts = [
    {
      location: { uri: 'src/one.ts' },
      sourceLanguage: 'TypeScript',
    },
  ];

  sarifBuilder.addRun(runBuilder);
  const log = sarifBuilder.buildSarifOutput();
  const run = log.runs[0];

  t.is(run.artifacts?.length, 2);
  t.truthy(run.artifacts?.find((a) => a.location?.uri === 'src/one.ts'));
  t.truthy(run.artifacts?.find((a) => a.location?.uri === 'src/two.js'));
  t.is(run.artifacts?.[1]?.sourceLanguage, 'JavaScript');
  t.is(run.results?.[0]?.ruleIndex, 0);
  t.is(run.results?.[1]?.ruleIndex, 1);
  t.is(
    run.results?.[0]?.locations?.[0]?.physicalLocation?.artifactLocation?.index,
    0,
  );
  t.is(
    run.results?.[1]?.locations?.[0]?.physicalLocation?.artifactLocation?.index,
    1,
  );
});

test('SarifRunBuilder initSimple sets informationUri', (t) => {
  const runBuilder = new SarifRunBuilder();
  runBuilder.initSimple({
    toolDriverName: 'UriTool',
    toolDriverVersion: '1.0.0',
    url: 'https://example.com/tool',
  });
  t.is(runBuilder.run.tool.driver.informationUri, 'https://example.com/tool');
});

test('SarifRuleBuilder setFullDescriptionText initializes fullDescription', (t) => {
  const ruleBuilder = new SarifRuleBuilder();
  ruleBuilder.setFullDescriptionText('Full description text');
  t.is(ruleBuilder.rule.fullDescription?.text, 'Full description text');
});

test('SarifResultBuilder initSimple sets explicit region fields', (t) => {
  const resultBuilder = new SarifResultBuilder();
  resultBuilder.initSimple({
    level: 'note',
    messageText: 'Region detail',
    ruleId: 'RegionRule',
    fileUri: 'src/region.ts',
    startLine: 3,
    startColumn: 4,
    endLine: 5,
    endColumn: 6,
  });

  const region =
    resultBuilder.result.locations[0].physicalLocation.region || {};
  t.is(region.startLine, 3);
  t.is(region.startColumn, 4);
  t.is(region.endLine, 5);
  t.is(region.endColumn, 6);
});

function createInitSarifRunBuilder() {
  const sarifRunBuilder = new SarifRunBuilder();
  sarifRunBuilder.initSimple({
    toolDriverName: 'MegaLinter',
    toolDriverVersion: '5.5.0',
  });
  return sarifRunBuilder;
}

function createInitSarifResultBuilder() {
  const sarifResultBuilder = new SarifResultBuilder();
  sarifResultBuilder.initSimple({
    level: 'warning',
    messageText:
      'An assignment operator (=) was used in a conditional test. This is usually a typo, and the comparison operator (==) was intended.',
    ruleId: 'AssignmentInConditional',
    fileUri: 'src/urf/wesh.js',
    startLine: 8,
  });
  return sarifResultBuilder;
}

function createInitSarifResultBuilder2() {
  const sarifResultBuilder = new SarifResultBuilder();
  sarifResultBuilder.initSimple({
    level: 'warning',
    messageText: 'Nooo no any !',
    ruleId: 'NoAny',
    fileUri: 'src/urf/wesh.js',
    startLine: 8,
  });
  return sarifResultBuilder;
}

function createInitSarifWrongResultBuilder() {
  const sarifResultBuilder = new SarifResultBuilder();
  sarifResultBuilder.initSimple({
    level: 'warning',
    messageText: 'some code used = , you may should have used ==',
    ruleId: 'AssignmentInConditional',
    fileUri: 'src/urf/wesh.js',
    startLine: 0,
  });
  return sarifResultBuilder;
}

function createInitSarifRuleBuilder() {
  const sarifRuleBuilder = new SarifRuleBuilder();
  sarifRuleBuilder.initSimple({
    ruleId: 'AssignmentInConditional',
    shortDescriptionText:
      'This is wrong, that should not happenAn assignment operator (=) was used in a conditional test. This is usually a typo, and the comparison operator (==) was intended.',
    fullDescriptionText:
      'Change something in your code and this rule will not be triggered !',
    helpUri:
      'https://codenarc.org/codenarc-rules-basic.html#AssignmentInConditional',
  });
  return sarifRuleBuilder;
}

function createInitSarifRuleBuilder2() {
  const sarifRuleBuilder = new SarifRuleBuilder();
  sarifRuleBuilder.initSimple({
    ruleId: 'NoAny',
    shortDescriptionText: 'Nooo no no, any are not good !',
    helpUri: 'https://codenarc.org/codenarc-rules-basic.html#NoAny',
  });
  return sarifRuleBuilder;
}
