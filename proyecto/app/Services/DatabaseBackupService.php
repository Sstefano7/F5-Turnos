<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use ZipArchive;

class DatabaseBackupService
{
    /**
     * Obtiene la configuración de Supabase Storage
     */
    protected static function getSupabaseConfig(): array
    {
        return [
            'url' => rtrim(env('SUPABASE_URL', ''), '/'),
            'key' => env('SUPABASE_SERVICE_KEY', env('SUPABASE_KEY', '')),
            'bucket' => env('SUPABASE_BUCKET', 'turnos-storage'),
        ];
    }

    /**
     * Genera un backup completo de la base de datos PostgreSQL, lo comprime en ZIP y lo sube a Supabase Storage.
     */
    public static function createBackup(): array
    {
        $config = self::getSupabaseConfig();
        if (empty($config['url']) || empty($config['key'])) {
            throw new \Exception('Las credenciales de Supabase no están configuradas correctamente en el entorno.');
        }

        $pdo = DB::connection()->getPdo();
        $appName = config('app.name', 'F5-Turnos');
        $dateStr = Carbon::now('America/Argentina/Buenos_Aires')->format('Y-m-d_H-i-s');
        $cleanAppName = preg_replace('/[^A-Za-z0-9_-]/', '_', $appName);
        $fileName = "backup_{$cleanAppName}_{$dateStr}.zip";
        $sqlFileName = "database_{$cleanAppName}_{$dateStr}.sql";

        // Usamos sys_get_temp_dir() para compatibilidad con entornos Serverless (Vercel /tmp) y Windows (%TEMP%)
        $tempDir = rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . 'backup_' . uniqid();
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0777, true);
        }

        $sqlFilePath = $tempDir . DIRECTORY_SEPARATOR . $sqlFileName;
        $zipFilePath = $tempDir . DIRECTORY_SEPARATOR . $fileName;

        try {
            $handle = fopen($sqlFilePath, 'w');
            if (!$handle) {
                throw new \Exception("No se pudo crear el archivo temporal de dump en: {$sqlFilePath}");
            }

            fwrite($handle, "-- ========================================================\n");
            fwrite($handle, "-- F5 Turnos Database Backup (PostgreSQL / Supabase)\n");
            fwrite($handle, "-- Fecha: " . Carbon::now('America/Argentina/Buenos_Aires')->format('d/m/Y H:i:s') . "\n");
            fwrite($handle, "-- Aplicación: {$appName}\n");
            fwrite($handle, "-- ========================================================\n\n");
            fwrite($handle, "SET statement_timeout = 0;\n");
            fwrite($handle, "SET client_encoding = 'UTF8';\n");
            fwrite($handle, "SET standard_conforming_strings = on;\n");
            fwrite($handle, "SET check_function_bodies = false;\n");
            fwrite($handle, "SET client_min_messages = warning;\n\n");

            // Obtenemos todas las tablas de la base de datos (esquema public)
            $tables = DB::select("
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                  AND table_type = 'BASE TABLE'
                ORDER BY table_name
            ");

            foreach ($tables as $t) {
                $tableName = $t->table_name;
                fwrite($handle, "\n-- --------------------------------------------------------\n");
                fwrite($handle, "-- Estructura y datos de la tabla \"{$tableName}\"\n");
                fwrite($handle, "-- --------------------------------------------------------\n");
                fwrite($handle, "TRUNCATE TABLE \"{$tableName}\" CASCADE;\n");

                $columns = DB::select("
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                      AND table_name = ?
                    ORDER BY ordinal_position
                ", [$tableName]);

                if (empty($columns)) {
                    continue;
                }

                $colNames = array_map(fn($c) => '"' . $c->column_name . '"', $columns);
                $colList = implode(', ', $colNames);

                $rows = DB::table($tableName)->get();
                if ($rows->count() > 0) {
                    $batchValues = [];
                    foreach ($rows as $row) {
                        $rowArray = (array) $row;
                        $escapedValues = [];
                        foreach ($columns as $col) {
                            $colName = $col->column_name;
                            $val = $rowArray[$colName] ?? null;

                            if ($val === null) {
                                $escapedValues[] = 'NULL';
                            } elseif (is_bool($val)) {
                                $escapedValues[] = $val ? 'TRUE' : 'FALSE';
                            } elseif (is_numeric($val) && !in_array($col->data_type, ['text', 'character varying', 'varchar', 'char', 'json', 'jsonb'])) {
                                $escapedValues[] = $val;
                            } else {
                                $escapedValues[] = $pdo->quote((string)$val);
                            }
                        }
                        $batchValues[] = '(' . implode(', ', $escapedValues) . ')';

                        if (count($batchValues) >= 100) {
                            fwrite($handle, "INSERT INTO \"{$tableName}\" ({$colList}) VALUES\n" . implode(",\n", $batchValues) . ";\n");
                            $batchValues = [];
                        }
                    }

                    if (!empty($batchValues)) {
                        fwrite($handle, "INSERT INTO \"{$tableName}\" ({$colList}) VALUES\n" . implode(",\n", $batchValues) . ";\n");
                    }
                }
            }

            // Actualizar secuencias automáticas
            $sequences = DB::select("
                SELECT sequence_name 
                FROM information_schema.sequences 
                WHERE sequence_schema = 'public'
            ");

            if (!empty($sequences)) {
                fwrite($handle, "\n-- --------------------------------------------------------\n");
                fwrite($handle, "-- Actualización de secuencias\n");
                fwrite($handle, "-- --------------------------------------------------------\n");
                foreach ($sequences as $seq) {
                    $seqName = $seq->sequence_name;
                    if (preg_match('/^([a-zA-Z0-9_]+)_id_seq$/', $seqName, $m)) {
                        $targetTable = $m[1];
                        fwrite($handle, "SELECT setval('\"{$seqName}\"', COALESCE((SELECT MAX(id) FROM \"{$targetTable}\"), 1), true);\n");
                    }
                }
            }

            fclose($handle);

            // Comprimir archivo SQL en ZIP
            $zip = new ZipArchive();
            if ($zip->open($zipFilePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                throw new \Exception("No se pudo crear el archivo ZIP del backup.");
            }

            $zip->addFile($sqlFilePath, $sqlFileName);
            $zip->close();

            $fileSize = filesize($zipFilePath);
            $fileContent = file_get_contents($zipFilePath);

            // Subir a Supabase Storage mediante REST API
            $uploadUrl = "{$config['url']}/storage/v1/object/{$config['bucket']}/backups/{$fileName}";
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$config['key']}",
                'apikey' => $config['key'],
                'Content-Type' => 'application/zip',
            ])->withBody($fileContent, 'application/zip')->post($uploadUrl);

            if (!$response->successful()) {
                throw new \Exception('Error al subir el backup a Supabase Storage: ' . $response->body());
            }

            return [
                'name' => $fileName,
                'size' => round($fileSize / 1048576, 2) . ' MB',
                'date' => Carbon::now('America/Argentina/Buenos_Aires')->format('d/m/Y H:i:s'),
                'timestamp' => Carbon::now()->timestamp,
            ];
        } finally {
            // Limpieza garantizada de archivos temporales
            if (file_exists($sqlFilePath)) {
                @unlink($sqlFilePath);
            }
            if (file_exists($zipFilePath)) {
                @unlink($zipFilePath);
            }
            if (is_dir($tempDir)) {
                @rmdir($tempDir);
            }
        }
    }

    /**
     * Lista todos los backups existentes en Supabase Storage.
     */
    public static function listBackups(): array
    {
        $config = self::getSupabaseConfig();
        if (empty($config['url']) || empty($config['key'])) {
            return [];
        }

        $listUrl = "{$config['url']}/storage/v1/object/list/{$config['bucket']}";

        // Consultar archivos dentro del prefijo 'backups'
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$config['key']}",
            'apikey' => $config['key'],
            'Content-Type' => 'application/json',
        ])->post($listUrl, [
            'prefix' => 'backups',
            'limit' => 100,
        ]);

        $backups = [];
        if ($response->successful()) {
            $items = $response->json() ?? [];
            foreach ($items as $item) {
                $name = $item['name'] ?? '';
                if (pathinfo($name, PATHINFO_EXTENSION) === 'zip') {
                    $size = $item['metadata']['size'] ?? 0;
                    $createdAt = $item['created_at'] ?? now();
                    $carbon = Carbon::parse($createdAt)->setTimezone('America/Argentina/Buenos_Aires');

                    $backups[] = [
                        'name' => $name,
                        'size' => round($size / 1048576, 2) . ' MB',
                        'date' => $carbon->format('d/m/Y H:i:s'),
                        'timestamp' => $carbon->timestamp,
                    ];
                }
            }
        }

        // Consultar también archivos en la raíz (por si hay backups previos guardados allí)
        $rootResponse = Http::withHeaders([
            'Authorization' => "Bearer {$config['key']}",
            'apikey' => $config['key'],
            'Content-Type' => 'application/json',
        ])->post($listUrl, [
            'prefix' => '',
            'limit' => 100,
        ]);

        if ($rootResponse->successful()) {
            $rootItems = $rootResponse->json() ?? [];
            foreach ($rootItems as $item) {
                $name = $item['name'] ?? '';
                if (pathinfo($name, PATHINFO_EXTENSION) === 'zip') {
                    // Evitar duplicados
                    $alreadyAdded = false;
                    foreach ($backups as $b) {
                        if ($b['name'] === $name) {
                            $alreadyAdded = true;
                            break;
                        }
                    }
                    if (!$alreadyAdded) {
                        $size = $item['metadata']['size'] ?? 0;
                        $createdAt = $item['created_at'] ?? now();
                        $carbon = Carbon::parse($createdAt)->setTimezone('America/Argentina/Buenos_Aires');

                        $backups[] = [
                            'name' => $name,
                            'size' => round($size / 1048576, 2) . ' MB',
                            'date' => $carbon->format('d/m/Y H:i:s'),
                            'timestamp' => $carbon->timestamp,
                        ];
                    }
                }
            }
        }

        usort($backups, fn($a, $b) => $b['timestamp'] - $a['timestamp']);

        return $backups;
    }

    /**
     * Descarga el contenido binario de un backup desde Supabase Storage.
     */
    public static function downloadBackup(string $fileName)
    {
        $config = self::getSupabaseConfig();
        $cleanName = basename($fileName);

        // Primero buscar en backups/
        $downloadUrl = "{$config['url']}/storage/v1/object/{$config['bucket']}/backups/{$cleanName}";
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$config['key']}",
            'apikey' => $config['key'],
        ])->get($downloadUrl);

        // Si no se encuentra con el prefijo backups/, buscar en la raíz
        if (!$response->successful()) {
            $rootDownloadUrl = "{$config['url']}/storage/v1/object/{$config['bucket']}/{$cleanName}";
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$config['key']}",
                'apikey' => $config['key'],
            ])->get($rootDownloadUrl);
        }

        if (!$response->successful()) {
            return null;
        }

        return $response->body();
    }

    /**
     * Elimina un backup de Supabase Storage.
     */
    public static function deleteBackup(string $fileName): bool
    {
        $config = self::getSupabaseConfig();
        $cleanName = basename($fileName);

        $deleteUrl = "{$config['url']}/storage/v1/object/{$config['bucket']}";
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$config['key']}",
            'apikey' => $config['key'],
            'Content-Type' => 'application/json',
        ])->delete($deleteUrl, [
            'prefixes' => ["backups/{$cleanName}", $cleanName]
        ]);

        return $response->successful();
    }
}
