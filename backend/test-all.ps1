Write-Host "🧪 Testing Complete Gold Assay System..." -ForegroundColor Cyan

# Test 1: Login
Write-Host "`n1. Testing Login..." -ForegroundColor Yellow
$body = @{
    username = "admin"
    password = "password"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/login" `
                                      -Method POST `
                                      -Headers @{"Content-Type" = "application/json"} `
                                      -Body $body
    
    Write-Host "   ✅ Login Successful!" -ForegroundColor Green
    $token = $loginResponse.token
    
    # Test 2: Dashboard Stats
    Write-Host "`n2. Testing Dashboard..." -ForegroundColor Yellow
    $dashboard = Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/stats" `
                                  -Method GET `
                                  -Headers @{
                                      "Content-Type" = "application/json"
                                      "Authorization" = "Bearer $token"
                                  }
    Write-Host "   ✅ Dashboard Accessible!" -ForegroundColor Green
    Write-Host "   📊 Total Reports: $($dashboard.totalReports)" -ForegroundColor White
    Write-Host "   👥 Total Customers: $($dashboard.totalCustomers)" -ForegroundColor White
    
    # Test 3: Customers
    Write-Host "`n3. Testing Customers..." -ForegroundColor Yellow
    $customers = Invoke-RestMethod -Uri "http://localhost:3000/api/customers" `
                                  -Method GET `
                                  -Headers @{
                                      "Content-Type" = "application/json"
                                      "Authorization" = "Bearer $token"
                                  }
    Write-Host "   ✅ Customers Accessible!" -ForegroundColor Green
    Write-Host "   👤 Customer Count: $($customers.Count)" -ForegroundColor White
    
    # Test 4: Reports
    Write-Host "`n4. Testing Reports..." -ForegroundColor Yellow
    $reports = Invoke-RestMethod -Uri "http://localhost:3000/api/reports" `
                                -Method GET `
                                -Headers @{
                                    "Content-Type" = "application/json"
                                    "Authorization" = "Bearer $token"
                                }
    Write-Host "   ✅ Reports Accessible!" -ForegroundColor Green
    Write-Host "   📋 Report Count: $($reports.Count)" -ForegroundColor White
    
    Write-Host "`n🎉 ALL TESTS PASSED! Backend is fully functional!" -ForegroundColor Green
    
} catch {
    Write-Host "   ❌ Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}