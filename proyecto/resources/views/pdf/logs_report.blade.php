<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Logs del Sistema</title>
    <style>
        body { font-family: 'Courier', monospace; font-size: 9px; color: #333; }
        h1 { font-family: sans-serif; text-align: center; color: #2c3e50; }
        .log-entry { 
            padding: 5px; 
            border-bottom: 1px solid #ddd; 
            word-wrap: break-word; /* Crucial para logs largos */
        }
        .error-line { background-color: #fce4e4; color: #c0392b; }
        .info-line { color: #2980b9; }
    </style>
</head>
<body>
    <h1>Reporte de Logs Recientes</h1>
    
    <div>
        @foreach($logs as $log)
            <div class="log-entry {{ str_contains(strtolower($log), 'error') ? 'error-line' : '' }}">
                {{ $log }}
            </div>
        @endforeach
    </div>
</body>
</html>