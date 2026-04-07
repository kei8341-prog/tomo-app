$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
$env:NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = 'placeholder'
& 'C:\Program Files\nodejs\npm.cmd' run build 2>&1
