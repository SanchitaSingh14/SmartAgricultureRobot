# PowerShell launcher for Smart Agriculture Robot

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Starting Smart Agriculture Robot (Backend & Frontend)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# Launch Backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\SmartAgricultureRobot\backend; `$env:PYTHONPATH = 'C:\SmartAgricultureRobot\backend'; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

# Launch Frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\SmartAgricultureRobot\frontend; npm run dev"

Write-Host "`nBackend starting at: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "Frontend dashboard starting at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "API Interactive Documentation: http://127.0.0.1:8000/docs`n" -ForegroundColor Yellow

