#!/usr/bin/env node

/**
 * 🔍 DEBUG TEST SUITE AVANZATA
 * Sistema di test con debug dettagliato per autenticazione e API
 * Versione migliorata con logging esteso e analisi errori
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// Configurazione estesa
const CONFIG = {
    LOCAL_URL: 'http://localhost:3000',
    VERCEL_URL: 'https://gestionale-spese-famiglia-pwa.vercel.app',
    TEST_USER: {
        familyName: 'Famiglia Debug Test',
        adminName: 'Debug Test Admin',
        adminUsername: 'debugtest_admin',
        adminPassword: 'debugpassword123',
        email: 'debug@family.com',
        username: 'debugtest_admin',
        password: 'debugpassword123',
        name: 'Debug Test Admin'
    },
    TIMEOUT: 15000,
    RETRY_COUNT: 2,
    DELAY_BETWEEN_TESTS: 1000,
    DEBUG_MODE: true,
    SAVE_RESPONSES: true
};

// Colori per output console
const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Utility per logging avanzato
function log(message, color = 'reset', prefix = '') {
    const timestamp = new Date().toISOString();
    console.log(`${COLORS[color]}[${timestamp}] ${prefix}${message}${COLORS.reset}`);
}

function success(message) { log(`✅ ${message}`, 'green'); }
function error(message) { log(`❌ ${message}`, 'red'); }
function warning(message) { log(`⚠️  ${message}`, 'yellow'); }
function info(message) { log(`ℹ️  ${message}`, 'blue'); }
function debug(message) { 
    if (CONFIG.DEBUG_MODE) {
        log(`🔍 ${message}`, 'cyan', 'DEBUG: ');
    }
}
function critical(message) { log(`🚨 ${message}`, 'red', 'CRITICAL: '); }
function step(message) { log(`📋 ${message}`, 'magenta', 'STEP: '); }

// HTTP client con debug esteso
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        debug(`Richiesta: ${options.method || 'GET'} ${url}`);
        debug(`Headers: ${JSON.stringify(options.headers || {})}`);
        if (options.body) {
            debug(`Body: ${JSON.stringify(options.body)}`);
        }
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Gestionale-Debug-Suite/2.0',
                'Accept': 'application/json, text/html, */*',
                ...options.headers
            },
            timeout: CONFIG.TIMEOUT
        };
        
        const req = client.request(requestOptions, (res) => {
            let data = '';
            
            debug(`Risposta ricevuta: Status ${res.statusCode}`);
            debug(`Response Headers: ${JSON.stringify(res.headers)}`);
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                debug(`Response Body Length: ${data.length} chars`);
                debug(`Response Body Preview: ${data.substring(0, 200)}...`);
                
                let parsedData;
                try {
                    parsedData = JSON.parse(data);
                    debug('Response successfully parsed as JSON');
                } catch (parseError) {
                    debug(`JSON parse failed: ${parseError.message}`);
                    parsedData = data;
                }
                
                const response = {
                    status: res.statusCode,
                    headers: res.headers,
                    data: parsedData,
                    rawData: data
                };
                
                resolve(response);
            });
        });
        
        req.on('error', (err) => {
            debug(`Request error: ${err.message}`);
            reject(err);
        });
        
        req.on('timeout', () => {
            debug('Request timeout occurred');
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (options.body) {
            const bodyString = JSON.stringify(options.body);
            debug(`Writing body: ${bodyString}`);
            req.write(bodyString);
        }
        
        req.end();
    });
}

