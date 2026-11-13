// Hand-written hunting queries. Unlike data/detections.js these are NOT
// replayed through Kusto in CI: treat them as starting points and check the
// results in your own tenant. Add new ones at the end with the next HQ id.

const XDR = ["Defender XDR", "Microsoft Sentinel"];
const SENTINEL = ["Microsoft Sentinel"];

window.KQL_HUNTING = [
  {
    id: "HQ-001",
    title: "PowerShell started with an encoded command",
    attack: [{ technique: "T1059.001", tactic: "execution" }],
    tables: ["DeviceProcessEvents"],
    products: XDR,
    description: "Finds PowerShell launched with -EncodedCommand (or any shortened form such as -enc or -e) and decodes the payload so you can read it without leaving the results.",
    how: "extract() pulls the Base64 blob out with a capture group, and base64_decode_tostring() decodes it. PowerShell encodes as UTF-16LE, so replace_regex() strips the null bytes between characters.",
    tuning: { "Base64 length": "20 characters filters out short flags. Raise it if management tools trip the hunt." },
    falsePositives: ["Configuration management and RMM agents (SCCM, Intune scripts, NinjaOne) that pass scripts encoded."],
    triage: ["Read the decoded command first. Download cradles (IEX, DownloadString, Net.WebClient) and AMSI bypass strings are the strongest signals.", "Check the parent process: Office, a browser or wscript as the parent is far worse than a management agent."],
    references: ["https://attack.mitre.org/techniques/T1059/001/"],
    query: String.raw`DeviceProcessEvents
| where Timestamp > ago(7d)
| where FileName in~ ("powershell.exe", "pwsh.exe")
| where ProcessCommandLine matches regex @"(?i)\s[-/]e(c|n[a-z]*)?\s+[A-Za-z0-9+/=]{20,}"
| extend Encoded = extract(@"(?i)\s[-/]e(?:c|n[a-z]*)?\s+([A-Za-z0-9+/=]{20,})", 1, ProcessCommandLine)
| extend Decoded = replace_regex(base64_decode_tostring(Encoded), @"\x00", "")
| project Timestamp, DeviceName, AccountName, InitiatingProcessFileName, Decoded, ProcessCommandLine
| sort by Timestamp desc`
  },
  {
    id: "HQ-002",
    title: "Office application spawning a script interpreter",
    attack: [{ technique: "T1204.002", tactic: "execution" }],
    tables: ["DeviceProcessEvents"],
    products: XDR,
    description: "Word, Excel, PowerPoint, Outlook or OneNote launching a shell, script host or LOLBin. This is how most macro and OneNote lures turn into code execution.",
    how: "in~ does case-insensitive list matching against two dynamic lists. summarize with make_set() collapses repeat launches into one row per device, user and parent-child pair.",
    tuning: { "Child list": "Add msbuild.exe, installutil.exe or bitsadmin.exe if they are rare in your estate." },
    falsePositives: ["Add-ins and finance macros that legitimately shell out to cmd.exe."],
    triage: ["Find the document: look at DeviceFileEvents on the same device just before the first launch.", "Check what the child did next (network connections, files written)."],
    references: ["https://attack.mitre.org/techniques/T1204/002/"],
    query: String.raw`let OfficeApps = dynamic(["winword.exe", "excel.exe", "powerpnt.exe", "outlook.exe", "onenote.exe", "mspub.exe"]);
let Interpreters = dynamic(["powershell.exe", "pwsh.exe", "cmd.exe", "wscript.exe", "cscript.exe", "mshta.exe", "rundll32.exe", "regsvr32.exe", "certutil.exe"]);
DeviceProcessEvents
| where Timestamp > ago(7d)
| where InitiatingProcessFileName in~ (OfficeApps)
| where FileName in~ (Interpreters)
| summarize Launches = count(), FirstSeen = min(Timestamp), LastSeen = max(Timestamp),
    CommandLines = make_set(ProcessCommandLine, 5)
    by DeviceName, AccountName, InitiatingProcessFileName, FileName
| sort by LastSeen desc`
  },
  {
    id: "HQ-003",
    title: "LSASS memory dumped with comsvcs.dll or ProcDump",
    attack: [{ technique: "T1003.001", tactic: "credential-access" }],
    tables: ["DeviceProcessEvents"],
    products: XDR,
    description: "The two most common living-off-the-land ways to dump LSASS: rundll32 calling the MiniDump export of comsvcs.dll, and Sysinternals ProcDump pointed at lsass.",
    how: "has matches whole terms and uses the term index, so it is much faster than contains. contains is kept only for #24, the export's ordinal, which is not a word.",
    tuning: {},
    falsePositives: ["Support engineers capturing LSASS dumps for Microsoft support cases (rare, and should be ticketed)."],
    triage: ["Treat as credential theft until proven otherwise: every credential cached on that host is exposed.", "Look for the dump file being copied off the host (DeviceFileEvents, DeviceNetworkEvents)."],
    references: ["https://attack.mitre.org/techniques/T1003/001/"],
    query: String.raw`DeviceProcessEvents
| where Timestamp > ago(7d)
| where (FileName =~ "rundll32.exe" and ProcessCommandLine has "comsvcs"
        and (ProcessCommandLine has "MiniDump" or ProcessCommandLine contains "#24"))
    or (ProcessCommandLine has "lsass" and ProcessCommandLine has_any ("procdump", "procdump64"))
| project Timestamp, DeviceName, AccountName, FileName, ProcessCommandLine,
    InitiatingProcessFileName, InitiatingProcessCommandLine
| sort by Timestamp desc`
  },
  {
    id: "HQ-004",
    title: "Scheduled task created to run a script or a binary from a user folder",
    attack: [{ technique: "T1053.005", tactic: "persistence" }],
    tables: ["DeviceProcessEvents"],
    products: XDR,
    description: "schtasks /create where the task action runs a script host or something under AppData, Temp, ProgramData or Users\\Public.",
    how: "Two extract() calls pull the task name (/tn) and action (/tr) out of the command line. Single-quoted verbatim strings (@'...') let the regex contain double quotes without escaping.",
    tuning: { "Action terms": "Remove ProgramData if software updaters there are noisy." },
    falsePositives: ["Software updaters that register tasks under ProgramData (Google, Adobe, Zoom)."],
    triage: ["Check whether the binary the task runs is signed and how prevalent it is in your estate.", "Look at what created the task: an interactive admin is very different from a document or a browser."],
    references: ["https://attack.mitre.org/techniques/T1053/005/"],
    query: String.raw`DeviceProcessEvents
| where Timestamp > ago(7d)
| where FileName =~ "schtasks.exe"
| where ProcessCommandLine matches regex @"(?i)[/-]create\b"
| extend TaskName = extract(@'(?i)/tn\s+("[^"]+"|\S+)', 1, ProcessCommandLine),
         TaskAction = extract(@'(?i)/tr\s+("[^"]+"|\S+)', 1, ProcessCommandLine)
| where TaskAction has_any ("powershell", "pwsh", "cmd", "mshta", "rundll32", "regsvr32",
                            "wscript", "cscript", "AppData", "Temp", "ProgramData", "Public")
| project Timestamp, DeviceName, AccountName, TaskName, TaskAction,
    InitiatingProcessFileName, ProcessCommandLine
| sort by Timestamp desc`
  },
  {
    id: "HQ-005",
    title: "Run key set to launch a script or a user-writable path",
    attack: [{ technique: "T1547.001", tactic: "persistence" }],
    tables: ["DeviceRegistryEvents"],
    products: XDR,
    description: "New values under the Run and RunOnce keys whose data points at a script host or a folder any user can write to.",
    how: "matches regex anchors the key path with $ so only the Run and RunOnce keys match, not keys that merely contain the word Run.",
    tuning: {},
    falsePositives: ["Per-user installs of Teams, Slack, Zoom or Spotify, which live in AppData."],
    triage: ["Check the prevalence of the value's executable across devices: a value on one machine is far more interesting than one on hundreds.", "Find the process that wrote it (InitiatingProcessFileName) and its parent."],
    references: ["https://attack.mitre.org/techniques/T1547/001/"],
    query: String.raw`DeviceRegistryEvents
| where Timestamp > ago(7d)
| where ActionType == "RegistryValueSet"
| where RegistryKey matches regex @"(?i)\\CurrentVersion\\Run(Once)?$"
| where RegistryValueData has_any ("powershell", "pwsh", "cmd", "mshta", "rundll32", "regsvr32",
                                   "wscript", "cscript", "AppData", "Temp", "Public", "ProgramData")
| project Timestamp, DeviceName, InitiatingProcessAccountName, InitiatingProcessFileName,
    RegistryKey, RegistryValueName, RegistryValueData
| sort by Timestamp desc`
  },
  {
    id: "HQ-006",
    title: "System binary name running from the wrong folder",
    attack: [{ technique: "T1036.005", tactic: "stealth" }],
    tables: ["DeviceProcessEvents"],
    products: XDR,
    description: "Processes named like core Windows binaries (svchost, lsass, csrss and others) that are not running from System32, SysWOW64 or WinSxS: classic masquerading.",
    how: "A let statement holds the name list as a dynamic array. not() around several startswith checks reads more clearly than chaining !startswith.",
    tuning: {},
    falsePositives: ["Security and backup tools that ship their own copies of these binaries in odd folders (rare)."],
    triage: ["Compare SHA256 with the genuine binary and look it up in threat intelligence.", "Check Devices: a hash on one device only is a strong signal."],
    references: ["https://attack.mitre.org/techniques/T1036/005/"],
    query: String.raw`let SystemNames = dynamic(["svchost.exe", "lsass.exe", "csrss.exe", "services.exe", "winlogon.exe",
                             "smss.exe", "taskhostw.exe", "spoolsv.exe", "wininit.exe", "lsm.exe"]);
DeviceProcessEvents
| where Timestamp > ago(7d)
| where FileName in~ (SystemNames)
| where not(FolderPath startswith @"C:\Windows\System32\"
         or FolderPath startswith @"C:\Windows\SysWOW64\"
         or FolderPath startswith @"C:\Windows\WinSxS\")
| summarize Devices = dcount(DeviceName), DeviceList = make_set(DeviceName, 10),
    FirstSeen = min(Timestamp), LastSeen = max(Timestamp)
    by FileName, FolderPath, SHA256
| sort by Devices asc`
  },
  {
    id: "HQ-007",
    title: "Security event log cleared",
    attack: [{ technique: "T1685.005", tactic: "defense-impairment" }],
    tables: ["SecurityEvent", "DeviceProcessEvents"],
    products: SENTINEL,
    description: "Event 1102 (audit log cleared) from Windows Security events, plus wevtutil or Clear-EventLog commands seen by Defender for Endpoint, in one result set.",
    how: "union isfuzzy=true combines two tables with different schemas and keeps working if one of them is missing in your workspace. Each branch projects the same column names so the rows line up.",
    tuning: {},
    falsePositives: ["Golden image builds and lab resets that clear logs on purpose."],
    triage: ["Anything the attacker did before the clear is gone from that host: pull the same window from Defender for Endpoint tables, which are stored off-box.", "Ask who cleared it and why; there is rarely a good reason on a production server."],
    references: ["https://attack.mitre.org/techniques/T1685/005/"],
    query: String.raw`union isfuzzy=true
    (SecurityEvent
    | where TimeGenerated > ago(7d)
    | where EventID == 1102
    | project TimeGenerated, Host = Computer, Account, Source = "Security log cleared (1102)", Detail = ""),
    (DeviceProcessEvents
    | where Timestamp > ago(7d)
    | where (FileName =~ "wevtutil.exe" and ProcessCommandLine matches regex @"(?i)\s(cl|clear-log)\s")
        or (FileName in~ ("powershell.exe", "pwsh.exe") and ProcessCommandLine has "Clear-EventLog")
    | project TimeGenerated = Timestamp, Host = DeviceName, Account = AccountName,
        Source = "Log clearing command", Detail = ProcessCommandLine)
| sort by TimeGenerated desc`
  },
  {
    id: "HQ-008",
    title: "Shadow copies or backups deleted",
    attack: [{ technique: "T1490", tactic: "impact" }],
    tables: ["DeviceProcessEvents"],
    products: XDR,
    description: "vssadmin, wmic, bcdedit, wbadmin or PowerShell used to delete shadow copies, backups or recovery options. Ransomware does this minutes before encrypting.",
    how: "Each tool gets its own bracketed condition joined with or, which keeps the logic readable and easy to extend. summarize groups the burst into one row per device and account.",
    tuning: {},
    falsePositives: ["Backup software rotating its own catalogue with wbadmin."],
    triage: ["Treat as an active ransomware precursor: isolate the device and check for the same commands on other hosts in the last hour.", "Find the parent process and the account; ransomware operators usually run this as a domain admin."],
    references: ["https://attack.mitre.org/techniques/T1490/"],
    query: String.raw`DeviceProcessEvents
| where Timestamp > ago(7d)
| where (FileName =~ "vssadmin.exe" and ProcessCommandLine has "delete" and ProcessCommandLine has "shadows")
    or (FileName =~ "wmic.exe" and ProcessCommandLine has "shadowcopy" and ProcessCommandLine has "delete")
    or (FileName =~ "bcdedit.exe" and ProcessCommandLine has "recoveryenabled" and ProcessCommandLine has "no")
    or (FileName =~ "wbadmin.exe" and ProcessCommandLine has "delete" and ProcessCommandLine has_any ("catalog", "backup", "systemstatebackup"))
    or (FileName in~ ("powershell.exe", "pwsh.exe") and ProcessCommandLine has "Win32_ShadowCopy"
        and ProcessCommandLine has_any ("Delete", "Remove-CimInstance", "Remove-WmiObject"))
| summarize Commands = make_set(ProcessCommandLine, 10), Count = count(),
    FirstSeen = min(Timestamp), LastSeen = max(Timestamp)
    by DeviceName, AccountName, InitiatingProcessFileName
| sort by FirstSeen desc`
  },
  {
    id: "HQ-009",
    title: "One account using RDP to reach many devices",
    attack: [{ technique: "T1021.001", tactic: "lateral-movement" }],
    tables: ["DeviceLogonEvents"],
    products: XDR,
    description: "Successful RemoteInteractive logons from one account and source IP to three or more devices in a day.",
    how: "dcount() counts distinct devices per account and source. Raising or lowering the where Targets >= line is the only tuning needed.",
    tuning: { "Targets": "3 devices a day. Raise for helpdesk accounts, or exclude them by name." },
    falsePositives: ["Helpdesk and server admins who RDP to many machines as their job."],
    triage: ["Is this account normally an admin? Compare with the previous 30 days.", "Check the source IP: a workstation fanning out over RDP is more suspicious than a jump host."],
    references: ["https://attack.mitre.org/techniques/T1021/001/"],
    query: String.raw`DeviceLogonEvents
| where Timestamp > ago(1d)
| where LogonType == "RemoteInteractive" and ActionType == "LogonSuccess"
| summarize Targets = dcount(DeviceName), Devices = make_set(DeviceName, 20),
    FirstLogon = min(Timestamp), LastLogon = max(Timestamp)
    by AccountDomain, AccountName, RemoteIP
| where Targets >= 3
| sort by Targets desc`
  },
  {
    id: "HQ-010",
    title: "Service Control Manager launching a shell",
    attack: [{ technique: "T1569.002", tactic: "execution" }],
    tables: ["DeviceProcessEvents"],
    products: XDR,
    description: "services.exe directly starting cmd, PowerShell or a LOLBin. PsExec, Impacket smbexec and many RATs execute through a temporary service this way.",
    how: "A simple parent-child filter. InitiatingProcessFileName is the parent; FileName is the child that was created.",
    tuning: {},
    falsePositives: ["Legitimate services that wrap batch files (some backup and monitoring agents)."],
    triage: ["Look for a service install on the same device just before (DeviceEvents, ActionType ServiceInstalled).", "Find the logon that preceded it: a network logon from another workstation points to lateral movement."],
    references: ["https://attack.mitre.org/techniques/T1569/002/"],
    query: String.raw`DeviceProcessEvents
| where Timestamp > ago(7d)
| where InitiatingProcessFileName =~ "services.exe"
| where FileName in~ ("cmd.exe", "powershell.exe", "pwsh.exe", "rundll32.exe", "mshta.exe", "regsvr32.exe")
| project Timestamp, DeviceName, AccountName, FileName, ProcessCommandLine
| sort by Timestamp desc`
  },
  {
    id: "HQ-011",
    title: "Burst of discovery commands from one account",
    attack: [{ technique: "T1082", tactic: "discovery" }, { technique: "T1087.002", tactic: "discovery" }],
    tables: ["DeviceProcessEvents"],
    products: XDR,
    description: "Four or more different reconnaissance tools (whoami, net, nltest, systeminfo and so on) run by the same account on one device within ten minutes. Hands-on-keyboard attackers almost always do this first.",
    how: "bin(Timestamp, 10m) puts events into fixed ten-minute buckets so summarize can count distinct tools per bucket.",
    tuning: { "Tools": "4 distinct tools per 10 minutes. Lower to 3 on servers." },
    falsePositives: ["IT staff troubleshooting, and inventory scripts."],
    triage: ["Read the command list in order: domain admin and trust enumeration (net group \"domain admins\", nltest /domain_trusts) is the key signal.", "Check how the account logged on to the device."],
    references: ["https://attack.mitre.org/techniques/T1082/", "https://attack.mitre.org/techniques/T1087/002/"],
    query: String.raw`let ReconTools = dynamic(["whoami.exe", "net.exe", "net1.exe", "nltest.exe", "ipconfig.exe", "systeminfo.exe",
                            "quser.exe", "arp.exe", "route.exe", "netstat.exe", "tasklist.exe", "dsquery.exe",
                            "nslookup.exe", "klist.exe", "setspn.exe"]);
DeviceProcessEvents
| where Timestamp > ago(1d)
| where FileName in~ (ReconTools)
| summarize Tools = dcount(FileName), ToolList = make_set(FileName),
    Commands = make_set(ProcessCommandLine, 15), Start = min(Timestamp)
    by DeviceName, AccountName, Window = bin(Timestamp, 10m)
| where Tools >= 4
| sort by Tools desc`
  },
  {
    id: "HQ-012",
    title: "Script hosts connecting to rare public IPs",
    attack: [{ technique: "T1105", tactic: "command-and-control" }],
    tables: ["DeviceNetworkEvents"],
    products: XDR,
    description: "PowerShell, mshta, rundll32, regsvr32 and Windows Script Host making successful connections to public IPs that only one or two devices in the estate talk to.",
    how: "Grouping by destination and counting devices with dcount() turns the estate into its own baseline: a destination only one device reaches is rare by definition.",
    tuning: { "Devices": "2 or fewer. Raise in small estates." },
    falsePositives: ["Admin scripts calling vendor APIs."],
    triage: ["Look up RemoteIP and the URLs in threat intelligence.", "Check what the process did just before and after the connection (files written, child processes)."],
    references: ["https://attack.mitre.org/techniques/T1105/"],
    query: String.raw`DeviceNetworkEvents
| where Timestamp > ago(7d)
| where InitiatingProcessFileName in~ ("powershell.exe", "pwsh.exe", "mshta.exe", "rundll32.exe",
                                      "regsvr32.exe", "wscript.exe", "cscript.exe")
| where RemoteIPType == "Public" and ActionType == "ConnectionSuccess"
| summarize Connections = count(), Devices = dcount(DeviceName), DeviceList = make_set(DeviceName, 5),
    Urls = make_set(RemoteUrl, 10), FirstSeen = min(Timestamp)
    by InitiatingProcessFileName, RemoteIP, RemotePort
| where Devices <= 2
| sort by FirstSeen desc`
  },
  {
    id: "HQ-013",
    title: "Beaconing: connections at suspiciously regular intervals",
    attack: [{ technique: "T1071.001", tactic: "command-and-control" }],
    tables: ["DeviceNetworkEvents"],
    products: XDR,
    description: "Process-to-IP pairs that connect at least 20 times a day with very little variation in the gap between connections, which is how most implants check in.",
    how: "sort serializes the rows so prev() can read the previous row. datetime_diff() gives the gap in seconds; the ratio of stdev() to avg() of the gap (jitter) is low for machines and high for people.",
    tuning: { "maxJitter": "0.2 (20%). Many C2 frameworks add jitter; raise to 0.3 to catch them, at the cost of more noise." },
    falsePositives: ["Update checkers, telemetry agents and monitoring tools, which also beacon. Build an allow list of known-good destinations."],
    triage: ["Group results by RemoteIP across devices: one destination on one device is the interesting shape.", "Check the process: a signed browser or agent is likely benign; rundll32 or an unsigned binary is not."],
    references: ["https://attack.mitre.org/techniques/T1071/001/"],
    query: String.raw`let lookback = 1d;
let minConnections = 20;
let maxJitter = 0.2;      // stdev of the gap as a share of the average gap
DeviceNetworkEvents
| where Timestamp > ago(lookback)
| where RemoteIPType == "Public" and ActionType == "ConnectionSuccess"
| project Timestamp, DeviceName, InitiatingProcessFileName, RemoteIP, RemotePort
| sort by DeviceName asc, InitiatingProcessFileName asc, RemoteIP asc, Timestamp asc
| extend Gap = iff(DeviceName == prev(DeviceName)
                   and InitiatingProcessFileName == prev(InitiatingProcessFileName)
                   and RemoteIP == prev(RemoteIP),
                   datetime_diff("second", Timestamp, prev(Timestamp)), long(null))
| where isnotnull(Gap)
| summarize Connections = count(), AvgGap = avg(Gap), StdevGap = stdev(Gap)
    by DeviceName, InitiatingProcessFileName, RemoteIP, RemotePort
| where Connections >= minConnections and AvgGap > 0
| extend Jitter = round(StdevGap / AvgGap, 3)
| where Jitter <= maxJitter
| sort by Jitter asc`
  },
  {
    id: "HQ-014",
    title: "Non-browser process talking to file-sharing sites",
    attack: [{ technique: "T1567.002", tactic: "exfiltration" }],
    tables: ["DeviceNetworkEvents"],
    products: XDR,
    description: "Connections to MEGA, Dropbox, transfer.sh, file.io, gofile and similar services from anything that is not a browser. rclone and custom exfil tools show up here.",
    how: "has_any() takes a whole list of domains in one pass. Negating in~ with not() removes the browsers.",
    tuning: { "StorageDomains": "Add the services your organisation blocks by policy." },
    falsePositives: ["The Dropbox desktop client and other sync apps your organisation allows."],
    triage: ["Look at InitiatingProcessCommandLine: rclone with a config file or a renamed binary is a strong signal.", "Check DeviceFileEvents for archives (zip, 7z, rar) created on the device just before."],
    references: ["https://attack.mitre.org/techniques/T1567/002/"],
    query: String.raw`let StorageDomains = dynamic(["mega.nz", "mega.co.nz", "dropbox.com", "dropboxusercontent.com", "transfer.sh",
                                "file.io", "gofile.io", "sendspace.com", "wetransfer.com", "temp.sh", "pastebin.com"]);
let Browsers = dynamic(["chrome.exe", "msedge.exe", "firefox.exe", "brave.exe", "opera.exe", "iexplore.exe"]);
DeviceNetworkEvents
| where Timestamp > ago(7d)
| where RemoteUrl has_any (StorageDomains)
| where not(InitiatingProcessFileName in~ (Browsers))
| summarize Connections = count(), Urls = make_set(RemoteUrl, 10), FirstSeen = min(Timestamp), LastSeen = max(Timestamp)
    by DeviceName, InitiatingProcessAccountName, InitiatingProcessFileName, InitiatingProcessCommandLine
| sort by LastSeen desc`
  },
  {
    id: "HQ-015",
    title: "User downloading far more SharePoint and OneDrive files than usual",
    attack: [{ technique: "T1530", tactic: "collection" }],
    tables: ["OfficeActivity"],
    products: SENTINEL,
    description: "Hours in the last day where a user downloaded 100 or more distinct files and at least three times their own hourly average over the previous two weeks.",
    how: "The same let block feeds both the baseline and the current window, so the comparison is like for like. join kind=leftouter keeps users with no baseline, and coalesce() turns their missing average into 0.",
    tuning: { "minFiles": "100 files an hour.", "threshold": "3x the user's own average." },
    falsePositives: ["Users syncing a library to a new laptop.", "Migrations and eDiscovery exports run under a user account."],
    triage: ["Is the user leaving or under investigation? Check with HR.", "Check SigninLogs for the same hour: an unfamiliar IP or device points to a stolen session."],
    references: ["https://attack.mitre.org/techniques/T1530/"],
    query: String.raw`let lookback = 14d;
let threshold = 3.0;    // multiple of the user's own hourly average
let minFiles = 100;
let Downloads = OfficeActivity
    | where TimeGenerated > ago(lookback)
    | where Operation in ("FileDownloaded", "FileSyncDownloadedFull")
    | summarize Files = dcount(OfficeObjectId) by UserId, Hour = bin(TimeGenerated, 1h);
let Baseline = Downloads
    | where Hour < ago(1d)
    | summarize AvgFiles = avg(Files) by UserId;
Downloads
| where Hour >= ago(1d)
| join kind=leftouter Baseline on UserId
| extend AvgFiles = coalesce(AvgFiles, 0.0)
| where Files >= minFiles and Files >= threshold * AvgFiles
| project Hour, UserId, Files, AvgFiles = round(AvgFiles, 1)
| sort by Files desc`
  },
  {
    id: "HQ-016",
    title: "Successful sign-in from a country the user has never used",
    attack: [{ technique: "T1078.004", tactic: "initial-access" }],
    tables: ["SigninLogs"],
    products: SENTINEL,
    description: "Compares the last day of successful sign-ins with the previous 30 days and returns user and country pairs that are new.",
    how: "join kind=leftanti is the first-seen pattern: it keeps only rows from the left side that have no match in the baseline. summarize by with no aggregation gives a distinct list.",
    tuning: { "lookback": "30 days of history. Longer catches travellers better but costs more." },
    falsePositives: ["Travel, and new users who have no history yet.", "VPN and mobile carrier egress in another country."],
    triage: ["Check whether the same user signed in from their usual country within an hour of the new one.", "Look at the device and app: an unmanaged device on Exchange or Azure CLI is worse than a managed laptop on Teams."],
    references: ["https://attack.mitre.org/techniques/T1078/004/"],
    query: String.raw`let lookback = 30d;
let recent = 1d;
let Known = SigninLogs
    | where TimeGenerated between (ago(lookback) .. ago(recent))
    | where ResultType == "0"
    | summarize by UserPrincipalName, Location;
SigninLogs
| where TimeGenerated > ago(recent)
| where ResultType == "0" and isnotempty(Location)
| join kind=leftanti Known on UserPrincipalName, Location
| summarize FirstSignin = min(TimeGenerated), IPs = make_set(IPAddress, 10), Apps = make_set(AppDisplayName, 10)
    by UserPrincipalName, Location
| sort by FirstSignin desc`
  },
  {
    id: "HQ-017",
    title: "Legacy authentication sign-ins",
    attack: [{ technique: "T1078.004", tactic: "initial-access" }],
    tables: ["SigninLogs"],
    products: SENTINEL,
    description: "Sign-ins over IMAP, POP3, SMTP AUTH, ActiveSync and other legacy protocols, which cannot do MFA and are the main target of password spraying.",
    how: "!in excludes the two modern client types instead of listing every legacy one, so new legacy client names are caught automatically. countif() counts successes inside the same summarize.",
    tuning: {},
    falsePositives: ["Printers, scanners and line-of-business apps that still send mail over SMTP AUTH."],
    triage: ["Any success is worth a look: block legacy auth with Conditional Access if you have not already.", "For failures, check whether the same IP failed against many accounts (see ITD-003)."],
    references: ["https://learn.microsoft.com/en-us/entra/identity/conditional-access/policy-block-legacy-authentication"],
    query: String.raw`SigninLogs
| where TimeGenerated > ago(7d)
| where isnotempty(ClientAppUsed)
| where ClientAppUsed !in ("Browser", "Mobile Apps and Desktop clients")
| summarize Attempts = count(), Successes = countif(ResultType == "0"),
    IPs = make_set(IPAddress, 20), Clients = make_set(ClientAppUsed)
    by UserPrincipalName
| sort by Successes desc, Attempts desc`
  },
  {
    id: "HQ-018",
    title: "Burst of Azure resource deletions by one caller",
    attack: [{ technique: "T1485", tactic: "impact" }],
    tables: ["AzureActivity"],
    products: SENTINEL,
    description: "Ten or more successful DELETE operations by the same caller in an hour. Attackers with Owner or Contributor wipe backups, vaults and VMs this way.",
    how: "endswith on OperationNameValue catches every resource provider's delete operation without listing them.",
    tuning: { "Deletions": "10 per hour. Exclude your infrastructure-as-code service principals by Caller." },
    falsePositives: ["Terraform or Bicep teardown of test environments."],
    triage: ["Check whether the caller is a person or a service principal, and whether it normally deletes anything.", "Look for Recovery Services vault or backup deletions first; those decide whether you can recover."],
    references: ["https://attack.mitre.org/techniques/T1485/"],
    query: String.raw`AzureActivity
| where TimeGenerated > ago(1d)
| where OperationNameValue endswith "/DELETE"
| where ActivityStatusValue in~ ("Success", "Succeeded")
| summarize Deletions = count(), Providers = make_set(ResourceProviderValue, 10),
    Resources = make_set(_ResourceId, 20), First = min(TimeGenerated), Last = max(TimeGenerated)
    by Caller, CallerIpAddress, Hour = bin(TimeGenerated, 1h)
| where Deletions >= 10
| sort by Deletions desc`
  },
  {
    id: "HQ-019",
    title: "Domain authentication or federation settings changed",
    attack: [{ technique: "T1484.002", tactic: "privilege-escalation" }],
    tables: ["AuditLogs"],
    products: SENTINEL,
    description: "Changes that turn a domain into a federated domain or add a new one. An attacker with Global Admin can federate a domain to their own identity provider and sign in as anyone.",
    how: "InitiatedBy and TargetResources are dynamic columns. Dot notation reads into them, and tostring() turns the result into a string you can filter and display. coalesce() picks the user or the app, whichever started the change.",
    tuning: {},
    falsePositives: ["Planned identity projects (moving to or away from AD FS)."],
    triage: ["Confirm the change with the identity team the same day; this one should never be a surprise.", "Check the actor's sign-ins in the hour before for anything unusual."],
    references: ["https://attack.mitre.org/techniques/T1484/002/"],
    query: String.raw`AuditLogs
| where TimeGenerated > ago(30d)
| where OperationName in ("Set domain authentication", "Set federation settings on domain",
                          "Add unverified domain", "Verify domain", "Add verified domain")
| extend Actor = coalesce(tostring(InitiatedBy.user.userPrincipalName), tostring(InitiatedBy.app.displayName))
| extend Domain = tostring(TargetResources[0].displayName)
| project TimeGenerated, OperationName, Result, Actor, Domain, CorrelationId
| sort by TimeGenerated desc`
  },
  {
    id: "HQ-020",
    title: "Users who clicked a link in an email flagged as phishing",
    attack: [{ technique: "T1566.002", tactic: "initial-access" }],
    tables: ["EmailEvents", "UrlClickEvents"],
    products: XDR,
    description: "Joins Safe Links click events with emails Defender for Office 365 classed as phishing, so you get the list of people who clicked, not just who received.",
    how: "A let statement prepares the small side of the join (phish emails) first; the join then runs on NetworkMessageId, the ID that links an email to everything that happened to it.",
    tuning: {},
    falsePositives: ["Security staff who click on purpose while investigating."],
    triage: ["Reset the clicker's password and revoke sessions if the page harvested credentials.", "Check SigninLogs for the user in the hour after the click."],
    references: ["https://attack.mitre.org/techniques/T1566/002/"],
    query: String.raw`let Phish = EmailEvents
    | where Timestamp > ago(7d)
    | where ThreatTypes has "Phish"
    | project NetworkMessageId, Subject, SenderFromAddress;
UrlClickEvents
| where Timestamp > ago(7d)
| where ActionType == "ClickAllowed" or IsClickedThrough == true
| join kind=inner Phish on NetworkMessageId
| project Timestamp, AccountUpn, Url, ActionType, IsClickedThrough, Subject, SenderFromAddress, IPAddress
| sort by Timestamp desc`
  },
  {
    id: "HQ-021",
    title: "Inbound email delivered with a risky attachment type",
    attack: [{ technique: "T1566.001", tactic: "initial-access" }],
    tables: ["EmailAttachmentInfo", "EmailEvents"],
    products: XDR,
    description: "Delivered inbound mail carrying disk images, shortcuts, script files, OneNote files or other types malware loaders use to get past macro blocking.",
    how: "split() turns the file name into an array and [-1] reads its last element, the extension. The join on two keys matches each attachment to the right recipient copy of the email.",
    tuning: { "RiskyTypes": "Remove types your business genuinely receives (msi from a software vendor, for example)." },
    falsePositives: ["Vendors sending installers or ISO images by email."],
    triage: ["Check whether anyone opened it: DeviceFileEvents for the file name or SHA256.", "Look up the SHA256, and check the sender's domain age and authentication results."],
    references: ["https://attack.mitre.org/techniques/T1566/001/"],
    query: String.raw`let RiskyTypes = dynamic(["iso", "img", "vhd", "vhdx", "lnk", "hta", "js", "jse", "vbs", "vbe",
                            "wsf", "one", "chm", "scr", "msi"]);
EmailAttachmentInfo
| where Timestamp > ago(7d)
| extend Ext = tolower(tostring(split(FileName, ".")[-1]))
| where Ext in (RiskyTypes)
| join kind=inner (
    EmailEvents
    | where Timestamp > ago(7d)
    | where EmailDirection == "Inbound" and DeliveryAction == "Delivered"
    | project NetworkMessageId, RecipientEmailAddress, Subject, DeliveryLocation
  ) on NetworkMessageId, RecipientEmailAddress
| project Timestamp, SenderFromAddress, RecipientEmailAddress, Subject, FileName, Ext, SHA256, DeliveryLocation
| sort by Timestamp desc`
  },
  {
    id: "HQ-022",
    title: "certutil used to download or decode a file",
    attack: [{ technique: "T1105", tactic: "command-and-control" }, { technique: "T1140", tactic: "stealth" }],
    tables: ["DeviceProcessEvents"],
    products: XDR,
    description: "certutil with -urlcache or -verifyctl pointed at a URL, or -decode / -decodehex used to unpack a payload. Both are long-standing living-off-the-land tricks.",
    how: "ProcessVersionInfoOriginalFileName catches certutil even if the attacker renamed the binary, because it reads the name compiled into the file.",
    tuning: {},
    falsePositives: ["Administrators checking certificate revocation lists with -urlcache (should not involve arbitrary URLs)."],
    triage: ["Get the URL and the output file name from the command line, then look for that file executing.", "Check the parent process."],
    references: ["https://attack.mitre.org/techniques/T1105/", "https://attack.mitre.org/techniques/T1140/"],
    query: String.raw`DeviceProcessEvents
| where Timestamp > ago(7d)
| where FileName =~ "certutil.exe" or ProcessVersionInfoOriginalFileName =~ "CertUtil.exe"
| where (ProcessCommandLine has_any ("urlcache", "verifyctl") and ProcessCommandLine has_any ("http", "https", "ftp"))
    or ProcessCommandLine has_any ("decode", "decodehex")
| project Timestamp, DeviceName, AccountName, FileName, ProcessCommandLine, InitiatingProcessFileName
| sort by Timestamp desc`
  },
  {
    id: "HQ-023",
    title: "Kerberoasting: many RC4 service tickets for one account",
    attack: [{ technique: "T1558.003", tactic: "credential-access" }],
    tables: ["SecurityEvent"],
    products: SENTINEL,
    description: "Event 4769 service ticket requests encrypted with RC4 (0x17) for five or more different user-backed services from one account. Roasting tools ask for RC4 because it cracks fastest.",
    how: "!endswith \"$\" drops computer accounts, which are not worth roasting, leaving services that run as user accounts.",
    tuning: { "Services": "5 distinct services per day." },
    falsePositives: ["Old applications that only support RC4 (these are worth fixing anyway)."],
    triage: ["Find the source host from IpAddress and see what ran there.", "Rotate the passwords of the requested service accounts, starting with privileged ones, and move them to AES or gMSA."],
    references: ["https://attack.mitre.org/techniques/T1558/003/"],
    query: String.raw`SecurityEvent
| where TimeGenerated > ago(1d)
| where EventID == 4769
| where TicketEncryptionType == "0x17"            // RC4
| where ServiceName !endswith "$" and ServiceName !~ "krbtgt"
| summarize Services = dcount(ServiceName), ServiceList = make_set(ServiceName, 20), FirstRequest = min(TimeGenerated)
    by TargetUserName, IpAddress, Computer
| where Services >= 5
| sort by Services desc`
  },
  {
    id: "HQ-024",
    title: "Member added to a privileged Active Directory group",
    attack: [{ technique: "T1098", tactic: "persistence" }],
    tables: ["SecurityEvent"],
    products: SENTINEL,
    description: "Events 4728, 4732 and 4756 (member added to a global, local or universal security group) where the group is Domain Admins, Enterprise Admins or another built-in privileged group.",
    how: "For these event IDs TargetUserName holds the group, not a user, and MemberName holds the account that was added. Reading the event's field meanings is half of writing Windows queries.",
    tuning: { "PrivilegedGroups": "Add your own Tier 0 groups." },
    falsePositives: ["Planned admin onboarding (should have a change ticket)."],
    triage: ["Confirm the change with the person in ChangedBy.", "If it was not planned, remove the member and check what the account did with the new rights."],
    references: ["https://attack.mitre.org/techniques/T1098/"],
    query: String.raw`let PrivilegedGroups = dynamic(["Domain Admins", "Enterprise Admins", "Schema Admins", "Administrators",
                                  "Account Operators", "Backup Operators", "Server Operators", "DnsAdmins",
                                  "Group Policy Creator Owners"]);
SecurityEvent
| where TimeGenerated > ago(7d)
| where EventID in (4728, 4732, 4756)
| where TargetUserName in~ (PrivilegedGroups)
| project TimeGenerated, Computer, Group = TargetUserName, MemberAdded = MemberName, MemberSid,
    ChangedBy = SubjectUserName, Activity
| sort by TimeGenerated desc`
  }
].map(q => ({ ...q, kind: "hunting" }));
