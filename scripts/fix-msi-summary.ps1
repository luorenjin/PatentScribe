param(
    [Parameter(Mandatory = $true)]
    [string]$MsiPath,

    [Parameter(Mandatory = $true)]
    [string]$Title,

    [Parameter(Mandatory = $true)]
    [string]$Subject,

    [Parameter(Mandatory = $true)]
    [string]$Author,

    [Parameter(Mandatory = $true)]
    [string]$Keywords,

    [Parameter(Mandatory = $true)]
    [string]$Comments
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $MsiPath)) {
    throw "MSI file not found: $MsiPath"
}

$msiInterop = @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class PatentMateMsiSummaryInfo
{
    public const uint ErrorSuccess = 0;
    public const uint ErrorMoreData = 234;
    public const uint VT_LPSTR = 30;

    [StructLayout(LayoutKind.Sequential)]
    public struct FILETIME
    {
        public uint dwLowDateTime;
        public uint dwHighDateTime;
    }

    [DllImport("msi.dll", CharSet = CharSet.Unicode)]
    public static extern uint MsiOpenDatabase(string path, IntPtr persist, out IntPtr database);

    [DllImport("msi.dll", CharSet = CharSet.Unicode)]
    public static extern uint MsiGetSummaryInformation(IntPtr database, string databasePath, uint updateCount, out IntPtr summaryInfo);

    [DllImport("msi.dll", CharSet = CharSet.Unicode)]
    public static extern uint MsiSummaryInfoGetProperty(IntPtr summaryInfo, uint property, out uint dataType, out int integerValue, out FILETIME fileTimeValue, StringBuilder value, ref uint valueLength);

    [DllImport("msi.dll", CharSet = CharSet.Unicode)]
    public static extern uint MsiSummaryInfoSetProperty(IntPtr summaryInfo, uint property, uint dataType, int integerValue, ref FILETIME fileTimeValue, string value);

    [DllImport("msi.dll")]
    public static extern uint MsiSummaryInfoPersist(IntPtr summaryInfo);

    [DllImport("msi.dll")]
    public static extern uint MsiDatabaseCommit(IntPtr database);

    [DllImport("msi.dll")]
    public static extern int MsiCloseHandle(IntPtr handle);

    public static void ThrowOnError(uint result, string operation)
    {
        if (result != ErrorSuccess)
        {
            throw new InvalidOperationException(operation + " failed with error code " + result + ".");
        }
    }

    public static string GetStringProperty(IntPtr summaryInfo, uint property)
    {
        uint dataType;
        int integerValue;
        FILETIME fileTimeValue;
        uint length = 4096;
        var buffer = new StringBuilder((int)length + 1);
        uint result = MsiSummaryInfoGetProperty(summaryInfo, property, out dataType, out integerValue, out fileTimeValue, buffer, ref length);
        if (result == ErrorMoreData)
        {
            buffer = new StringBuilder((int)length + 1);
            result = MsiSummaryInfoGetProperty(summaryInfo, property, out dataType, out integerValue, out fileTimeValue, buffer, ref length);
        }

        ThrowOnError(result, "MsiSummaryInfoGetProperty(value)");
        return buffer.ToString();
    }

    public static void SetStringProperty(IntPtr summaryInfo, uint property, string value)
    {
        FILETIME fileTimeValue = new FILETIME();
        uint result = MsiSummaryInfoSetProperty(summaryInfo, property, VT_LPSTR, 0, ref fileTimeValue, value ?? string.Empty);
        ThrowOnError(result, "MsiSummaryInfoSetProperty(" + property + ")");
    }
}
'@

if (-not ('PatentMateMsiSummaryInfo' -as [type])) {
    Add-Type -TypeDefinition $msiInterop
}

$database = [IntPtr]::Zero
$summary = [IntPtr]::Zero

try {
    [PatentMateMsiSummaryInfo]::ThrowOnError(
        [PatentMateMsiSummaryInfo]::MsiOpenDatabase($MsiPath, [IntPtr]1, [ref]$database),
        'MsiOpenDatabase'
    )

    [PatentMateMsiSummaryInfo]::ThrowOnError(
        [PatentMateMsiSummaryInfo]::MsiGetSummaryInformation($database, $null, 20, [ref]$summary),
        'MsiGetSummaryInformation'
    )

    [PatentMateMsiSummaryInfo]::SetStringProperty($summary, 2, $Title)
    [PatentMateMsiSummaryInfo]::SetStringProperty($summary, 3, $Subject)
    [PatentMateMsiSummaryInfo]::SetStringProperty($summary, 4, $Author)
    [PatentMateMsiSummaryInfo]::SetStringProperty($summary, 5, $Keywords)
    [PatentMateMsiSummaryInfo]::SetStringProperty($summary, 6, $Comments)

    [PatentMateMsiSummaryInfo]::ThrowOnError(
        [PatentMateMsiSummaryInfo]::MsiSummaryInfoPersist($summary),
        'MsiSummaryInfoPersist'
    )

    [PatentMateMsiSummaryInfo]::ThrowOnError(
        [PatentMateMsiSummaryInfo]::MsiDatabaseCommit($database),
        'MsiDatabaseCommit'
    )
}
finally {
    if ($summary -ne [IntPtr]::Zero) {
        [PatentMateMsiSummaryInfo]::MsiCloseHandle($summary) | Out-Null
    }

    if ($database -ne [IntPtr]::Zero) {
        [PatentMateMsiSummaryInfo]::MsiCloseHandle($database) | Out-Null
    }
}

$verifyDatabase = [IntPtr]::Zero
$verifySummary = [IntPtr]::Zero

try {
    [PatentMateMsiSummaryInfo]::ThrowOnError(
        [PatentMateMsiSummaryInfo]::MsiOpenDatabase($MsiPath, [IntPtr]0, [ref]$verifyDatabase),
        'MsiOpenDatabase(verify)'
    )

    [PatentMateMsiSummaryInfo]::ThrowOnError(
        [PatentMateMsiSummaryInfo]::MsiGetSummaryInformation($verifyDatabase, $null, 0, [ref]$verifySummary),
        'MsiGetSummaryInformation(verify)'
    )

    $finalTitle = [PatentMateMsiSummaryInfo]::GetStringProperty($verifySummary, 2)
    Write-Output "Patched MSI summary title: $finalTitle"
    Write-Output "Patched MSI path: $MsiPath"
}
finally {
    if ($verifySummary -ne [IntPtr]::Zero) {
        [PatentMateMsiSummaryInfo]::MsiCloseHandle($verifySummary) | Out-Null
    }

    if ($verifyDatabase -ne [IntPtr]::Zero) {
        [PatentMateMsiSummaryInfo]::MsiCloseHandle($verifyDatabase) | Out-Null
    }
}