// Retry wrapper con debug
async function withRetry(fn, retries = CONFIG.RETRY_COUNT, testName = 'Unknown') {
    for (let i = 0; i < retries; i++) {
        try {
            debug(`Tentativo ${i + 1}/${retries} per ${testName}`);
            const result = await fn();
            if (i > 0) {
                info(`${testName} riuscito al tentativo ${i + 1}`);
            }
            return result;
        } catch (error) {
            debug(`Tentativo ${i + 1} fallito per ${testName}: ${error.message}`);
            if (i === retries - 1) {
                critical(`Tutti i tentativi falliti per ${testName}`);
                throw error;
            }
            const delay = 1000 * (i + 1);
            warning(`Tentativo ${i + 1} fallito, riprovo tra ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Debug Test Suite con analisi avanzata
class DebugTestSuite {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.authToken = null;
        this.sessionCookies = [];
        this.csrfToken = null;
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: [],
            debugInfo: {
                environment: baseUrl.includes('localhost') ? 'local' : 'vercel',
                startTime: new Date().toISOString(),
                authFlow: [],
                apiCalls: [],
                errors: []
            }
        };
    }
    
    // Salva risposta per debug
    saveResponse(testName, response) {
        if (!CONFIG.SAVE_RESPONSES) return;
        
        const filename = `debug-response-${testName.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.json`;
        const filepath = path.join(__dirname, 'debug-responses', filename);
        
        // Crea directory se non esiste
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        try {
            fs.writeFileSync(filepath, JSON.stringify({
                testName,
                timestamp: new Date().toISOString(),
                response
            }, null, 2));
            debug(`Risposta salvata in: ${filepath}`);
        } catch (err) {
            warning(`Impossibile salvare risposta: ${err.message}`);
        }
    }
    
    // Analizza errori di autenticazione
    analyzeAuthError(response, testName) {
        const analysis = {
            testName,
            status: response.status,
            timestamp: new Date().toISOString(),
            analysis: []
        };
        
        switch (response.status) {
            case 401:
                analysis.analysis.push('🔐 Errore di autenticazione - credenziali non valide o sessione scaduta');
                analysis.analysis.push('💡 Verifica username/password o rigenera sessione');
                break;
            case 403:
                analysis.analysis.push('🚫 Accesso negato - utente autenticato ma senza permessi');
                analysis.analysis.push('💡 Verifica ruoli utente e autorizzazioni');
                break;
            case 405:
                analysis.analysis.push('🚷 Metodo HTTP non consentito');
                analysis.analysis.push('💡 Verifica che l\'endpoint supporti il metodo utilizzato');
                break;
            case 422:
                analysis.analysis.push('📝 Dati di input non validi');
                analysis.analysis.push('💡 Controlla formato e validazione dei dati inviati');
                break;
            case 500:
                analysis.analysis.push('💥 Errore interno del server');
                analysis.analysis.push('💡 Controlla logs del server e configurazione database');
                break;
            default:
                analysis.analysis.push(`❓ Status code inaspettato: ${response.status}`);
        }
        
        // Analizza headers per ulteriori indizi
        if (response.headers) {
            if (response.headers['set-cookie']) {
                analysis.analysis.push('🍪 Server ha impostato nuovi cookie');
            }
            if (response.headers['www-authenticate']) {
                analysis.analysis.push('🔑 Server richiede autenticazione specifica');
            }
        }
        
        // Analizza contenuto risposta
        if (response.data) {
            if (typeof response.data === 'string' && response.data.includes('signin')) {
                analysis.analysis.push('🔄 Risposta contiene riferimenti a signin - possibile redirect');
            }
            if (typeof response.data === 'object' && response.data.error) {
                analysis.analysis.push(`📋 Errore specifico: ${response.data.error}`);
            }
        }
        
        this.results.debugInfo.errors.push(analysis);
        
        // Stampa analisi
        critical(`Analisi errore per ${testName}:`);
        analysis.analysis.forEach(item => {
            console.log(`   ${item}`);
        });
        
        return analysis;
    }
    
    async runTest(test) {
        const startTime = Date.now();
        this.results.total++;
        
        step(`Iniziando test: ${test.name}`);
        
        try {
            // Prepare request options
            const options = {
                method: test.method,
                headers: {}
            };
            
            // Add auth header or cookies if required
            if (test.requiresAuth) {
                debug('Test richiede autenticazione');
                
                if (!this.authToken && this.sessionCookies.length === 0) {
                    throw new Error('Autenticazione richiesta ma non disponibile');
                }
                
                if (this.sessionCookies.length > 0) {
                    options.headers['Cookie'] = this.sessionCookies.join('; ');
                    debug(`Usando session cookies: ${this.sessionCookies.length} cookie`);
                } else if (this.authToken && this.authToken !== 'session-based') {
                    options.headers['Authorization'] = `Bearer ${this.authToken}`;
                    debug('Usando Bearer token');
                }
            }
            
            // Add CSRF token if available
            if (this.csrfToken) {
                options.headers['X-CSRF-Token'] = this.csrfToken;
                debug('Aggiunto CSRF token');
            }
            
            // Add body data
            if (test.data) {
                options.body = typeof test.data === 'function' ? test.data() : test.data;
                debug(`Dati body preparati: ${Object.keys(options.body).join(', ')}`);
            }
            
            // Execute request with retry
            const response = await withRetry(() => 
                makeRequest(this.baseUrl + test.endpoint, options),
                CONFIG.RETRY_COUNT,
                test.name
            );
            
            const duration = Date.now() - startTime;
            
            // Salva risposta per debug
            this.saveResponse(test.name, response);
            
            // Registra chiamata API
            this.results.debugInfo.apiCalls.push({
                name: test.name,
                method: test.method,
                endpoint: test.endpoint,
                status: response.status,
                duration,
                timestamp: new Date().toISOString()
            });
            
            // Check if status is expected
            if (!test.expectedStatus.includes(response.status)) {
                // Analizza l'errore prima di lanciare l'eccezione
                this.analyzeAuthError(response, test.name);
                
                throw new Error(
                    `Status code ${response.status} non previsto. Attesi: ${test.expectedStatus.join(', ')}`
                );
            }
            
            // Execute success callback
            if (test.onSuccess) {
                debug('Eseguendo callback di successo');
                test.onSuccess(response, this);
            }
            
            this.results.passed++;
            this.results.tests.push({
                name: test.name,
                status: 'PASSED',
                duration,
                response: response.data,
                statusCode: response.status
            });
            
            success(`${test.name} - PASSED (${duration}ms) [Status: ${response.status}]`);
            
        } catch (err) {
            const duration = Date.now() - startTime;
            this.results.failed++;
            this.results.tests.push({
                name: test.name,
                status: 'FAILED',
                duration,
                error: err.message
            });
            
            error(`${test.name} - FAILED: ${err.message}`);
        }
        
        // Delay between tests
        debug(`Pausa di ${CONFIG.DELAY_BETWEEN_TESTS}ms prima del prossimo test`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_TESTS));
    }
    
    async runDetailedAuthTests() {
        info('🔐 Avvio test di autenticazione dettagliati...');
        
        // Test 1: Verifica endpoint di registrazione
        step('Fase 1: Test registrazione famiglia');
        await this.runTest({
            name: '🔐 Registrazione Famiglia (Debug)',
            method: 'POST',
            endpoint: '/api/auth/register',
            data: {
                familyName: CONFIG.TEST_USER.familyName,
                adminName: CONFIG.TEST_USER.adminName,
                adminUsername: CONFIG.TEST_USER.adminUsername,
                adminPassword: CONFIG.TEST_USER.adminPassword,
                adminEmail: CONFIG.TEST_USER.email
            },
            expectedStatus: [200, 201, 400, 409], // 409 se già esiste
            onSuccess: (response, suite) => {
                debug('Registrazione completata, analizzando risposta...');
                suite.results.debugInfo.authFlow.push({
                    step: 'registration',
                    status: response.status,
                    data: response.data
                });
                
                if (response.headers['set-cookie']) {
                    debug('Cookie ricevuti durante registrazione');
                    suite.sessionCookies = response.headers['set-cookie'];
                }
            }
        });
        
        // Test 2: Verifica stato sessione prima del login
        step('Fase 2: Verifica sessione pre-login');
        await this.runTest({
            name: '👤 Sessione Pre-Login',
            method: 'GET',
            endpoint: '/api/auth/session',
            expectedStatus: [200, 401],
            onSuccess: (response, suite) => {
                debug('Stato sessione pre-login verificato');
                suite.results.debugInfo.authFlow.push({
                    step: 'pre-login-session',
                    status: response.status,
                    data: response.data
                });
            }
        });
        
        // Test 3: Test credenziali con analisi dettagliata
        step('Fase 3: Test credenziali dettagliato');
        await this.runTest({
            name: '🔑 Test Credenziali (Debug)',
            method: 'POST',
            endpoint: '/api/auth/credentials',
            data: {
                email: CONFIG.TEST_USER.email,
                password: CONFIG.TEST_USER.password
            },
            expectedStatus: [200, 400, 401, 422],
            onSuccess: (response, suite) => {
                debug(`Credenziali testate: status=${response.status}`);
                suite.results.debugInfo.authFlow.push({
                    step: 'credentials-test',
                    status: response.status,
                    data: response.data
                });
                
                if (response.status === 200) {
                    suite.authToken = 'session-based';
                    info('✅ Credenziali valide - autenticazione attiva');
                    
                    // Estrai cookie di sessione se presenti
                    if (response.headers['set-cookie']) {
                        suite.sessionCookies = response.headers['set-cookie'];
                        debug(`Cookie di sessione estratti: ${suite.sessionCookies.length}`);
                    }
                } else {
                    warning(`⚠️ Credenziali non valide - status: ${response.status}`);
                }
            }
        });
        
        // Test 4: Verifica sessione post-login
        step('Fase 4: Verifica sessione post-login');
        await this.runTest({
            name: '👤 Sessione Post-Login',
            method: 'GET',
            endpoint: '/api/auth/session',
            requiresAuth: false,
            expectedStatus: [200, 401],
            onSuccess: (response, suite) => {
                debug('Stato sessione post-login verificato');
                suite.results.debugInfo.authFlow.push({
                    step: 'post-login-session',
                    status: response.status,
                    data: response.data
                });
                
                if (response.status === 200 && response.data) {
                    info('✅ Sessione attiva confermata');
                    if (response.data.user) {
                        debug(`Utente in sessione: ${JSON.stringify(response.data.user)}`);
                    }
                } else {
                    warning('⚠️ Sessione non attiva');
                }
            }
        });
    }
    
    async runDetailedApiTests() {
        info('🌐 Avvio test API dettagliati...');
        
        if (!this.authToken) {
            warning('⚠️ Test API saltati: autenticazione non disponibile');
            this.results.debugInfo.apiCalls.push({
                note: 'API tests skipped - no authentication',
                timestamp: new Date().toISOString()
            });
            return;
        }
        
        info('🔑 Autenticazione disponibile - procedendo con test API...');
        
        const apiTests = [
            {
                name: '📋 Lista Categorie (Debug)',
                method: 'GET',
                endpoint: '/api/categories',
                requiresAuth: true,
                expectedStatus: [200, 401, 403]
            },
            {
                name: '🏷️ Crea Categoria (Debug)',
                method: 'POST',
                endpoint: '/api/categories',
                requiresAuth: true,
                data: {
                    name: `Debug Category ${Date.now()}`,
                    icon: '🔍',
                    color: '#ff6b6b'
                },
                expectedStatus: [200, 201, 400, 401, 403, 422]
            },
            {
                name: '👨‍👩‍👧‍👦 Crea Famiglia (Debug)',
                method: 'POST',
                endpoint: '/api/family',
                requiresAuth: true,
                data: {
                    name: `Debug Family ${Date.now()}`
                },
                expectedStatus: [200, 201, 400, 401, 403, 405, 422]
            },
            {
                name: '💰 Lista Spese (Debug)',
                method: 'GET',
                endpoint: '/api/expenses',
                requiresAuth: true,
                expectedStatus: [200, 401, 403]
            },
            {
                name: '➕ Crea Spesa (Debug)',
                method: 'POST',
                endpoint: '/api/expenses',
                requiresAuth: true,
                data: {
                    amount: 42.75,
                    description: 'Debug expense test',
                    date: new Date().toISOString(),
                    categoryId: 'debug-category-id'
                },
                expectedStatus: [200, 201, 400, 401, 403, 422]
            }
        ];
        
        for (const test of apiTests) {
            await this.runTest(test);
        }
    }
    
    async runLogoutTest() {
        info('🚪 Test di logout dettagliato...');
        
        await this.runTest({
            name: '🚪 Logout Utente (Debug)',
            method: 'POST',
            endpoint: '/api/auth/signout',
            requiresAuth: false,
            expectedStatus: [200, 302, 405, 500],
            onSuccess: (response, suite) => {
                suite.authToken = null;
                suite.sessionCookies = [];
                debug('Logout completato - credenziali pulite');
                suite.results.debugInfo.authFlow.push({
                    step: 'logout',
                    status: response.status,
                    data: response.data
                });
            }
        });
    }
    
    async runHealthCheck() {
        info('🏥 Controllo stato servizio dettagliato...');
        
        try {
            const response = await withRetry(() => 
                makeRequest(this.baseUrl + '/', { method: 'GET' }),
                CONFIG.RETRY_COUNT,
                'Health Check'
            );
            
            debug(`Health check completato: ${response.status}`);
            
            if (response.status === 200) {
                success('✅ Servizio online e raggiungibile');
                return true;
            } else {
                warning(`⚠️ Servizio risponde con status ${response.status}`);
                return false;
            }
        } catch (err) {
            critical(`❌ Servizio non raggiungibile: ${err.message}`);
            return false;
        }
    }
    
    generateDetailedReport() {
        const endTime = new Date().toISOString();
        const duration = Date.now() - new Date(this.results.debugInfo.startTime).getTime();
        
        const report = {
            ...this.results,
            debugInfo: {
                ...this.results.debugInfo,
                endTime,
                totalDuration: duration,
                summary: {
                    authFlowSteps: this.results.debugInfo.authFlow.length,
                    apiCallsMade: this.results.debugInfo.apiCalls.length,
                    errorsAnalyzed: this.results.debugInfo.errors.length
                }
            }
        };
        
        return report;
    }
    
    saveDetailedReport(report) {
        const timestamp = Date.now();
        const filename = `debug-report-${this.results.debugInfo.environment}-${timestamp}.json`;
        const filepath = path.join(__dirname, filename);
        
        try {
            fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
            info(`📄 Report dettagliato salvato in: ${filepath}`);
        } catch (err) {
            error(`❌ Impossibile salvare report: ${err.message}`);
        }
    }
    
    printDetailedSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 REPORT FINALE DETTAGLIATO');
        console.log('='.repeat(60));
        console.log(`🎯 Test Totali: ${this.results.total}`);
        console.log(`✅ Successi: ${this.results.passed}`);
        console.log(`❌ Fallimenti: ${this.results.failed}`);
        console.log(`📈 Tasso di Successo: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        console.log(`🌍 Ambiente: ${this.results.debugInfo.environment}`);
        console.log(`⏱️ Durata Totale: ${(Date.now() - new Date(this.results.debugInfo.startTime).getTime())}ms`);
        console.log('='.repeat(60));
        
        if (this.results.failed > 0) {
            console.log('\n❌ TEST FALLITI:');
            this.results.tests
                .filter(test => test.status === 'FAILED')
                .forEach(test => {
                    console.log(`  • ${test.name}: ${test.error}`);
                });
        }
        
        if (this.results.debugInfo.authFlow.length > 0) {
            console.log('\n🔐 FLUSSO AUTENTICAZIONE:');
            this.results.debugInfo.authFlow.forEach((step, index) => {
                console.log(`  ${index + 1}. ${step.step}: Status ${step.status}`);
            });
        }
        
        if (this.results.debugInfo.errors.length > 0) {
            console.log('\n🔍 ANALISI ERRORI:');
            this.results.debugInfo.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.testName} (${error.status}):`);
                error.analysis.forEach(analysis => {
                    console.log(`     ${analysis}`);
                });
            });
        }
        
        console.log('='.repeat(60));
    }
}

// Funzione principale
async function main() {
    const args = process.argv.slice(2);
    const environment = args[0] || 'local';
    const testType = args[1] || 'all';
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🔍 DEBUG TEST SUITE AVANZATA
`);
        console.log('Uso: node debug-test-suite.js [environment] [test-type]\n');
        console.log('Environment:');
        console.log('  local   - Test su http://localhost:3000 (default)');
        console.log('  vercel  - Test su deployment Vercel\n');
        console.log('Test Types:');
        console.log('  auth    - Solo test di autenticazione dettagliati');
        console.log('  api     - Solo test API dettagliati');
        console.log('  health  - Solo health check');
        console.log('  all     - Tutti i test (default)\n');
        console.log('Esempi:');
        console.log('  node debug-test-suite.js vercel auth');
        console.log('  node debug-test-suite.js local api');
        console.log('  node debug-test-suite.js vercel all\n');
        return;
    }
    
    const baseUrl = environment === 'vercel' ? CONFIG.VERCEL_URL : CONFIG.LOCAL_URL;
    
    console.log(`\n🔍 DEBUG TEST SUITE AVANZATA`);
    console.log(`Ambiente: ${environment}`);
    console.log(`URL: ${baseUrl}`);
    console.log(`Tipo Test: ${testType}`);
    console.log(`Debug Mode: ${CONFIG.DEBUG_MODE ? 'ON' : 'OFF'}`);
    console.log(`Save Responses: ${CONFIG.SAVE_RESPONSES ? 'ON' : 'OFF'}\n`);
    
    const suite = new DebugTestSuite(baseUrl);
    
    try {
        // Health check sempre eseguito
        const isHealthy = await suite.runHealthCheck();
        if (!isHealthy && environment === 'local') {
            critical('Servizio locale non raggiungibile. Avvia il server con: npm run dev');
            process.exit(1);
        }
        
        // Esegui test in base al tipo
        switch (testType) {
            case 'auth':
                await suite.runDetailedAuthTests();
                break;
            case 'api':
                await suite.runDetailedAuthTests(); // Necessario per API
                await suite.runDetailedApiTests();
                break;
            case 'health':
                // Già eseguito sopra
                break;
            case 'all':
            default:
                await suite.runDetailedAuthTests();
                await suite.runDetailedApiTests();
                await suite.runLogoutTest();
                break;
        }
        
        // Genera e salva report
        const report = suite.generateDetailedReport();
        suite.saveDetailedReport(report);
        suite.printDetailedSummary();
        
        // Exit code basato sui risultati
        const exitCode = suite.results.failed > 0 ? 1 : 0;
        process.exit(exitCode);
        
    } catch (error) {
        critical(`Errore durante l'esecuzione dei test: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Gestione segnali
process.on('SIGINT', () => {
    warning('\n⚠️ Test interrotti dall\'utente');
    process.exit(130);
});

process.on('SIGTERM', () => {
    warning('\n⚠️ Test terminati dal sistema');
    process.exit(143);
});

// Avvia se eseguito direttamente
if (require.main === module) {
    main().catch(error => {
        critical(`Errore fatale: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    });
}

module.exports = { DebugTestSuite, CONFIG };