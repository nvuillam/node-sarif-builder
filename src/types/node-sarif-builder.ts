import {
  Address,
  Artifact,
  ArtifactLocation,
  Conversion,
  ExternalProperties,
  ExternalPropertyFileReferences,
  Graph,
  Invocation,
  Log,
  LogicalLocation,
  PropertyBag,
  Result,
  Run,
  RunAutomationDetails,
  SpecialLocations,
  ThreadFlowLocation,
  Tool,
  ToolComponent,
  VersionControlDetails,
  WebRequest,
  WebResponse,
} from 'sarif';

export interface LogOptions {
  /**
   * The URI of the JSON schema corresponding to the version.
   */
  $schema?: string | undefined;

  /**
   * The SARIF format version of this log file.
   */
  version?: Log.version;

  /**
   * The set of runs contained in this log file.
   */
  runs?: Run[];

  /**
   * References to external property files that share data between runs.
   */
  inlineExternalProperties?: ExternalProperties[] | undefined;

  /**
   * Key/value pairs that provide additional information about the log file.
   */
  properties?: PropertyBag | undefined;
}

/**
 * Describes a single run of an analysis tool, and contains the reported output of that run.
 */
export interface RunOptions {
  /**
   * Addresses associated with this run instance, if any.
   */
  addresses?: Address[] | undefined;

  /**
   * An array of artifact objects relevant to the run.
   */
  artifacts?: Artifact[] | undefined;

  /**
   * Automation details that describe this run.
   */
  automationDetails?: RunAutomationDetails | undefined;

  /**
   * The 'guid' property of a previous SARIF 'run' that comprises the baseline that was used to compute result
   * 'baselineState' properties for the run.
   */
  baselineGuid?: string | undefined;

  /**
   * Specifies the unit in which the tool measures columns.
   */
  columnKind?: Run.columnKind | undefined;

  /**
   * A conversion object that describes how a converter transformed an analysis tool's native reporting format into
   * the SARIF format.
   */
  conversion?: Conversion | undefined;

  /**
   * Specifies the default encoding for any artifact object that refers to a text file.
   */
  defaultEncoding?: string | undefined;

  /**
   * Specifies the default source language for any artifact object that refers to a text file that contains source
   * code.
   */
  defaultSourceLanguage?: string | undefined;

  /**
   * References to external property files that should be inlined with the content of a root log file.
   */
  externalPropertyFileReferences?: ExternalPropertyFileReferences | undefined;

  /**
   * An array of zero or more unique graph objects associated with the run.
   */
  graphs?: Graph[] | undefined;

  /**
   * Describes the invocation of the analysis tool.
   */
  invocations?: Invocation[] | undefined;

  /**
   * The language of the messages emitted into the log file during this run (expressed as an ISO 639-1 two-letter
   * lowercase culture code) and an optional region (expressed as an ISO 3166-1 two-letter uppercase subculture code
   * associated with a country or region). The casing is recommended but not required (in order for this data to
   * conform to RFC5646).
   */
  language?: string | undefined;

  /**
   * An array of logical locations such as namespaces, types or functions.
   */
  logicalLocations?: LogicalLocation[] | undefined;

  /**
   * An ordered list of character sequences that were treated as line breaks when computing region information for
   * the run.
   */
  newlineSequences?: string[] | undefined;

  /**
   * The artifact location specified by each uriBaseId symbol on the machine where the tool originally ran.
   */
  originalUriBaseIds?: { [key: string]: ArtifactLocation } | undefined;

  /**
   * Contains configurations that may potentially override both reportingDescriptor.defaultConfiguration (the tool's
   * default severities) and invocation.configurationOverrides (severities established at run-time from the command
   * line).
   */
  policies?: ToolComponent[] | undefined;

  /**
   * An array of strings used to replace sensitive information in a redaction-aware property.
   */
  redactionTokens?: string[] | undefined;

  /**
   * The set of results contained in an SARIF log. The results array can be omitted when a run is solely exporting
   * rules metadata. It must be present (but may be empty) if a log file represents an actual scan.
   */
  results?: Result[] | undefined;

  /**
   * Automation details that describe the aggregate of runs to which this run belongs.
   */
  runAggregates?: RunAutomationDetails[] | undefined;

  /**
   * A specialLocations object that defines locations of special significance to SARIF consumers.
   */
  specialLocations?: SpecialLocations | undefined;

  /**
   * An array of toolComponent objects relevant to a taxonomy in which results are categorized.
   */
  taxonomies?: ToolComponent[] | undefined;

  /**
   * An array of threadFlowLocation objects cached at run level.
   */
  threadFlowLocations?: ThreadFlowLocation[] | undefined;

  /**
   * Information about the tool or tool pipeline that generated the results in this run. A run can only contain
   * results produced by a single tool or tool pipeline. A run can aggregate results from multiple log files, as long
   * as context around the tool run (tool command-line arguments and the like) is identical for all aggregated files.
   */
  tool?: Tool;

  /**
   * The set of available translations of the localized data provided by the tool.
   */
  translations?: ToolComponent[] | undefined;

  /**
   * Specifies the revision in version control of the artifacts that were scanned.
   */
  versionControlProvenance?: VersionControlDetails[] | undefined;

  /**
   * An array of request objects cached at run level.
   */
  webRequests?: WebRequest[] | undefined;

  /**
   * An array of response objects cached at run level.
   */
  webResponses?: WebResponse[] | undefined;

  /**
   * Key/value pairs that provide additional information about the run.
   */
  properties?: PropertyBag | undefined;
}
