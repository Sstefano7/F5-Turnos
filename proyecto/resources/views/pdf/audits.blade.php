<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Auditorías</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #5a67d8;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            color: #5a67d8;
        }
        .header p {
            margin: 5px 0 0 0;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f4f6f8;
            color: #333;
            font-weight: bold;
        }
        .badge {
            padding: 3px 6px;
            border-radius: 4px;
            color: white;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-created { background-color: #48bb78; }
        .badge-updated { background-color: #ecc94b; color: #744210; }
        .badge-deleted { background-color: #f56565; }
    </style>
</head>
<body>

    <div class="header">
        <h1>Registro del Sistema - Auditorías</h1>
        <p>Fecha de emisión: {{ \Carbon\Carbon::now()->format('d/m/Y H:i') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Tabla (ID)</th>
                <th>Dirección IP</th>
            </tr>
        </thead>
        <tbody>
            @foreach($audits as $audit)
            <tr>
                <td>{{ $audit->created_at->format('d/m/Y H:i:s') }}</td>
                <td>{{ $audit->user ? $audit->user->name : 'Sistema' }}</td>
                <td>
                    @php
                        $color = 'grey';
                        $texto = $audit->event;
                        if($audit->event == 'created') { $color = 'created'; $texto = 'CREADO'; }
                        if($audit->event == 'updated') { $color = 'updated'; $texto = 'EDITADO'; }
                        if($audit->event == 'deleted') { $color = 'deleted'; $texto = 'ELIMINADO'; }
                    @endphp
                    <span class="badge badge-{{ $color }}">{{ $texto }}</span>
                </td>
                <td>
                    {{ class_basename($audit->auditable_type) }} (ID: {{ $audit->auditable_id }})
                </td>
                <td>{{ $audit->ip_address }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

</body>
</html>