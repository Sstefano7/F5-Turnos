<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¡Bienvenido!</title>
    <style>
        body { margin: 0; padding: 0; background: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; }
        .wrapper { padding: 32px 16px; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); padding: 40px 32px; }
        .logo { text-align: center; font-size: 22px; font-weight: 800; color: #16a34a; margin-bottom: 8px; }
        h1 { font-size: 22px; text-align: center; color: #111827; margin: 16px 0 12px; }
        p { font-size: 15px; line-height: 1.6; color: #4b5563; text-align: center; }
        .promo { max-width: 280px; margin: 20px auto; background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 18px; text-align: center; }
        .promo label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; font-weight: 700; display: block; margin-bottom: 6px; }
        .promo-code { font-size: 24px; font-weight: 800; color: #15803d; letter-spacing: 1px; font-family: 'JetBrains Mono', 'Fira Code', monospace; }
        ol { font-size: 14px; color: #4b5563; line-height: 1.9; max-width: 420px; margin: 0 auto; padding-left: 20px; }
        .footer { text-align: center; margin-top: 24px; font-size: 13px; color: #9ca3af; }
        .footer a { color: #3b82f6; text-decoration: none; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="logo">&#9917; {{ $appName }}</div>
            <h1>¡Bienvenido, {{ $name }}!</h1>
            <p>Tu cuenta fue creada con éxito. Guardá tu código de descuento para la primera reserva:</p>
            <div class="promo">
                <label>Código de bienvenida</label>
                <div class="promo-code">{{ $promoCode }}</div>
            </div>
            <p style="text-align:left;font-weight:600;">Cómo empezar:</p>
            <ol>
                <li>Elegí tu cancha preferida (Fútbol 5 o Pádel)</li>
                <li>Seleccioná día y horario disponible</li>
                <li>Pagás en el local y aplicás tu código de bienvenida</li>
                <li>Recordá: cancelaciones con menos de 24&nbsp;hs pueden tener penalización</li>
            </ol>
            <p class="footer">
                ¿Necesitás ayuda? Escribinos y te respondemos a la brevedad.<br>
                <a href="#">Términos y Condiciones</a> &middot; <a href="#">Política de Privacidad</a>
            </p>
        </div>
    </div>
</body>
</html>