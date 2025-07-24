import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

// POST /api/auth/signout
export async function POST(request: NextRequest) {
    try {
        // Verifica autenticazione (opzionale per logout)
        const session = await getServerSession(authOptions);
        
        // Anche se non c'è sessione, permettiamo il logout
        // per pulire eventuali cookie residui
        
        // Per NextAuth, il logout viene gestito dal route handler [...nextauth]
        // Questo endpoint può essere usato per logout personalizzato
        
        // Restituisci successo per il logout
        return NextResponse.json(
            { 
                message: "Logout effettuato con successo",
                success: true 
            },
            { 
                status: 200,
                headers: {
                    // Pulisci i cookie di sessione
                    'Set-Cookie': [
                        'next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=lax',
                        'next-auth.csrf-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=lax',
                        '__Secure-next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=lax'
                    ]
                }
            }
        );
        
    } catch (error) {
        console.error('Errore in POST /api/auth/signout:', error);
        return NextResponse.json(
            { 
                error: 'Errore interno del server',
                message: 'Logout fallito' 
            },
            { status: 500 }
        );
    }
}

// GET /api/auth/signout (per compatibilità)
export async function GET(request: NextRequest) {
    // Redirect al logout di NextAuth
    return NextResponse.redirect(new URL('/api/auth/signout', request.url));
}
