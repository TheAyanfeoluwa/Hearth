$intervalSeconds = 1200 # 20 minutes

Write-Host "Starting Auto-Push Monitor for Hearth..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow

while ($true) {
    $status = git status --porcelain
    if ($status) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] Changes detected. Committing..." -ForegroundColor Green
        
        git add .
        git commit -m "Auto-save: $timestamp"
        git push origin main
        
        Write-Host "[$timestamp] Pushed successfully." -ForegroundColor Cyan
    } else {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    
    Start-Sleep -Seconds $intervalSeconds
}
