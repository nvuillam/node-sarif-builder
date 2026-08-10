import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';

import { Log } from 'sarif';

import { SarifBuilder } from './sarif-builder';
import { SarifResultBuilder } from './sarif-result-builder';
import { SarifRuleBuilder } from './sarif-rule-builder';
import { SarifRunBuilder } from './sarif-run-builder';

test('Create SarifBuilder', () => {
  const sarifBuilder = new SarifBuilder();
  assert.ok(sarifBuilder !== null, 'SarifBuilder has been created');
});

test('Create SarifBuilder with args', () => {
  const sarifBuilder = new SarifBuilder({
    $schema: 'http://json.schemastore.org/sarif-2.1.0-rtm.3',
  });
  assert.strictEqual(
    sarifBuilder.log.$schema,
    'http://json.schemastore.org/sarif-2.1.0-rtm.3',
  );
});

test('Create SarifRunBuilder', () => {
  const sarifBuilder = new SarifRunBuilder();
  assert.ok(sarifBuilder != null, 'SarifRunBuilder has been created');
});

test('Create SarifRunBuilder and use initSimple', () => {
  const sarifRunBuilder = createInitSarifRunBuilder();
  assert.ok(sarifRunBuilder != null, 'SarifRunBuilder has been created');
  assert.strictEqual(sarifRunBuilder.run.tool.driver.name, 'MegaLinter');
});

test('Create SarifResultBuilder', () => {
  const sarifResultBuilder = new SarifResultBuilder();
  assert.ok(sarifResultBuilder != null, 'SarifResultBuilder has been created');
});

test('Create SarifResultBuilder and set message', () => {
  const sarifResultBuilder = new SarifResultBuilder();
  sarifResultBuilder.setMessageText('MegaLinter message');
  assert.ok(sarifResultBuilder != null, 'SarifResultBuilder has been created');
  assert.strictEqual(
    sarifResultBuilder.result.message.text,
    'MegaLinter message',
  );
});

test('Create SarifResultBuilder and use initSimple', () => {
  const sarifResultBuilder = createInitSarifResultBuilder();
  assert.ok(sarifResultBuilder != null, 'SarifResultBuilder has been created');
  assert.strictEqual(
    sarifResultBuilder.result.message.text,
    'An assignment operator (=) was used in a conditional test. This is usually a typo, and the comparison operator (==) was intended.',
  );
  assert.strictEqual(
    sarifResultBuilder.result.ruleId,
    'AssignmentInConditional',
  );
  assert.strictEqual(
    sarifResultBuilder.result.locations![0].physicalLocation!.artifactLocation!
      .uri,
    'src/urf/wesh.js',
  );
  assert.strictEqual(
    sarifResultBuilder.result.locations![0].physicalLocation!.region!.startLine,
    8,
  );
  assert.strictEqual(
    sarifResultBuilder.result.locations![0].physicalLocation!.region!
      .startColumn,
    1,
  );
  assert.strictEqual(
    sarifResultBuilder.result.locations![0].physicalLocation!.region!.endLine,
    8,
  );
  assert.strictEqual(
    sarifResultBuilder.result.locations![0].physicalLocation!.region!.endColumn,
    1,
  );
});

test('Create SarifResultBuilder and generate file', () => {
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
  assert.ok(existsSync(outputFile), 'Output SARIF file not found');
  const outputSarifObj: Log = JSON.parse(readFileSync(outputFile, 'utf8'));
  assert.ok(
    outputSarifObj?.runs?.length > 0,
    'No runs found in generated SARIF log',
  );
  assert.ok(
    (outputSarifObj?.runs[0].tool?.driver?.rules?.length ?? 0) > 1,
    'No rules found in generated SARIF log',
  );
  assert.ok(
    (outputSarifObj?.runs[0].artifacts?.length ?? 0) > 0,
    'No artifacts found in generated SARIF log',
  );
  assert.ok(
    (outputSarifObj?.runs[0].results?.length ?? 0) > 1,
    'No results found in generated SARIF log',
  );
  assert.ok(
    outputSarifObj?.runs[0].results?.[0].ruleIndex !== null,
    'Result rule index should be set',
  );
  assert.ok(
    outputSarifObj?.runs[0].results?.[0]?.locations?.[0]?.physicalLocation
      ?.artifactLocation?.index !== null,
    'Result artifact index should be set',
  );
});

test('Create SarifResultBuilder with error', () => {
  let error = false;
  try {
    createInitSarifWrongResultBuilder();
  } catch (e) {
    error = true;
    console.log('Error: ' + (e as Error).message);
  }
  assert.strictEqual(error, true, 'Error should have been triggered');
});

