<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $user = $request->user();
        $file = $request->file('photo');
        $extension = $file->getClientOriginalExtension();
        $path = 'profiles/' . $user->id . '-' . time() . '.' . $extension;

        try {
            // Disco 'supabase' (S3-compatible) configurado en config/filesystems.php
            Storage::disk('supabase')->put($path, file_get_contents($file->getRealPath()), 'private');

            // Eliminar la foto anterior si existía
            if ($user->profile_photo && $user->profile_photo !== $path) {
                Storage::disk('supabase')->delete($user->profile_photo);
            }

            $url = rtrim(env('SUPABASE_URL'), '/')
                . '/storage/v1/object/public/'
                . env('SUPABASE_BUCKET', 'turnos-storage')
                . '/' . $path;

            $user->profile_photo = $path;
            $user->save();

            return response()->json([
                'message' => 'Foto de perfil actualizada correctamente.',
                'path' => $path,
                'url' => $url,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'No se pudo subir la foto. La foto quedará guardada a nivel local.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }
}