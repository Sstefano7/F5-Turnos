<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Pagos</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #333;
            margin: 0;
            padding: 10px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #16a34a;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            color: #16a34a;
            font-size: 20px;
        }
        .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 11px;
        }
        .summary {
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f8fafc;
            border-left: 4px solid #16a34a;
            border-radius: 4px;
        }
        .summary table {
            width: 100%;
            border: none;
            margin: 0;
        }
        .summary td {
            border: none;
            padding: 4px 8px;
            font-size: 12px;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        table.data-table th, table.data-table td {
            border: 1px solid #ddd;
            padding: 6px 8px;
            text-align: left;
        }
        table.data-table th {
            background-color: #f1f5f9;
            color: #1e293b;
            font-weight: bold;
            font-size: 11px;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-pendiente { background-color: #fef08a; color: #854d0e; }
        .badge-pagado { background-color: #bbf7d0; color: #166534; }
        .badge-fallido { background-color: #fecaca; color: #991b1b; }
        .badge-reembolsado { background-color: #e2e8f0; color: #334155; }
        .text-right { text-align: right; }
        .total-row {
            font-weight: bold;
            background-color: #f8fafc;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1>F5 Turnos - Reporte de Pagos</h1>
        <p>Fecha de emisión: {{ \Carbon\Carbon::now()->format('d/m/Y H:i') }}</p>
    </div>

    <div class="summary">
        <table>
            <tr>
                <td><strong>Total de Registros:</strong> {{ count($pagos) }}</td>
                <td class="text-right"><strong>Monto Total Recaudado:</strong> ${{ number_format($pagos->where('estado', 'pagado')->sum('monto'), 2, ',', '.') }}</td>
            </tr>
        </table>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th>#</th>
                <th>Turno</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Referencia</th>
                <th>Fecha Pago</th>
            </tr>
        </thead>
        <tbody>
            @forelse($pagos as $pago)
            <tr>
                <td>{{ $pago->id }}</td>
                <td>
                    @if($pago->turno)
                        #{{ $pago->turno->id }} ({{ $pago->turno->cancha ? $pago->turno->cancha->nombre : 'Cancha N/A' }})
                    @else
                        -
                    @endif
                </td>
                <td>
                    @if($pago->turno && $pago->turno->cliente)
                        {{ $pago->turno->cliente->nombre }} {{ $pago->turno->cliente->apellido }}
                    @else
                        Consumidor Final
                    @endif
                </td>
                <td class="text-right">${{ number_format($pago->monto, 2, ',', '.') }}</td>
                <td style="text-transform: capitalize;">{{ $pago->metodo_pago }}</td>
                <td>
                    <span class="badge badge-{{ $pago->estado }}">{{ $pago->estado }}</span>
                </td>
                <td>{{ $pago->referencia ?: '-' }}</td>
                <td>
                    {{ $pago->fecha_pago ? \Carbon\Carbon::parse($pago->fecha_pago)->format('d/m/Y H:i') : ($pago->created_at ? $pago->created_at->format('d/m/Y H:i') : '-') }}
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">
                    No se encontraron pagos registrados con los filtros aplicados.
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>

</body>
</html>
