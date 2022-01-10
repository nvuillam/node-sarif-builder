import * as os from 'os';
import * as path from 'path';

import test from 'ava';
import * as fs from 'fs-extra';
import { Log } from 'sarif';

import {
  SarifBuilder,
  SarifResultBuilder,
  SarifRunBuilder,
} from './sarif-builder';

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
    'http://json.schemastore.org/sarif-2.1.0-rtm.3'
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
  t.is(sarifResultBuilder.result.message.text, 'This is not cool !');
  t.is(sarifResultBuilder.result.ruleId, 'Wow !');
  t.is(
    sarifResultBuilder.result.locations[0].physicalLocation.artifactLocation
      .uri,
    'src/urf/wesh.js'
  );
  t.is(
    sarifResultBuilder.result.locations[0].physicalLocation.region.startLine,
    8
  );
  t.is(
    sarifResultBuilder.result.locations[0].physicalLocation.region.startColumn,
    1
  );
  t.is(
    sarifResultBuilder.result.locations[0].physicalLocation.region.endLine,
    8
  );
  t.is(
    sarifResultBuilder.result.locations[0].physicalLocation.region.endColumn,
    1
  );
});

test('Create SarifResultBuilder and generate file', (t) => {
  const sarifBuilder = new SarifBuilder();
  const sarifRunBuilder = createInitSarifRunBuilder();
  const sarifResultBuilder = createInitSarifResultBuilder();
  sarifRunBuilder.addResult(sarifResultBuilder);
  sarifBuilder.addRun(sarifRunBuilder);
  const outputFile = path.join(
    os.tmpdir(),
    'testSarifBuilder-' + Math.random() + '.sarif'
  );
  sarifBuilder.generateSarifFileSync(outputFile);
  t.assert(fs.existsSync(outputFile), 'Output SARIF file not found');
  const outputSarifObj: Log = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  t.assert(
    outputSarifObj?.runs?.length > 0,
    'No runs found in generated SARIF log'
  );
  t.assert(
    outputSarifObj?.runs[0].results?.length > 0,
    'No results found in generated SARIF log'
  );
});

function createInitSarifRunBuilder() {
  const sarifRunBuilder = new SarifRunBuilder();
  sarifRunBuilder.initSimple({ toolName: 'MegaLinter' });
  return sarifRunBuilder;
}

function createInitSarifResultBuilder() {
  const sarifResultBuilder = new SarifResultBuilder();
  sarifResultBuilder.initSimple({
    level: 'warning',
    messageText: 'This is not cool !',
    ruleId: 'Wow !',
    fileUri: 'src/urf/wesh.js',
    startLine: 8,
  });
  return sarifResultBuilder;
}
