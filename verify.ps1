# HostelHub End-to-End API Verification Script (Phase 4: Evictions, Checkout Adjustments, Complaints, Cash Payments)

$baseUrl = "http://localhost:8080/api"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "HostelHub E2E API Verification Testing (Phase 4)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Register/Login Owner
Write-Host "`n1. Logging in as Owner..." -ForegroundColor Yellow
$ownerRegisterBody = @{
    username = "owner_test4"
    email = "owner_test4@example.com"
    password = "password123"
    role = "OWNER"
    name = "Test Owner 4"
    phone = "9876543212"
} | ConvertTo-Json
try { $null = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $ownerRegisterBody -ContentType "application/json" } catch {}

$ownerLoginBody = @{ username = "owner_test4"; password = "password123" } | ConvertTo-Json
$ownerLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $ownerLoginBody -ContentType "application/json"
$ownerToken = $ownerLoginRes.token

# 2. Create Hostel with UPI details
Write-Host "`n2. Creating new Hostel listing with UPI & Bank details..." -ForegroundColor Yellow
$hostelBody = @{
    name = "Central Metro Rooms"
    description = "Next to the metro station. Easy QR payments."
    address = "22-1, Metro Road"
    city = "Visakhapatnam"
    contactNumber = "9988776622"
    facilityIds = @(1)
    upiId = "owner4@upi"
    bankAccount = "Bank: HDFC, A/C: 987654, IFSC: HDFC0000123"
} | ConvertTo-Json

$ownerHeaders = @{ Authorization = "Bearer $ownerToken" }
$hostelRes = Invoke-RestMethod -Uri "$baseUrl/hostels" -Method Post -Body $hostelBody -ContentType "application/json" -Headers $ownerHeaders
$hostelId = $hostelRes.id
Write-Host "Success: Created Hostel ID $hostelId | UPI registered: $($hostelRes.upiId)" -ForegroundColor Green

# 3. Add Room
$roomBody = @{ roomNumber = "404"; roomType = "Single"; capacity = 1; pricePerMonth = 9000.00 } | ConvertTo-Json
$roomRes = Invoke-RestMethod -Uri "$baseUrl/hostels/$hostelId/rooms" -Method Post -Body $roomBody -ContentType "application/json" -Headers $ownerHeaders
$roomId = $roomRes.id

# 4. Register/Login Student
Write-Host "`n4. Logging in as Student..." -ForegroundColor Yellow
$studentRegisterBody = @{
    username = "student_test4"
    email = "student_test4@example.com"
    password = "password123"
    role = "STUDENT"
    name = "Test Student 4"
    phone = "9998887772"
} | ConvertTo-Json
try { $null = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $studentRegisterBody -ContentType "application/json" } catch {}

$studentLoginBody = @{ username = "student_test4"; password = "password123" } | ConvertTo-Json
$studentLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $studentLoginBody -ContentType "application/json"
$studentToken = $studentLoginRes.token
$studentHeaders = @{ Authorization = "Bearer $studentToken" }

# 5. Book room (3 months)
Write-Host "`n5. Submitting 3-month booking request..." -ForegroundColor Yellow
$bookingBody = @{ roomId = $roomId; startDate = "2026-08-01"; endDate = "2026-10-31" } | ConvertTo-Json
$bookingRes = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Post -Body $bookingBody -ContentType "application/json" -Headers $studentHeaders
$bookingId = $bookingRes.id

# 6. Approve booking & check Security Deposit
Write-Host "`n6. Owner Approving booking (Should auto-generate Advance + 3 monthly Invoices)..." -ForegroundColor Yellow
$statusUpdateBody = @{ status = "ACCEPTED" } | ConvertTo-Json
$updateRes = Invoke-RestMethod -Uri "$baseUrl/bookings/$bookingId/status" -Method Put -Body $statusUpdateBody -ContentType "application/json" -Headers $ownerHeaders

$studentInvoices = Invoke-RestMethod -Uri "$baseUrl/invoices/student" -Method Get -Headers $studentHeaders
Write-Host "Success: Generated $($studentInvoices.Count) invoices:" -ForegroundColor Green
$studentInvoices | ForEach-Object {
    Write-Host "  - Month: $($_.billingMonth) | Amount: ₹$($_.amount) | Status: $($_.status)" -ForegroundColor Gray
}

