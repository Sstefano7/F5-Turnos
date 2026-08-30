<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirma tu cuenta</title>
    <style>
        body { margin: 0; padding: 0; background: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; }
        .wrapper { padding: 32px 16px; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); padding: 40px 32px; }
        .logo { text-align: center; font-size: 22px; font-weight: 800; color: #16a34a; margin-bottom: 8px; }
        h1 { font-size: 22px; text-align: center; color: #111827; margin: 16px 0 12px; }
        p { font-size: 15px; line-height: 1.6; color: #4b5563; text-align: center; }
        .btn { display: block; text-align: center; background: #22c55e; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 16px; padding: 14px 20px; border-radius: 10px; margin: 24px auto; max-width: 280px; }
        .btn:hover { background: #16a34a; }
        .meta { font-size: 13px; color: #9ca3af; text-align: center; margin-top: 16px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="logo">&#9917; {{ $appName }}</div>
            <h1>Confirmá tu cuenta</h1>
            <p>¡Hola, {{ $name }}! Ya casi está.<br>Confirmá tu email para activar tu cuenta y empezar a reservar.</p>
            <a href="{{ $url }}" class="btn">Confirmar cuenta</a>
            <p style="font-size:13px;color:#6b7280;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br><span style="color:#2563eb;word-break:break-all;">{{ $url }}</span></p>
            <p class="meta">Si no creaste una cuenta en {{ $appName }}, podés ignorar este email.</p>
        </div>
    </div>
</body>
</html>