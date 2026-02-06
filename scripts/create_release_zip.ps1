# Create-ReleaseZip.ps1
# 목적: 소스 코드 배포를 위한 안전한 압축 파일 생성
# 기능: 불필요한 파일 및 보안 민감 파일 제외 후 압축

$projectName = "Currency_WebApp_Source"
$date = Get-Date -Format "yyyyMMdd_HHmm"
$zipFileName = "${projectName}_${date}.zip"
$sourceDir = ".\"
$excludeList = @(
    ".git",
    ".gitmodules",
    ".antigravityignore",
    "node_modules",
    "dev-guidelines",
    "scripts",
    "docs",          # 내부 문서 폴더 제외
    "GEMINI.md",     # 내부 개발 가이드 제외
    "CLAUDE.md",     # 내부 개발 가이드 제외
    "*.zip",
    "*.log",
    "backend/Code.gs" # 백엔드 키 포함 가능성 있으므로 주의 (또는 키 제거 버전만 포함)
)

# 임시 폴더 생성
$tempDir = Join-Path $env:TEMP "$projectName_$date"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# 파일 복사 (Robocopy 활용 - 제외 처리)
# /XD: 제외 폴더, /XF: 제외 파일
$excludeDirs = $excludeList | Where-Object { $_ -notlike "*.*" }
$excludeFiles = $excludeList | Where-Object { $_ -like "*.*" }

# Robocopy는 반환 코드가 0이 아닐 수 있어서 try-catch 대신 직접 실행
# 주요 소스 복사
robocopy $sourceDir $tempDir /E /XD $excludeDirs /XF $excludeFiles

# 압축 생성
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFileName -Force

# 임시 폴더 정리
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "✅ Release Zip Created: $zipFileName"
