const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

class AuthDebugger {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.cookies = new Map();
        this.debugDir = path.join(__dirname, 'auth-debug');
        
        // Crea directory per i debug
        if (!fs.existsSync(this.debugDir)) {
            fs.mkdirSync(this.debugDir, { recursive: true });
        }
    }

    log(message, data = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
        if (data) {
            console.log(JSON.stringify(data, null, 2));
        }
    }

    saveCookies(response) {
        const setCookieHeader = response.headers.get('set-cookie');
        if (setCookieHeader) {
            const cookies = setCookieHeader.split(',');
            cookies.forEach(cookie => {
                const [nameValue] = cookie.split(';');
                const [name, value] = nameValue.split('=');
                if (name && value) {
                    this.cookies.set(name.trim(), value.trim());
                }
            });
            this.log(`🍪 Cookies salvati: ${Array.from(this.cookies.keys()).join(', ')}`);
        }
    }

    getCookieHeader() {
        if (this.cookies.size === 0) return '';
        return Array.from(this.cookies.entries())
            .map(([name, value]) => `${name}=${value}`)
            .join('; ');
    }

    async saveResponse(name, response, responseText) {
        const filename = `${name}-${Date.now()}.json`;
        const filepath = path.join(this.debugDir, filename);
        
        const debugData = {
            timestamp: new Date().toISOString(),
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseText,
            cookies: Object.fromEntries(this.cookies.entries())
        };
        
        fs.writeFileSync(filepath, JSON.stringify(debugData, null, 2));
        this.log(`💾 Risposta salvata in: ${filepath}`);
    }

    async testStep(name, url, options = {}) {
        this.log(`🔍 Testando: ${name}`);
        this.log(`📍 URL: ${url}`);
        
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ...options.headers
        };

        const cookieHeader = this.getCookieHeader();
        if (cookieHeader) {
            headers['Cookie'] = cookieHeader;
        }

        const requestOptions = {
            method: options.method || 'GET',
            headers,
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            requestOptions.body = JSON.stringify(options.body);
        }

        this.log(`📤 Request:`, {
            method: requestOptions.method,
            headers: requestOptions.headers,
            body: requestOptions.body
        });

        try {
            const response = await fetch(url, requestOptions);
            const responseText = await response.text();
            
            this.log(`📥 Response Status: ${response.status} ${response.statusText}`);
            this.log(`📥 Response Headers:`, Object.fromEntries(response.headers.entries()));
            
            // Salva cookies
            this.saveCookies(response);
            
            // Salva risposta per debug
            await this.saveResponse(name.replace(/[^a-zA-Z0-9]/g, '_'), response, responseText);
            
            let responseData;
            try {
                responseData = JSON.parse(responseText);
                this.log(`📥 Response JSON:`, responseData);
            } catch (e) {
                this.log(`📥 Response Text (primi 200 caratteri): ${responseText.substring(0, 200)}...`);
                responseData = responseText;
            }

            return {
                success: response.ok,
                status: response.status,
                data: responseData,
                response
            };
        } catch (error) {
            this.log(`❌ Errore durante ${name}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async debugCompleteAuth() {
        this.log('🚀 Inizio debug completo autenticazione');
        
        const testUser = {
            email: 'test@family.com',
            password: 'password123',
            name: 'Test User',
            familyName: 'Test Family'
        };

        // 1. Test registrazione
        const regResult = await this.testStep(
            '1_Registrazione',
            `${this.baseUrl}/api/auth/register`,
            {
                method: 'POST',
                body: testUser
            }
        );
        
        this.log(`✅ Registrazione: ${regResult.success ? 'OK' : 'FAILED'} (Status: ${regResult.status})`);

        // 2. Test sessione pre-login
        const preSessionResult = await this.testStep(
            '2_Sessione_Pre_Login',
            `${this.baseUrl}/api/auth/session`
        );
        
        this.log(`✅ Sessione Pre-Login: ${preSessionResult.success ? 'OK' : 'FAILED'} (Status: ${preSessionResult.status})`);

        // 3. Test credenziali
        const credResult = await this.testStep(
            '3_Test_Credenziali',
            `${this.baseUrl}/api/auth/credentials`,
            {
                method: 'POST',
                body: {
                    email: testUser.email,
                    password: testUser.password
                }
            }
        );
        
        this.log(`✅ Test Credenziali: ${credResult.success ? 'OK' : 'FAILED'} (Status: ${credResult.status})`);

        // 4. Test NextAuth signin (usando callback credentials)
        const signinResult = await this.testStep(
            '4_NextAuth_Signin',
            `${this.baseUrl}/api/auth/callback/credentials`,
            {
                method: 'POST',
                body: {
                    username: testUser.email,
                    password: testUser.password,
                    callbackUrl: this.baseUrl,
                    csrfToken: 'test-csrf-token'
                }
            }
        );
        
        this.log(`✅ NextAuth Signin: ${signinResult.success ? 'OK' : 'FAILED'} (Status: ${signinResult.status})`);

        // 5. Test sessione post-login
        const postSessionResult = await this.testStep(
            '5_Sessione_Post_Login',
            `${this.baseUrl}/api/auth/session`
        );
        
        this.log(`✅ Sessione Post-Login: ${postSessionResult.success ? 'OK' : 'FAILED'} (Status: ${postSessionResult.status})`);

        // 6. Test API protetta (famiglia)
        const familyResult = await this.testStep(
            '6_Test_API_Famiglia',
            `${this.baseUrl}/api/family`,
            {
                method: 'POST',
                body: {
                    name: 'Test Family Debug',
                    description: 'Famiglia di test per debug'
                }
            }
        );
        
        this.log(`✅ Test API Famiglia: ${familyResult.success ? 'OK' : 'FAILED'} (Status: ${familyResult.status})`);

        // 7. Test logout
        const logoutResult = await this.testStep(
            '7_Test_Logout',
            `${this.baseUrl}/api/auth/signout`,
            {
                method: 'POST'
            }
        );
        
        this.log(`✅ Test Logout: ${logoutResult.success ? 'OK' : 'FAILED'} (Status: ${logoutResult.status})`);

        // Riepilogo finale
        this.log('\n============================================================');
        this.log('📊 RIEPILOGO DEBUG AUTENTICAZIONE');
        this.log('============================================================');
        this.log(`1. Registrazione: ${regResult.status}`);
        this.log(`2. Sessione Pre-Login: ${preSessionResult.status}`);
        this.log(`3. Test Credenziali: ${credResult.status}`);
        this.log(`4. NextAuth Signin: ${signinResult.status}`);
        this.log(`5. Sessione Post-Login: ${postSessionResult.status}`);
        this.log(`6. Test API Famiglia: ${familyResult.status}`);
        this.log(`7. Test Logout: ${logoutResult.status}`);
        this.log('============================================================');
        
        return {
            registrazione: regResult,
            preSession: preSessionResult,
            credenziali: credResult,
            signin: signinResult,
            postSession: postSessionResult,
            famiglia: familyResult,
            logout: logoutResult
        };
    }
}

// Esecuzione
if (require.main === module) {
    const args = process.argv.slice(2);
    const environment = args[0] || 'local';
    
    const baseUrl = environment === 'vercel' 
        ? 'https://gestionale-spese-famiglia-pwa.vercel.app'
        : 'http://localhost:3000';
    
    console.log(`🔍 Debug autenticazione su: ${baseUrl}`);
    
    const authDebugger = new AuthDebugger(baseUrl);
    authDebugger.debugCompleteAuth()
        .then(results => {
            console.log('\n🎯 Debug completato!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Errore durante il debug:', error);
            process.exit(1);
        });
}

module.exports = AuthDebugger;