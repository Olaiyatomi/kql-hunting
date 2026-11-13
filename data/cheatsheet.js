// KQL cheat sheet content. Each entry: syntax, what it does, and an example.
// "see" lists library queries that use the entry, by ID.

window.KQL_CHEATSHEET = [
  {
    id: "shape",
    title: "Filter and shape rows",
    intro: "Every query is a pipeline: a table, then operators separated by |, each one taking the rows from the step before.",
    entries: [
      { syntax: "where <predicate>", does: "Keep rows where the predicate is true. Put the time filter first: it is the cheapest filter there is.", example: "SigninLogs\n| where TimeGenerated > ago(1d)\n| where ResultType != \"0\"" },
      { syntax: "project <col>, <name> = <expr>", does: "Choose, rename and compute columns, in that order. Drops every column you do not list.", example: "| project TimeGenerated, User = UserPrincipalName, IPAddress", see: ["HQ-003"] },
      { syntax: "project-away <col>, ...", does: "Drop the listed columns and keep the rest. project-keep and project-rename work the same way.", example: "| project-away TenantId, SourceSystem" },
      { syntax: "extend <name> = <expr>", does: "Add a computed column and keep everything else.", example: "| extend Hour = datetime_part(\"hour\", TimeGenerated)", see: ["HQ-001"] },
      { syntax: "sort by <col> [asc|desc]", does: "Sort the results. Descending is the default. order by is the same operator.", example: "| sort by TimeGenerated desc" },
      { syntax: "top <n> by <col>", does: "Sort and keep the first n rows in one step. Faster than sort then take.", example: "| top 20 by Failures desc" },
      { syntax: "take <n>", does: "Return any n rows, in no particular order. Use it to look at a table's shape, never for results. limit is the same operator.", example: "DeviceProcessEvents\n| take 10" },
      { syntax: "distinct <col>, ...", does: "Unique combinations of the listed columns.", example: "| distinct UserPrincipalName, AppDisplayName" },
      { syntax: "count", does: "Return the number of rows as a single value.", example: "SecurityEvent\n| where EventID == 4625\n| count" },
      { syntax: "search \"<term>\"", does: "Look for a term in every column of one or more tables. Handy when you do not know where a value lives; slow, so scope it with in (Table) and a time filter.", example: "search in (SigninLogs, AuditLogs) \"203.0.113.10\"" }
    ]
  },
  {
    id: "strings",
    title: "String matching",
    intro: "KQL indexes whole terms (runs of letters and digits). Operators that match terms use the index and are fast; substring operators scan.",
    entries: [
      { syntax: "==   !=", does: "Exact match, case-sensitive. The fastest comparison.", example: "| where ActionType == \"LogonSuccess\"" },
      { syntax: "=~   !~", does: "Exact match, case-insensitive.", example: "| where FileName =~ \"powershell.exe\"" },
      { syntax: "has   !has", does: "Contains a whole term (case-insensitive). Uses the index. Reach for this before contains.", example: "| where ProcessCommandLine has \"mimikatz\"", see: ["HQ-003"] },
      { syntax: "has_any (...)   has_all (...)", does: "Contains any, or all, of a list of terms.", example: "| where RemoteUrl has_any (\"mega.nz\", \"transfer.sh\")", see: ["HQ-014"] },
      { syntax: "contains   !contains", does: "Contains a substring anywhere, including inside words. Slower: it cannot use the term index.", example: "| where ProcessCommandLine contains \"#24\"" },
      { syntax: "startswith   endswith", does: "Prefix or suffix match (case-insensitive). Add _cs for case-sensitive.", example: "| where OperationNameValue endswith \"/DELETE\"", see: ["HQ-018"] },
      { syntax: "in (...)   in~ (...)   !in (...)", does: "Equals one of a list. in is case-sensitive, in~ is not.", example: "| where FileName in~ (\"cmd.exe\", \"pwsh.exe\")", see: ["HQ-002", "HQ-017"] },
      { syntax: "matches regex @\"...\"", does: "Regular expression match (RE2 syntax). Use (?i) for case-insensitive. Put it after cheaper filters.", example: "| where RegistryKey matches regex @\"(?i)\\\\Run(Once)?$\"", see: ["HQ-005"] },
      { syntax: "@\"...\"   @'...'", does: "Verbatim strings: backslashes are literal, which is what you want for paths and regexes.", example: "| where FolderPath startswith @\"C:\\Windows\\System32\\\"" }
    ]
  },
  {
    id: "time",
    title: "Time",
    intro: "Timespans are written as numbers with a unit: 30s, 15m, 2h, 7d. Datetimes compare with the normal operators.",
    entries: [
      { syntax: "ago(<timespan>)", does: "The time that long before now. The usual way to set a lookback.", example: "| where TimeGenerated > ago(7d)" },
      { syntax: "between (<start> .. <end>)", does: "Inclusive range. Works on datetimes and numbers.", example: "| where TimeGenerated between (ago(30d) .. ago(1d))", see: ["HQ-016"] },
      { syntax: "bin(<datetime>, <timespan>)", does: "Round down into fixed-size buckets. The basis of every 'per hour' or 'per 10 minutes' count.", example: "| summarize count() by bin(TimeGenerated, 1h)", see: ["HQ-011"] },
      { syntax: "datetime_diff(\"<unit>\", <a>, <b>)", does: "Difference between two datetimes in whole units (second, minute, hour, day).", example: "| extend Gap = datetime_diff(\"second\", Timestamp, prev(Timestamp))", see: ["HQ-013"] },
      { syntax: "startofday()   startofweek()   endofday()", does: "Snap a datetime to the start or end of a day, week, month or year.", example: "| where TimeGenerated > startofday(now())" },
      { syntax: "format_datetime(<dt>, \"<pattern>\")", does: "Format a datetime as text.", example: "| extend Day = format_datetime(TimeGenerated, \"yyyy-MM-dd\")" },
      { syntax: "Timestamp vs TimeGenerated", does: "Defender XDR tables use Timestamp. Sentinel tables use TimeGenerated; XDR tables streamed into Sentinel carry both.", example: "DeviceProcessEvents | where Timestamp > ago(1d)" }
    ]
  },
  {
    id: "aggregate",
    title: "Aggregate",
    intro: "summarize groups rows by the columns after by and computes one row per group.",
    entries: [
      { syntax: "summarize <agg> by <col>, ...", does: "Group and aggregate. With no aggregation it returns distinct groups.", example: "| summarize Failures = count() by IPAddress", see: ["HQ-009"] },
      { syntax: "count()   countif(<pred>)", does: "Rows per group, or only the rows where the predicate is true.", example: "| summarize Attempts = count(), Successes = countif(ResultType == \"0\") by UserPrincipalName", see: ["HQ-017"] },
      { syntax: "dcount(<col>)", does: "Distinct values per group. An estimate, usually within a couple of percent; pass an accuracy level (0 to 4) as a second argument when it matters.", example: "| summarize Users = dcount(UserPrincipalName) by IPAddress" },
      { syntax: "make_set(<col>, <max>)   make_list()", does: "Collect unique (set) or all (list) values into an array. Always pass a max size.", example: "| summarize IPs = make_set(IPAddress, 20) by UserPrincipalName" },
      { syntax: "arg_max(<col>, *)   arg_min()", does: "The whole row with the highest (or lowest) value per group. The standard way to get the latest record per entity.", example: "| summarize arg_max(TimeGenerated, *) by DeviceName" },
      { syntax: "min()   max()   avg()   sum()   stdev()", does: "The usual statistics. min and max of TimeGenerated give first-seen and last-seen.", example: "| summarize FirstSeen = min(TimeGenerated), LastSeen = max(TimeGenerated) by UserPrincipalName" },
      { syntax: "percentiles(<col>, 50, 95, 99)", does: "Percentiles of a numeric column.", example: "| summarize percentiles(Duration, 50, 95)" },
      { syntax: "take_any(<col>)", does: "Any one value from the group. Use it for columns that are the same across the group.", example: "| summarize take_any(DeviceName), count() by DeviceId" }
    ]
  },
  {
    id: "join",
    title: "Join and combine",
    intro: "Put the smaller table on the left, filter both sides before the join, and always say which kind you want.",
    entries: [
      { syntax: "join kind=inner (<right>) on <col>", does: "Rows that match on both sides. Matches every pair, so duplicates multiply.", example: "| join kind=inner Phish on NetworkMessageId", see: ["HQ-020"] },
      { syntax: "kind=innerunique (the default)", does: "Deduplicates the left side on the join key before matching. Easy to get wrong: write kind= explicitly.", example: "| join kind=innerunique (...) on DeviceId" },
      { syntax: "kind=leftouter", does: "Every left row, with right columns filled in where there is a match and empty where not.", example: "| join kind=leftouter Baseline on UserId", see: ["HQ-015"] },
      { syntax: "kind=leftanti", does: "Left rows with no match on the right. The first-seen pattern: today's values that are not in the baseline.", example: "| join kind=leftanti Known on UserPrincipalName, Location", see: ["HQ-016"] },
      { syntax: "kind=leftsemi", does: "Left rows that do have a match, without adding the right side's columns.", example: "| join kind=leftsemi BadIPs on IPAddress" },
      { syntax: "lookup kind=leftouter <table> on <col>", does: "A join for enriching with a small reference table (watchlist, asset list). Faster than join for that job.", example: "| lookup kind=leftouter Assets on DeviceName" },
      { syntax: "union <t1>, <t2>", does: "Stack rows from several tables. isfuzzy=true keeps going if one is missing.", example: "union isfuzzy=true SigninLogs, AADNonInteractiveUserSignInLogs", see: ["HQ-007"] },
      { syntax: "let <name> = <query>;", does: "Name a value, list or sub-query to reuse below. Ends with a semicolon.", example: "let Admins = dynamic([\"alice@contoso.com\"]);", see: ["HQ-015"] },
      { syntax: "materialize(<query>)", does: "Cache a let sub-query so using it twice does not run it twice.", example: "let Fails = materialize(SigninLogs | where ResultType != \"0\");" }
    ]
  },
  {
    id: "dynamic",
    title: "Dynamic and JSON columns",
    intro: "Columns such as LocationDetails, InitiatedBy, TargetResources and AdditionalFields hold JSON. Read into them, then cast.",
    entries: [
      { syntax: "<col>.<field>   <col>[\"<field>\"]   <col>[0]", does: "Read a property or array element. Use brackets when the name has spaces or dots.", example: "| extend Actor = tostring(InitiatedBy.user.userPrincipalName)", see: ["HQ-019"] },
      { syntax: "tostring()   toint()   tolong()   todatetime()", does: "Cast a dynamic value so you can compare, group or sort on it. Always cast before summarize by.", example: "| extend City = tostring(LocationDetails.city)" },
      { syntax: "parse_json(<string>)", does: "Turn a JSON string into a dynamic value you can read into.", example: "| extend Fields = parse_json(AdditionalFields)" },
      { syntax: "mv-expand <col>", does: "One row per element of an array (or per property of a bag).", example: "| mv-expand Target = TargetResources\n| extend TargetName = tostring(Target.displayName)" },
      { syntax: "mv-apply <col> on (<subquery>)", does: "Run a small query against each row's array and keep the result. Good for filtering inside arrays.", example: "| mv-apply p = ModifiedProperties on (where p.displayName == \"StrongAuthenticationMethod\")" },
      { syntax: "bag_unpack()", does: "Spread a property bag into real columns.", example: "| evaluate bag_unpack(Fields)" },
      { syntax: "array_length()   set_has_element()", does: "Size of an array; whether an array contains a value.", example: "| where array_length(IPs) > 3" },
      { syntax: "split(<string>, <delim>)", does: "Split text into an array. Negative indexes count from the end.", example: "| extend Ext = tostring(split(FileName, \".\")[-1])", see: ["HQ-021"] }
    ]
  },
  {
    id: "text",
    title: "Parse and transform text",
    intro: "Pull structure out of command lines, URLs and free-text fields.",
    entries: [
      { syntax: "extract(@\"<regex>\", <group>, <col>)", does: "Return a capture group from a regex match, or empty if none.", example: "| extend Task = extract(@\"/tn\\s+(\\S+)\", 1, ProcessCommandLine)", see: ["HQ-004"] },
      { syntax: "parse <col> with <pattern>", does: "Split text into columns using literal anchors and * wildcards. Easier to read than a regex.", example: "| parse Message with * \"user=\" User \" ip=\" IP" },
      { syntax: "replace_regex(<col>, @\"<regex>\", <with>)", does: "Replace every regex match.", example: "| extend Clean = replace_regex(Decoded, @\"\\x00\", \"\")", see: ["HQ-001"] },
      { syntax: "base64_decode_tostring()", does: "Decode Base64 text. Encoded PowerShell is UTF-16, so strip the null bytes after.", example: "| extend Decoded = base64_decode_tostring(Encoded)", see: ["HQ-001"] },
      { syntax: "parse_url()   parse_path()", does: "Break a URL or file path into its parts.", example: "| extend Host = tostring(parse_url(Url).Host)" },
      { syntax: "tolower()   toupper()   trim()   strlen()", does: "Normalise text before grouping, and measure it (long command lines are a signal).", example: "| where strlen(ProcessCommandLine) > 1000" },
      { syntax: "strcat()   strcat_array()", does: "Join values or an array into one string.", example: "| extend Key = strcat(UserPrincipalName, \"|\", IPAddress)" },
      { syntax: "ipv4_is_private()   ipv4_is_in_range()", does: "Classify IP addresses without writing CIDR maths.", example: "| where not(ipv4_is_private(IPAddress))" }
    ]
  },
  {
    id: "sequence",
    title: "Order, windows and sessions",
    intro: "Some hunts depend on what happened just before. Sort first so rows are in a known order, then read across them.",
    entries: [
      { syntax: "serialize", does: "Freeze row order so window functions work. sort does this for you.", example: "| sort by DeviceName asc, Timestamp asc" },
      { syntax: "prev(<col>)   next(<col>)", does: "The value from the previous or next row.", example: "| extend Gap = Timestamp - prev(Timestamp)", see: ["HQ-013"] },
      { syntax: "row_number()", does: "1, 2, 3... down the sorted rows. Pass a restart condition to number within groups.", example: "| extend n = row_number(1, DeviceName != prev(DeviceName))" },
      { syntax: "row_window_session()", does: "Group rows into sessions that close after a gap. The basis of burst detection.", example: "| extend Burst = row_window_session(TimeGenerated, 1h, 5m, UserPrincipalName != prev(UserPrincipalName))", see: ["ITD-001"] },
      { syntax: "make-series <agg> on <time> step <span>", does: "A time series per group, with empty buckets filled in. Needed for anomaly functions.", example: "| make-series Logons = count() on TimeGenerated from ago(14d) to now() step 1h by UserPrincipalName" },
      { syntax: "series_decompose_anomalies()", does: "Flag spikes and dips in a series against its own trend and seasonality.", example: "| extend (Anomalies, Score, Baseline) = series_decompose_anomalies(Logons, 2.5)" },
      { syntax: "render timechart", does: "Draw the result as a chart in the portal. Other types: columnchart, barchart, piechart.", example: "| summarize count() by bin(TimeGenerated, 1h)\n| render timechart" }
    ]
  },
  {
    id: "patterns",
    title: "Hunting patterns",
    intro: "Most hunts are one of a handful of shapes. Learn the shapes and you can write the rest.",
    entries: [
      { syntax: "First seen", does: "Values in the recent window that are absent from a longer baseline: new countries, new processes, new admin tools.", example: "let Known = T | where TimeGenerated between (ago(30d) .. ago(1d)) | summarize by Key;\nT | where TimeGenerated > ago(1d) | join kind=leftanti Known on Key", see: ["HQ-016"] },
      { syntax: "Against the entity's own baseline", does: "Compare each user or device with its own normal rather than a global threshold.", example: "| join kind=leftouter Baseline on UserId\n| where Today >= 3 * coalesce(Avg, 0.0)", see: ["HQ-015", "ITD-013"] },
      { syntax: "Rare across the estate", does: "Count how many devices or users do something; the rare ones are worth reading.", example: "| summarize Devices = dcount(DeviceName) by SHA256\n| where Devices <= 2", see: ["HQ-006", "HQ-012"] },
      { syntax: "Burst", does: "Many events from one entity in a short window.", example: "| summarize Tools = dcount(FileName) by AccountName, bin(Timestamp, 10m)\n| where Tools >= 4", see: ["HQ-011", "ITD-001"] },
      { syntax: "Fan-out", does: "One source touching many targets: one IP against many accounts, one account on many hosts.", example: "| summarize Users = dcount(UserPrincipalName) by IPAddress\n| where Users >= 10", see: ["ITD-003", "HQ-009"] },
      { syntax: "Sequence", does: "Event A followed by event B for the same entity within a window.", example: "A | join kind=inner B on User\n| where TimeB between (TimeA .. TimeA + 30m)", see: ["ITD-009"] },
      { syntax: "Regular interval", does: "Machine-like timing: low variation in the gap between events.", example: "| summarize Avg = avg(Gap), Sd = stdev(Gap) by Pair\n| where Sd / Avg < 0.2", see: ["HQ-013"] }
    ]
  },
  {
    id: "performance",
    title: "Performance",
    intro: "Queries that time out in a hurry are useless. These habits keep them fast.",
    entries: [
      { syntax: "Time first", does: "Filter on TimeGenerated or Timestamp in the first where. Every other step works on less data.", example: "T | where TimeGenerated > ago(1d) | where ..." },
      { syntax: "has over contains", does: "Term matches use the index. Substring matches read every value.", example: "| where CommandLine has \"vssadmin\"" },
      { syntax: "Case-sensitive when you can", does: "== and in are faster than =~ and in~. Use them when the value's case is fixed (ActionType, EventID).", example: "| where ActionType == \"ConnectionSuccess\"" },
      { syntax: "Project early", does: "Drop wide columns you do not need before joins and summarize.", example: "| project TimeGenerated, UserPrincipalName, IPAddress" },
      { syntax: "Filter before join", does: "Shrink both sides first, and put the smaller one on the left.", example: "let Small = T1 | where ...;\nSmall | join kind=inner (T2 | where ...) on Key" },
      { syntax: "Cap your arrays", does: "make_set and make_list without a size limit can blow up memory on busy keys.", example: "make_set(IPAddress, 50)" }
    ]
  }
];
