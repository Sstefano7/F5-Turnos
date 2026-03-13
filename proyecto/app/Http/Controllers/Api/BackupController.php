<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Carbon\Carbon;
// 👇 IMPORTAMOS EL CREADOR DE TERMINALES VIRTUALES 👇
use Symfony\Component\Process\Process; 

class BackupController extends Controller
{
   // 1. Crear un nuevo backup
    // 1. Crear un nuevo backup
    public function create()
    {
        try {
            set_time_limit(300); 

            $process = new Process([PHP_BINARY, 'artisan', 'backup:run', '--disable-notifications']);
            
            $process->setWorkingDirectory(base_path());
            $process->setTimeout(300);
            
            //Le agregamos las carpetas TEMP y TMP a Windows
            $process->setEnv([
                'SystemRoot' => getenv('SystemRoot') ?: 'C:\\Windows',
                'PATH' => getenv('PATH'),
                'TEMP' => getenv('TEMP') ?: sys_get_temp_dir(),
                'TMP' => getenv('TMP') ?: sys_get_temp_dir(),
            ]);

            $process->run();

            if (!$process->isSuccessful()) {
                $errorReal = $process->getErrorOutput() ?: $process->getOutput();
                return response()->json(['error' => "Detalle de consola:\n" . $errorReal], 500);
            }

            return response()->json(['message' => 'Backup generado exitosamente.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error fatal: ' . $e->getMessage()], 500);
        }
    }

    // 2. Listar todos los backups existentes (Queda igual)
    public function index()
    {
        $files = Storage::disk('local')->allFiles();
        $backups = [];
        foreach ($files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'zip') {
                $backups[] = [
                    'name' => basename($file),
                    'size' => round(Storage::disk('local')->size($file) / 1048576, 2) . ' MB',
                    'date' => Carbon::createFromTimestamp(Storage::disk('local')->lastModified($file))
                                ->setTimezone('America/Argentina/Buenos_Aires')
                                ->format('d/m/Y H:i:s'),
                    'timestamp' => Storage::disk('local')->lastModified($file) 
                ];
            }
        }

        usort($backups, function($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });

        return response()->json($backups);
    }

    // 3. Descargar un backup específico (Queda igual, usando la ruta absoluta que solucionó la línea roja)
    public function download($fileName)
    {
        $files = Storage::disk('local')->allFiles();
        
        foreach ($files as $file) {
            if (basename($file) === $fileName) {
                $rutaAbsoluta = storage_path('app/' . $file);
                return response()->download($rutaAbsoluta);
            }
        }
        
        return response()->json(['error' => 'Archivo de backup no encontrado'], 404);
    }
}