test('Generate SARIF with multiple runs', () => {
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

  const outputSarifObj: Log = JSON.parse(readFileSync(outputFile, 'utf8'));
  assert.strictEqual(outputSarifObj?.runs?.length, 2);
  assert.strictEqual(
    outputSarifObj?.runs?.[0]?.tool?.driver?.name,
    'MegaLinter',
  );
  assert.strictEqual(
    outputSarifObj?.runs?.[1]?.tool?.driver?.name,
    'AnotherTool',
  );
  assert.strictEqual(outputSarifObj?.runs?.[0]?.results?.length, 1);
  assert.strictEqual(outputSarifObj?.runs?.[1]?.results?.length, 1);
});

test('Generate SARIF with richer tool and result details', () => {
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

  const outputSarifObj: Log = JSON.parse(readFileSync(outputFile, 'utf8'));
  const run = outputSarifObj?.runs?.[0];

  assert.strictEqual(run?.tool?.driver?.name, 'DetailTool');
  assert.strictEqual(run?.tool?.driver?.version, '9.9.9');
  assert.strictEqual(run?.tool?.driver?.rules?.[0]?.id, 'RICH_RULE');
  assert.strictEqual(
    run?.tool?.driver?.rules?.[0]?.shortDescription?.text,
    'Short description',
  );
  assert.strictEqual(
    run?.tool?.driver?.rules?.[0]?.fullDescription?.text,
    'Full description with more detail',
  );
  assert.strictEqual(
    run?.tool?.driver?.rules?.[0]?.helpUri,
    'https://example.com/rules/RICH_RULE',
  );
  assert.strictEqual(run?.results?.[0]?.level, 'error');
  assert.strictEqual(run?.results?.[0]?.message?.text, 'Something went wrong');
  assert.strictEqual(run?.results?.[0]?.ruleId, 'RICH_RULE');
  assert.strictEqual(
    run?.results?.[0]?.locations?.[0]?.physicalLocation?.artifactLocation?.uri,
    'src/example/file.ts',
  );
  assert.strictEqual(
    run?.results?.[0]?.locations?.[0]?.physicalLocation?.region?.startLine,
    12,
  );
});

test('Build SARIF JSON string with indent', () => {
  const sarifBuilder = new SarifBuilder();
  const runBuilder = createInitSarifRunBuilder();
  runBuilder.addRule(createInitSarifRuleBuilder());
  runBuilder.addResult(createInitSarifResultBuilder());
  sarifBuilder.addRun(runBuilder);

  const sarifJson = sarifBuilder.buildSarifJsonString({ indent: true });
  assert.strictEqual(sarifJson.includes('\n  "runs"'), true);
});

test('Build SARIF JSON string throws on invalid markers', () => {
  const sarifBuilder = new SarifBuilder();
  const runBuilder = new SarifRunBuilder();
  runBuilder.setToolDriverName(
    'SARIF_BUILDER_INVALID: Please send the tool name in tool.driver.name property, or call setToolName(name)',
  );
  sarifBuilder.addRun(runBuilder);

  assert.throws(
    () => sarifBuilder.buildSarifJsonString(),
    /SARIF log is invalid/i,
  );
});

test('Generate SARIF file async', async () => {
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
  assert.strictEqual(existsSync(outputFile), true);
});

test('Complete run fields adds artifacts and sets indexes', () => {
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

  assert.strictEqual(run.artifacts?.length, 2);
  assert.ok(run.artifacts?.find((a) => a.location?.uri === 'src/one.ts'));
  assert.ok(run.artifacts?.find((a) => a.location?.uri === 'src/two.js'));
  assert.strictEqual(run.artifacts?.[1]?.sourceLanguage, 'JavaScript');
  assert.strictEqual(run.results?.[0]?.ruleIndex, 0);
  assert.strictEqual(run.results?.[1]?.ruleIndex, 1);
  assert.strictEqual(
    run.results?.[0]?.locations?.[0]?.physicalLocation?.artifactLocation?.index,
    0,
  );
  assert.strictEqual(
    run.results?.[1]?.locations?.[0]?.physicalLocation?.artifactLocation?.index,
    1,
  );
});

test('SarifRunBuilder initSimple sets informationUri', () => {
  const runBuilder = new SarifRunBuilder();
  runBuilder.initSimple({
    toolDriverName: 'UriTool',
    toolDriverVersion: '1.0.0',
    url: 'https://example.com/tool',
  });
  assert.strictEqual(
    runBuilder.run.tool.driver.informationUri,
    'https://example.com/tool',
  );
});

test('SarifRuleBuilder setFullDescriptionText initializes fullDescription', () => {
  const ruleBuilder = new SarifRuleBuilder();
  ruleBuilder.setFullDescriptionText('Full description text');
  assert.strictEqual(
    ruleBuilder.rule.fullDescription?.text,
    'Full description text',
  );
});

test('SarifResultBuilder initSimple sets explicit region fields', () => {
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
    resultBuilder.result.locations![0].physicalLocation!.region || {};
  assert.strictEqual(region.startLine, 3);
  assert.strictEqual(region.startColumn, 4);
  assert.strictEqual(region.endLine, 5);
  assert.strictEqual(region.endColumn, 6);
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
