<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Errores</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 11px; color: #333; line-height: 1.4; }
        h1 { text-align: center; color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: left; word-wrap: break-word; }
        th { background-color: #f8f9fa; font-weight: bold; text-transform: uppercase; font-size: 10px; }
        .meta { font-size: 9px; color: #666; }
        .prioridad-media { color: #d35400; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Reporte de Incidencias</h1>
    
    <table>
        <thead>
            <tr>
                <th style="width: 30px;">ID</th>
                <th>Título / Tipo</th>
                <th>Descripción</th>
                <th>Estado / Prioridad</th>
                <th>Pasos</th>
                <th>Fecha</th>
            </tr>
        </thead>
        <tbody>
            @forelse($bugs ?? [] as $bug)
            <tr>
                <td>{{ $bug->id }}</td>
                <td>
                    <strong>{{ $bug->titulo ?? 'Sin título' }}</strong><br>
                    <small>Tipo: {{ $bug->tipo ?? 'N/A' }}</small>
                </td>
                <td>{{ $bug->descripcion ?? 'Sin descripción' }}</td>
                <td>
                    <span>{{ str_replace('_', ' ', $bug->estado) ?? 'N/A' }}</span><br>
                    <small class="prioridad-{{ $bug->prioridad }}">P: {{ $bug->prioridad ?? 'N/A' }}</small>
                </td>
                <td>{{ $bug->pasos_reproducir ?? 'No especificados' }}</td>
                <td>{{ optional($bug->created_at)->format('d/m/Y H:i') ?? 'N/A' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="6" style="text-align: center;">No hay registros disponibles.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div style="margin-top: 30px;" class="meta">
        <p>URL de origen: {{ $bugs->first()->pagina ?? 'N/A' }}</p>
    </div>
</body>
</html>