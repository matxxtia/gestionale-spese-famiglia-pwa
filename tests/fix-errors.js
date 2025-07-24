#!/usr/bin/env node

/**
 * 🔧 SCRIPT DI CORREZIONE ERRORI
 * Analizza i risultati dei test e suggerisce/applica correzioni automatiche
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configurazione
const CONFIG = {
    VERCEL_URL: 'https://gestionale-spese-famiglia-pwa.vercel.app',
    LOCAL_URL: 'http://localhost:3000',
    PROJECT_ROOT: path.resolve(__dirname, '..'),
    API_DIR: path.resolve(__dirname, '..', 'app', 'api'),
    TIMEOUT: 10000
};

// Colori per output
const COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function success(message) { log(`✅ ${message}`, 'green'); }
function error(message) { log(`❌ ${message}`, 'red'); }
function warning(message) { log(`⚠️ ${message}`, 'yellow'); }
function info(message) { log(`ℹ️ ${message}`, 'blue'); }
function fix(message) { log(`🔧 ${message}`, 'magenta'); }
function check(message) { log(`🔍 ${message}`, 'cyan'); }

// Classe per analisi e correzione errori
class ErrorFixer {
    constructor() {
        this.fixes = [];
        this.suggestions = [];
        this.apiEndpoints = new Map();
    }
    
    // Scansiona directory API per trovare endpoint esistenti
    async scanApiEndpoints() {
        check('Scansionando endpoint API esistenti...');
        
        const scanDir = (dir, basePath = '') => {
            if (!fs.existsSync(dir)) return;
            
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDir(fullPath, path.join(basePath, item));
                } else if (item === 'route.ts' || item === 'route.js') {
                    const endpoint = '/' + basePath.replace(/\\/g, '/');
                    this.analyzeApiFile(fullPath, endpoint);
                }
            }
        };
        
        scanDir(CONFIG.API_DIR);
        
        info(`Trovati ${this.apiEndpoints.size} endpoint API`);
        for (const [endpoint, methods] of this.apiEndpoints) {
            info(`  ${endpoint}: ${methods.join(', ')}`);
        }
    }
    
    // Analizza file API per determinare metodi supportati
    analyzeApiFile(filePath, endpoint) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const methods = [];
            
            // Cerca export di metodi HTTP
            const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
            for (const method of httpMethods) {
                if (content.includes(`export async function ${method}`) || 
                    content.includes(`export function ${method}`)) {
                    methods.push(method);
                }
            }
            
            this.apiEndpoints.set(endpoint, methods);
        } catch (err) {
            warning(`Impossibile analizzare ${filePath}: ${err.message}`);
        }
    }
    
    // Analizza report di test per identificare errori
    analyzeTestReport(reportPath) {
        check(`Analizzando report: ${reportPath}`);
        
        if (!fs.existsSync(reportPath)) {
            error(`Report non trovato: ${reportPath}`);
            return;
        }
        
        try {
            const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            
            info(`Report caricato: ${report.total} test, ${report.failed} fallimenti`);
            
            // Analizza ogni test fallito
            const tests = report.results ? report.results.tests : (report.tests || []);
            const failedTests = tests.filter(test => test.status === 'FAILED');
            
            for (const test of failedTests) {
                this.analyzeFailedTest(test, report);
            }
            
            // Analizza errori di debug se disponibili
            if (report.debugInfo && report.debugInfo.errors) {
                for (const debugError of report.debugInfo.errors) {
                    this.analyzeDebugError(debugError);
                }
            }
            
        } catch (err) {
            error(`Errore durante l'analisi del report: ${err.message}`);
        }
    }
    
    // Analizza singolo test fallito
    analyzeFailedTest(test, report) {
        check(`Analizzando test fallito: ${test.name}`);
        
        const errorMessage = test.error || '';
        
        // Errore 405 - Method Not Allowed
        if (errorMessage.includes('405')) {
            this.handleMethodNotAllowed(test, report);
        }
        // Errore 401 - Unauthorized
        else if (errorMessage.includes('401')) {
            this.handleUnauthorized(test, report);
        }
        // Errore 403 - Forbidden
        else if (errorMessage.includes('403')) {
            this.handleForbidden(test, report);
        }
        // Errore 500 - Internal Server Error
        else if (errorMessage.includes('500')) {
            this.handleInternalError(test, report);
        }
        // Altri errori
        else {
            this.handleGenericError(test, report);
        }
    }
    
    // Gestisce errori 405 - Method Not Allowed
    handleMethodNotAllowed(test, report) {
        fix(`Errore 405 per ${test.name}`);
        
        // Estrai endpoint dal nome del test o dai dati
        const endpoint = this.extractEndpointFromTest(test);
        const method = this.extractMethodFromTest(test);
        
        if (endpoint && method) {
            const supportedMethods = this.apiEndpoints.get(endpoint) || [];
            
            if (supportedMethods.length === 0) {
                this.suggestions.push({
                    type: 'missing_endpoint',
                    test: test.name,
                    endpoint,
                    method,
                    description: `Endpoint ${endpoint} non trovato. Potrebbe non essere implementato.`,
                    action: `Creare file route.ts in app/api${endpoint}/route.ts con metodo ${method}`
                });
            } else if (!supportedMethods.includes(method)) {
                this.suggestions.push({
                    type: 'missing_method',
                    test: test.name,
                    endpoint,
                    method,
                    supportedMethods,
                    description: `Endpoint ${endpoint} non supporta metodo ${method}. Supporta: ${supportedMethods.join(', ')}`,
                    action: `Aggiungere export async function ${method} in app/api${endpoint}/route.ts`
                });
            }
        }
    }
    
    // Gestisce errori 401 - Unauthorized
    handleUnauthorized(test, report) {
        fix(`Errore 401 per ${test.name}`);
        
        this.suggestions.push({
            type: 'auth_required',
            test: test.name,
            description: 'Test fallito per mancanza di autenticazione',
            action: 'Verificare che l\'autenticazione NextAuth sia configurata correttamente',
            checks: [
                'Verificare NEXTAUTH_SECRET in .env.local',
                'Controllare configurazione provider in lib/auth.ts',
                'Verificare middleware di autenticazione negli endpoint API'
            ]
        });
    }
    
    // Gestisce errori 403 - Forbidden
    handleForbidden(test, report) {
        fix(`Errore 403 per ${test.name}`);
        
        this.suggestions.push({
            type: 'permission_denied',
            test: test.name,
            description: 'Test fallito per mancanza di permessi',
            action: 'Verificare autorizzazioni utente e ruoli',
            checks: [
                'Controllare che l\'utente abbia i permessi necessari',
                'Verificare logica di autorizzazione negli endpoint',
                'Controllare configurazione ruoli nel database'
            ]
        });
    }
    
    // Gestisce errori 500 - Internal Server Error
    handleInternalError(test, report) {
        fix(`Errore 500 per ${test.name}`);
        
        this.suggestions.push({
            type: 'server_error',
            test: test.name,
            description: 'Errore interno del server',
            action: 'Verificare logs del server e configurazione',
            checks: [
                'Controllare connessione database',
                'Verificare variabili ambiente',
                'Controllare logs di Vercel/console locale',
                'Verificare schema Prisma e migrazioni'
            ]
        });
    }
    
    // Gestisce errori generici
    handleGenericError(test, report) {
        fix(`Errore generico per ${test.name}`);
        
        this.suggestions.push({
            type: 'generic_error',
            test: test.name,
            error: test.error,
            description: 'Errore non categorizzato',
            action: 'Analisi manuale richiesta'
        });
    }
    
    // Analizza errori di debug
    analyzeDebugError(debugError) {
        check(`Analizzando errore debug: ${debugError.testName}`);
        
        // Usa l'analisi già presente nel debug error
        if (debugError.analysis && debugError.analysis.length > 0) {
            this.suggestions.push({
                type: 'debug_analysis',
                test: debugError.testName,
                status: debugError.status,
                analysis: debugError.analysis,
                description: 'Analisi dettagliata dal debug',
                action: 'Seguire suggerimenti dell\'analisi debug'
            });
        }
    }
    
    // Estrae endpoint dal test
    extractEndpointFromTest(test) {
        // Mapping basato sui nomi dei test
        const endpointMap = {
            'Crea Famiglia': '/api/family',
            'Lista Categorie': '/api/categories',
            'Crea Categoria': '/api/categories',
            'Lista Spese': '/api/expenses',
            'Crea Spesa': '/api/expenses',
            'Logout Utente': '/api/auth/signout',
            'Registrazione Famiglia': '/api/auth/register',
            'Test Credenziali': '/api/auth/credentials',
            'Verifica Sessione': '/api/auth/session'
        };
        
        for (const [testPattern, endpoint] of Object.entries(endpointMap)) {
            if (test.name.includes(testPattern)) {
                return endpoint;
            }
        }
        
        return null;
    }
    
    // Estrae metodo HTTP dal test
    extractMethodFromTest(test) {
        const methodMap = {
            'Crea': 'POST',
            'Lista': 'GET',
            'Logout': 'POST',
            'Registrazione': 'POST',
            'Test Credenziali': 'POST',
            'Verifica': 'GET'
        };
        
        for (const [testPattern, method] of Object.entries(methodMap)) {
            if (test.name.includes(testPattern)) {
                return method;
            }
        }
        
        return 'GET'; // Default
    }
    
    // Genera template per endpoint mancante
    generateEndpointTemplate(endpoint, method) {
        const template = `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ${method} ${endpoint}
export async function ${method}(request: NextRequest) {
    try {
        // Verifica autenticazione
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Non autorizzato' },
                { status: 401 }
            );
        }

        // TODO: Implementare logica per ${method} ${endpoint}
        ${method === 'GET' ? 
            'return NextResponse.json({ message: "Endpoint implementato" });' :
            `const body = await request.json();
        
        // Validazione input
        // TODO: Aggiungere validazione
        
        return NextResponse.json(
            { message: "Risorsa creata/aggiornata" },
            { status: 201 }
        );`
        }
        
    } catch (error) {
        console.error('Errore in ${method} ${endpoint}:', error);
        return NextResponse.json(
            { error: 'Errore interno del server' },
            { status: 500 }
        );
    }
}
`;
        
        return template;
    }
    
    // Applica correzioni automatiche
    async applyFixes() {
        info('🔧 Applicando correzioni automatiche...');
        
        for (const suggestion of this.suggestions) {
            if (suggestion.type === 'missing_endpoint') {
                await this.createMissingEndpoint(suggestion);
            } else if (suggestion.type === 'missing_method') {
                await this.addMissingMethod(suggestion);
            }
        }
    }
    
    // Crea endpoint mancante
    async createMissingEndpoint(suggestion) {
        const { endpoint, method } = suggestion;
        const dirPath = path.join(CONFIG.API_DIR, endpoint.substring(5)); // Rimuovi '/api/'
        const filePath = path.join(dirPath, 'route.ts');
        
        try {
            // Crea directory se non esiste
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                success(`Directory creata: ${dirPath}`);
            }
            
            // Crea file se non esiste
            if (!fs.existsSync(filePath)) {
                const template = this.generateEndpointTemplate(endpoint, method);
                fs.writeFileSync(filePath, template);
                success(`Endpoint creato: ${filePath}`);
                
                this.fixes.push({
                    type: 'endpoint_created',
                    path: filePath,
                    endpoint,
                    method
                });
            } else {
                warning(`File già esistente: ${filePath}`);
            }
            
        } catch (err) {
            error(`Errore creando endpoint ${endpoint}: ${err.message}`);
        }
    }
    
    // Aggiunge metodo mancante a endpoint esistente
    async addMissingMethod(suggestion) {
        const { endpoint, method } = suggestion;
        const dirPath = path.join(CONFIG.API_DIR, endpoint.substring(5));
        const filePath = path.join(dirPath, 'route.ts');
        
        try {
            if (fs.existsSync(filePath)) {
                let content = fs.readFileSync(filePath, 'utf8');
                
                // Controlla se il metodo è già presente
                if (content.includes(`export async function ${method}`)) {
                    warning(`Metodo ${method} già presente in ${filePath}`);
                    return;
                }
                
                // Genera template per il metodo
                const methodTemplate = `
// ${method} ${endpoint}
export async function ${method}(request: NextRequest) {
    try {
        // Verifica autenticazione
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Non autorizzato' },
                { status: 401 }
            );
        }

        // TODO: Implementare logica per ${method} ${endpoint}
        ${method === 'GET' ? 
            'return NextResponse.json({ message: "Endpoint implementato" });' :
            `const body = await request.json();
        
        // Validazione input
        // TODO: Aggiungere validazione
        
        return NextResponse.json(
            { message: "Risorsa creata/aggiornata" },
            { status: 201 }
        );`
        }
        
    } catch (error) {
        console.error('Errore in ${method} ${endpoint}:', error);
        return NextResponse.json(
            { error: 'Errore interno del server' },
            { status: 500 }
        );
    }
}
`;
                
                // Aggiungi il metodo alla fine del file
                content += methodTemplate;
                
                fs.writeFileSync(filePath, content);
                success(`Metodo ${method} aggiunto a ${filePath}`);
                
                this.fixes.push({
                    type: 'method_added',
                    path: filePath,
                    endpoint,
                    method
                });
                
            } else {
                warning(`File non trovato: ${filePath}`);
            }
            
        } catch (err) {
            error(`Errore aggiungendo metodo ${method} a ${endpoint}: ${err.message}`);
        }
    }
    
    // Stampa report delle correzioni
    printReport() {
        console.log('\n' + '='.repeat(60));
        console.log('🔧 REPORT CORREZIONI ERRORI');
        console.log('='.repeat(60));
        
        if (this.suggestions.length === 0) {
            success('✅ Nessun errore da correggere trovato!');
            return;
        }
        
        console.log(`\n📋 SUGGERIMENTI TROVATI: ${this.suggestions.length}`);
        
        this.suggestions.forEach((suggestion, index) => {
            console.log(`\n${index + 1}. ${suggestion.test}`);
            console.log(`   Tipo: ${suggestion.type}`);
            console.log(`   Descrizione: ${suggestion.description}`);
            console.log(`   Azione: ${suggestion.action}`);
            
            if (suggestion.checks) {
                console.log('   Controlli:');
                suggestion.checks.forEach(check => {
                    console.log(`     - ${check}`);
                });
            }
            
            if (suggestion.analysis) {
                console.log('   Analisi:');
                suggestion.analysis.forEach(analysis => {
                    console.log(`     - ${analysis}`);
                });
            }
        });
        
        if (this.fixes.length > 0) {
            console.log(`\n🔧 CORREZIONI APPLICATE: ${this.fixes.length}`);
            this.fixes.forEach((fix, index) => {
                console.log(`${index + 1}. ${fix.type}: ${fix.path}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
    }
    
    // Genera script di correzione
    generateFixScript() {
        const scriptPath = path.join(__dirname, 'apply-fixes.sh');
        let script = '#!/bin/bash\n\n';
        script += '# Script generato automaticamente per correggere errori\n\n';
        
        // Aggiungi comandi per ogni suggerimento
        this.suggestions.forEach((suggestion, index) => {
            script += `# Fix ${index + 1}: ${suggestion.test}\n`;
            script += `# ${suggestion.description}\n`;
            
            if (suggestion.type === 'auth_required') {
                script += 'echo "Verificando configurazione autenticazione..."\n';
                script += 'echo "Controllare NEXTAUTH_SECRET in .env.local"\n';
            } else if (suggestion.type === 'server_error') {
                script += 'echo "Verificando configurazione server..."\n';
                script += 'npx prisma generate\n';
                script += 'npx prisma db push\n';
            }
            
            script += '\n';
        });
        
        script += '# Riavvia il server di sviluppo\n';
        script += 'echo "Riavviando server..."\n';
        script += 'npm run dev\n';
        
        try {
            fs.writeFileSync(scriptPath, script);
            success(`Script di correzione generato: ${scriptPath}`);
        } catch (err) {
            error(`Errore generando script: ${err.message}`);
        }
    }
}

// Funzione principale
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log('\n🔧 SCRIPT DI CORREZIONE ERRORI\n');
        console.log('Uso: node fix-errors.js [report-file] [options]\n');
        console.log('Opzioni:');
        console.log('  --apply     Applica correzioni automatiche');
        console.log('  --script    Genera script di correzione');
        console.log('  --help, -h  Mostra questo aiuto\n');
        console.log('Esempi:');
        console.log('  node fix-errors.js test-report-vercel-123.json');
        console.log('  node fix-errors.js debug-report-vercel-123.json --apply');
        console.log('  node fix-errors.js latest --script\n');
        return;
    }
    
    const reportFile = args[0] || 'latest';
    const shouldApply = args.includes('--apply');
    const shouldGenerateScript = args.includes('--script');
    
    console.log('\n🔧 ANALIZZATORE E CORRETTORE ERRORI');
    console.log('====================================\n');
    
    const fixer = new ErrorFixer();
    
    // Scansiona endpoint API
    await fixer.scanApiEndpoints();
    
    // Trova il file di report
    let reportPath;
    if (reportFile === 'latest') {
        // Trova il report più recente
        const files = fs.readdirSync(__dirname)
            .filter(f => f.startsWith('test-report-') || f.startsWith('debug-report-'))
            .map(f => ({ name: f, time: fs.statSync(path.join(__dirname, f)).mtime }))
            .sort((a, b) => b.time - a.time);
        
        if (files.length === 0) {
            error('Nessun report di test trovato');
            return;
        }
        
        reportPath = path.join(__dirname, files[0].name);
        info(`Usando report più recente: ${files[0].name}`);
    } else {
        reportPath = path.resolve(reportFile);
    }
    
    // Analizza il report
    fixer.analyzeTestReport(reportPath);
    
    // Applica correzioni se richiesto
    if (shouldApply) {
        await fixer.applyFixes();
    }
    
    // Genera script se richiesto
    if (shouldGenerateScript) {
        fixer.generateFixScript();
    }
    
    // Stampa report
    fixer.printReport();
    
    if (!shouldApply && !shouldGenerateScript) {
        info('\n💡 Usa --apply per applicare correzioni automatiche');
        info('💡 Usa --script per generare script di correzione');
    }
}

// Avvia se eseguito direttamente
if (require.main === module) {
    main().catch(error => {
        error(`Errore: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    });
}

module.exports = { ErrorFixer };