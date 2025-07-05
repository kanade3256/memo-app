# Fix imports for all moved components

# Notes components
Get-ChildItem -Path "src\components\notes" -Filter "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "from '\.\./firebase'", "from '../../config/firebase'"
    $content = $content -replace "from '\.\./contexts/", "from '../../contexts/"
    $content = $content -replace "from '\.\./types/", "from '../../types/"
    $content = $content -replace "from '\./SearchBar'", "from '../ui/SearchBar'"
    Set-Content -Path $_.FullName -Value $content
}

# Admin components  
Get-ChildItem -Path "src\components\admin" -Filter "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "from '\.\./firebase'", "from '../../config/firebase'"
    $content = $content -replace "from '\.\./contexts/", "from '../../contexts/"
    $content = $content -replace "from '\.\./types/", "from '../../types/"
    $content = $content -replace "from '\.\./utils/", "from '../../utils/"
    Set-Content -Path $_.FullName -Value $content
}

# Auth components
Get-ChildItem -Path "src\components\auth" -Filter "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "from '\.\./firebase'", "from '../../config/firebase'"
    $content = $content -replace "from '\.\./contexts/", "from '../../contexts/"
    $content = $content -replace "from '\.\./types/", "from '../../types/"
    $content = $content -replace "from '\./LoginHistory'", "from '../admin/LoginHistory'"
    Set-Content -Path $_.FullName -Value $content
}

# UI components
Get-ChildItem -Path "src\components\ui" -Filter "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "from '\.\./hooks/", "from '../../hooks/"
    $content = $content -replace "from '\.\./contexts/", "from '../../contexts/"
    $content = $content -replace "from '\.\./types/", "from '../../types/"
    Set-Content -Path $_.FullName -Value $content
}

# Threads components
Get-ChildItem -Path "src\components\threads" -Filter "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "from '\.\./types/", "from '../../types/"
    Set-Content -Path $_.FullName -Value $content
}

Write-Host "Import paths updated successfully!"
