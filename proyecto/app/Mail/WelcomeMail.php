<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $promoCode,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '¡Bienvenido a ' . config('app.name') . '!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.welcome',
            with: [
                'name' => $this->name,
                'promoCode' => $this->promoCode,
                'appName' => config('app.name'),
            ],
        );
    }
}