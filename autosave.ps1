# ========================================================
# CAMPUS MARKETPLACE - AUTO SAVE TO GITHUB (POWERSHELL)
# Repository: MinhPhuong292005/Campus-Marketplace
# ========================================================

$repoPath = $PSScriptRoot
Set-Location $repoPath

Write-Host ">>> [1/3] Quét và thêm tất cả thay đổi (git add)..." -ForegroundColor Cyan
git add .

$status = git status --porcelain
if ($status) {
    $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host ">>> [2/3] Thực hiện commit: auto-save ($now)..." -ForegroundColor Cyan
    git commit -m "auto-save: $now - Cập nhật Phenikaa Campus Marketplace"
} else {
    Write-Host ">>> Không có thay đổi mới chưa commit." -ForegroundColor Green
}

Write-Host ">>> [3/3] Đẩy lên GitHub (origin main)..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ">>> [THÀNH CÔNG] Đã lưu và đồng bộ mã nguồn lên GitHub thành công!" -ForegroundColor Green
} else {
    Write-Host ">>> [LƯU Ý] Nếu lệnh push cần xác thực GitHub, bạn hãy đăng nhập qua cửa sổ trình duyệt bật lên hoặc cung cấp Personal Access Token." -ForegroundColor Yellow
}
