# Script to kill process on port 3000
Write-Host "Finding process on port 3000..." -ForegroundColor Yellow

$connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($connections) {
    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $processIds) {
        try {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Found process: $($process.ProcessName) (PID: $pid)" -ForegroundColor Cyan
                Write-Host "Attempting to kill process $pid..." -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction Stop
                Write-Host "✓ Successfully killed process $pid" -ForegroundColor Green
            }
        } catch {
            Write-Host "✗ Failed to kill process $pid. You may need to run this script as Administrator." -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "`nTry running PowerShell as Administrator and run this script again." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "✓ Port 3000 is free!" -ForegroundColor Green
}

Write-Host "`nVerifying port 3000 is free..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
$check = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if (-not $check) {
    Write-Host "✓ Port 3000 is now free!" -ForegroundColor Green
} else {
    Write-Host "✗ Port 3000 is still in use. Please:" -ForegroundColor Red
    Write-Host "  1. Open Task Manager (Ctrl+Shift+Esc)" -ForegroundColor Yellow
    Write-Host "  2. Go to 'Details' tab" -ForegroundColor Yellow
    Write-Host "  3. Find the process using port 3000 and end it manually" -ForegroundColor Yellow
}
