# Quick API Testing Script for Badge Persistence (PowerShell)
# Usage: .\quick-test.ps1 -CustomerId <customer_id> -BarId <bar_id>

param(
    [Parameter(Mandatory=$true)]
    [string]$CustomerId,
    
    [Parameter(Mandatory=$true)]
    [string]$BarId
)

$BaseUrl = "http://localhost:3002"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Badge Persistence API Quick Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Customer ID: $CustomerId"
Write-Host "Bar ID: $BarId"
Write-Host ""

# Test 1: Badge Lookup - No Badge
Write-Host "Test 1: Badge Lookup (should return null for first-time user)" -ForegroundColor Yellow
Write-Host "GET $BaseUrl/api/loyalty/badge/$CustomerId"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/loyalty/badge/$CustomerId" -Method Get
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host "Press Enter to continue..." -ForegroundColor Gray
Read-Host

# Test 2: Award Bronze Badge
Write-Host "Test 2: Award Bronze Badge" -ForegroundColor Yellow
Write-Host "POST $BaseUrl/api/loyalty/badge/award"
$body = @{
    customer_id = $CustomerId
    bar_id = $BarId
    badge_level = "bronze"
    spend_amount = 3500.00
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/loyalty/badge/award" -Method Post -Body $body -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host "Press Enter to continue..." -ForegroundColor Gray
Read-Host

# Test 3: Badge Lookup - With Badge
Write-Host "Test 3: Badge Lookup (should return bronze badge)" -ForegroundColor Yellow
Write-Host "GET $BaseUrl/api/loyalty/badge/$CustomerId"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/loyalty/badge/$CustomerId" -Method Get
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host "Press Enter to continue..." -ForegroundColor Gray
Read-Host

# Test 4: Upgrade to Silver
Write-Host "Test 4: Upgrade Bronze to Silver" -ForegroundColor Yellow
Write-Host "POST $BaseUrl/api/loyalty/badge/award"
$body = @{
    customer_id = $CustomerId
    bar_id = $BarId
    badge_level = "silver"
    spend_amount = 10500.00
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/loyalty/badge/award" -Method Post -Body $body -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host "Press Enter to continue..." -ForegroundColor Gray
Read-Host

# Test 5: Try to Award Bronze (should reject)
Write-Host "Test 5: Try to Award Bronze (should reject - already has silver)" -ForegroundColor Yellow
Write-Host "POST $BaseUrl/api/loyalty/badge/award"
$body = @{
    customer_id = $CustomerId
    bar_id = $BarId
    badge_level = "bronze"
    spend_amount = 3500.00
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/loyalty/badge/award" -Method Post -Body $body -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host "Press Enter to continue..." -ForegroundColor Gray
Read-Host

# Test 6: Validation - Invalid Badge Level
Write-Host "Test 6: Validation - Invalid Badge Level" -ForegroundColor Yellow
Write-Host "POST $BaseUrl/api/loyalty/badge/award"
$body = @{
    customer_id = $CustomerId
    bar_id = $BarId
    badge_level = "diamond"
    spend_amount = 50000.00
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/loyalty/badge/award" -Method Post -Body $body -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host "Press Enter to continue..." -ForegroundColor Gray
Read-Host

# Test 7: Final Badge Lookup
Write-Host "Test 7: Final Badge Lookup (should show silver)" -ForegroundColor Yellow
Write-Host "GET $BaseUrl/api/loyalty/badge/$CustomerId"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/loyalty/badge/$CustomerId" -Method Get
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check database state in Supabase SQL Editor:"
Write-Host "   SELECT * FROM customer_badges WHERE customer_id = '$CustomerId' ORDER BY awarded_at DESC;"
Write-Host ""
Write-Host "2. Verify single active badge:"
Write-Host "   SELECT COUNT(*) FROM customer_badges WHERE customer_id = '$CustomerId' AND is_active = true;"
Write-Host "   (Should return 1)"
Write-Host ""
Write-Host "3. Review full test guide: .kiro/specs/cross-venue-badge-persistence/test-api-routes.md"
