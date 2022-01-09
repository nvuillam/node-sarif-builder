import test from 'ava';

import { SarifBuilder, SarifRunBuilder } from './sarif-builder';

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

test('Create SarifRunBuilder and set name', (t) => {
  const sarifRunBuilder = new SarifRunBuilder();
  sarifRunBuilder.setToolName('MegaLinter');
  t.assert(sarifRunBuilder != null, 'SarifRunBuilder has been created');
  t.is(sarifRunBuilder.run.tool.driver.name, 'MegaLinter');
});
