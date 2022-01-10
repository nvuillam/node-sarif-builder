# node-sarif-builder

## Introduction

Until today, every SAST tool (not exhaustive list available at <https://analysis-tools.dev/>) is using its own custom output format.

In order to **unify SAST tools output format**, more and more tools and services are implementing [**SARIF format**](https://sarifweb.azurewebsites.net/) ([example](https://github.com/microsoft/sarif-tutorials/blob/main/samples/1-Introduction/simple-example.sarif))

SARIF logs can be:
- **Uploaded to DevOps tools**, like [Github](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning), [Azure DevOps](https://github.com/microsoft/sarif-azuredevops-extension) to show issues directly in their web UI
- **Visualized in IDEs**, like [Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=MS-SarifVSCode.sarif-viewer), [Visual Studio](https://marketplace.visualstudio.com/items?itemName=WDGIS.MicrosoftSarifViewer)
- **Aggregated by multi-language linters**, like [MegaLinter](https://megalinter.github.io/latest/)

Example of linters that can output logs in SARIF format:

- bandit (python)
- checkov (terraform)
- checkstyle (java)
- cfn-lint (AWS CloudFormation)
- codeql (multi-language)
- devskim (security)
- eslint (javascript,typescript,json)
- gitleaks (security)
- ktlint (Kotlin)
- hadolint (Dockerfile)
- MegaLinter (linters orchestrator)
- psalm (php)
- semgrep (multi-language)
- revive (Go)
- tflint (terraform)
- terrascan (terrasform)
- trivy (security)
- and many more...

If you are a **maintainer** of any **javascript/typescript based** SAST tool, but also IaC tool, or **any type of tool that can return a list of errors with a level of severity**, you can either read the whole [OASIS Specification](https://docs.oasis-open.org/sarif/sarif/v2.1.0/csprd01/sarif-v2.1.0-csprd01.html), or **simply use this library** to add SARIF as additional output format, so your tool will be natively compliant with any of SARIF-compliant tools !

## Installation

- with npm

```shell
npm install node-sarif-builder
```

- with yarn

```shell
yarn add node-sarif-builder
```

## Use

- Start by importing module

```javascript
const { SarifBuilder, SarifRunBuilder, SarifResultBuilder, SarifRuleBuilder } = require("node-sarif-builder");
```

- Create and init **SarifBuilder** and **SarifRunBuilder** objects

```javascript
// SARIF builder
const sarifBuilder = new SarifBuilder();
// SARIF Run builder
const sarifRunBuilder = new SarifRunBuilder().initSimple({
    name: "npm-groovy-lint", // Name of your analyzer tool
    url: "https://nvuillam.github.io/npm-groovy-lint/" // Url of your analyzer tool
});
```

- Add all rules that can be found in your results (recommended but optional)

```javascript
// Add SARIF rules
for (const rule of rules) {
    const sarifRuleBuiler = new SarifRuleBuilder().initSimple({
        ruleId: rule.id, // ex: "no-any"
        shortDescriptionText: rule.description, // ex: "Do not use any in your code !"
        helpUri: rule.docUrl // ex: "http://my.linter.com/rules/no-any"
    });
    sarifRunBuilder.addRule(sarifRuleBuiler);
}
```

- For each found issue, create a SarifResultBuilder and add it to the SarifRunBuilder object

```javascript
// Add results
for (const issue of issues) {
    const sarifResultBuilder = new SarifResultBuilder();
    const sarifResultInit = {
         // Transcode to a SARIF level:  can be "warning" or "error" or "note"
        level: issue.severity === "info" ? "note" : issue.severity,
        messageText: err.msg, // Ex: "any is forbidden !"
        ruleId: err.rule, // Ex: "no-any"
        fileUri: process.env.SARIF_URI_ABSOLUTE // Ex: src/myfile.ts
            ? "file:///" + fileNm.replace(/\\/g, "/")
            : path.relative(process.cwd(), fileNm)
    };
    // When possible, provide location of the issue in the source code
    if (issue.range) {
        sarifResultInit.startLine = incrementOrUndefined(issue.range.start.line); // any integer >= 1 (optional)
        sarifResultInit.startColumn = incrementOrUndefined(issue.range.start.character); // any integer >= 1 (optional)
        sarifResultInit.endLine = incrementOrUndefined(issue.range.end.line); // any integer >= 1 (optional)
        sarifResultInit.endColumn = incrementOrUndefined(issue.range.end.character); // any integer >= 1 (optional)
    }
    // Init saarifResultBuilder
    sarifResultBuilder.initSimple(sarifResultInit); 
    // Add result to sarifRunBuilder
    sarifRunBuilder.addResult(sarifResultBuilder);
}

function incrementOrUndefined(val) {
    if (val === null) {
        return undefined;
    }
    // Increment only if your linter starts to count at zero :)
    return val + 1; 
}
```

- Add run to sarifBuilder then generate JSON SARIF output file

```javascript
    sarifBuilder.addRun(sarifRunBuilder);
    const sarifJsonString = sarifBuilder.buildSarifJsonString({ indent: false }); // indent:true if you like
    fs.writeFileSync(outputSarifFile,sarifJsonString);
    // const sarifObj = sarifBuilder.buildSarifOutput(); // You could also just get the Sarif log as an object and not a string
```

## Full example

- Working in [npm-groovy-lint]()

```javascript
function buildSarifResult(lintResult) {
    // SARIF builder
    const sarifBuilder = new SarifBuilder();
    // SARIF Run builder
    const sarifRunBuilder = new SarifRunBuilder().initSimple({
        name: "npm-groovy-lint",
        url: "https://nvuillam.github.io/npm-groovy-lint/"
    });
    // SARIF rules
    for (const ruleId of Object.keys(lintResult.rules || {})) {
        const rule = lintResult.rules[ruleId];
        const sarifRuleBuiler = new SarifRuleBuilder().initSimple({
            ruleId: ruleId,
            shortDescriptionText: rule.description,
            helpUri: rule.docUrl
        });
        sarifRunBuilder.addRule(sarifRuleBuiler);
    }
    // Add SARIF results (individual errors)
    for (const fileNm of Object.keys(lintResult.files)) {
        const fileErrors = lintResult.files[fileNm].errors;
        for (const err of fileErrors) {
            const sarifResultBuilder = new SarifResultBuilder();
            const sarifResultInit = {
                level: err.severity === "info" ? "note" : err.severity, // Other values can be "warning" or "error"
                messageText: err.msg,
                ruleId: err.rule,
                fileUri: process.env.SARIF_URI_ABSOLUTE
                    ? "file:///" + fileNm.replace(/\\/g, "/")
                    : path.relative(process.cwd(), fileNm)
            };
            if (err.range) {
                sarifResultInit.startLine = incrementOrUndefined(err.range.start.line);
                sarifResultInit.startColumn = incrementOrUndefined(err.range.start.character);
                sarifResultInit.endLine = incrementOrUndefined(err.range.end.line);
                sarifResultInit.endColumn = incrementOrUndefined(err.range.end.character);
            }
            sarifResultBuilder.initSimple(sarifResultInit);
            sarifRunBuilder.addResult(sarifResultBuilder);
        }
    }
    sarifBuilder.addRun(sarifRunBuilder);
    return sarifBuilder.buildSarifJsonString({ indent: false });
}

function incrementOrUndefined(val) {
    if (val === null) {
        return undefined;
    }
    return val + 1;
}
```