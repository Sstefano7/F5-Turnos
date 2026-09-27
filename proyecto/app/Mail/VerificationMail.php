<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $token,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Confirma tu cuenta - ' . config('app.name'),
        );
    }

    public function content(): Content
    {
        $url = rtrim((string) config('app.frontend_url'), '/')
            . '/verify-email/' . $this->token;

        return new Content(
            view: 'emails.verification',
            with: [
                'name' => $this->name,
                'url' => $url,
                'appName' => config('app.name'),
            ],
        );
    }
}