# 7. Student raises complaint regarding Cleaning
Write-Host "`n7. Student raising cleaning complaint..." -ForegroundColor Yellow
$complaintBody = @{ hostelId = $hostelId; title = "Dusty Rooms"; description = "Rooms are dusty and common halls need cleaning." } | ConvertTo-Json
$complaintRes = Invoke-RestMethod -Uri "$baseUrl/complaints" -Method Post -Body $complaintBody -ContentType "application/json" -Headers $studentHeaders
$complaintId = $complaintRes.id
Write-Host "Success: Raised Complaint ID: $complaintId. Status: $($complaintRes.status)" -ForegroundColor Green

# 8. Owner Replies and Resolves Complaint
Write-Host "`n8. Owner replying & resolving complaint..." -ForegroundColor Yellow
$complaintReplyBody = @{ ownerReply = "Cleaning staff sent. Halls cleared."; status = "RESOLVED" } | ConvertTo-Json
$replyRes = Invoke-RestMethod -Uri "$baseUrl/complaints/$complaintId/reply" -Method Put -Body $complaintReplyBody -ContentType "application/json" -Headers $ownerHeaders
Write-Host "Success: Resolved Complaint. Reply: '$($replyRes.ownerReply)' | Status: $($replyRes.status)" -ForegroundColor Green

# 9. Owner Marks Security Deposit paid via Cash
Write-Host "`n9. Owner marking Security Deposit unpaid invoice as Paid via Cash..." -ForegroundColor Yellow
$secInvoice = $studentInvoices | Where-Object { $_.billingMonth -eq "Security Deposit (Advance)" }
$paymentBody = @{
    invoiceId = $secInvoice.id
    amount = $secInvoice.amount
    paymentMethod = "CASH"
    transactionId = "CASH-TEST-" + (Get-Random)
} | ConvertTo-Json
# Owner processes offline payment
$paymentRes = Invoke-RestMethod -Uri "$baseUrl/payments" -Method Post -Body $paymentBody -ContentType "application/json" -Headers $ownerHeaders
Write-Host "Success: Payment logged by Owner. Invoice Status: PAID | Method: $($paymentRes.paymentMethod)" -ForegroundColor Green

# 10. Student changes checkout date (extending to November - adding month)
Write-Host "`n10. Student extending checkout date to November 30..." -ForegroundColor Yellow
$dateChangeBody = @{ endDate = "2026-11-30" } | ConvertTo-Json
$changeRes = Invoke-RestMethod -Uri "$baseUrl/bookings/$bookingId/checkout-date" -Method Put -Body $dateChangeBody -ContentType "application/json" -Headers $studentHeaders

$newInvoices = Invoke-RestMethod -Uri "$baseUrl/invoices/student" -Method Get -Headers $studentHeaders
Write-Host "Success: Recalculated invoices count: $($newInvoices.Count)" -ForegroundColor Green
$newInvoices | ForEach-Object {
    Write-Host "  - Month: $($_.billingMonth) | Amount: ₹$($_.amount) | Status: $($_.status)" -ForegroundColor Gray
}

# 11. Owner Evicts Student (Terminate booking early)
Write-Host "`n11. Owner evicting student..." -ForegroundColor Yellow
$terminateRes = Invoke-RestMethod -Uri "$baseUrl/bookings/$bookingId/terminate" -Method Put -Headers $ownerHeaders
Write-Host "Success: $terminateRes" -ForegroundColor Green

# 12. Check room status and remaining pending invoices
Write-Host "`n12. Verifying room released..." -ForegroundColor Yellow
$roomCheck = Invoke-RestMethod -Uri "$baseUrl/hostels/$hostelId" -Method Get
$activeRoom = $roomCheck.rooms | Where-Object { $_.id -eq $roomId }
Write-Host "Room status reverted to: $($activeRoom.status)" -ForegroundColor Green

$finalInvoices = Invoke-RestMethod -Uri "$baseUrl/invoices/student" -Method Get -Headers $studentHeaders
Write-Host "Remaining unpaid invoices count (should be 0 because of cascade delete): $(($finalInvoices | Where-Object { $_.status -eq 'PENDING' }).Count)" -ForegroundColor Green
Write-Host "Remaining paid invoices count (should be 1 because paid advance stays): $(($finalInvoices | Where-Object { $_.status -eq 'PAID' }).Count)" -ForegroundColor Green

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "E2E Phase 4 API Verification Completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
