#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestMaster {
    constructor() {
        this.timestamp = Date.now();
        this.results = {
            tests: null,
            debug: null,
            fixes: null
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const icons = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            debug: '🔍'
        };
        console.log(`[${timestamp}] ${icons[type]} ${message}`);
    }

    async runCommand(command, description) {
        this.log(`Eseguendo: ${description}`);
        this.log(`Comando: ${command}`, 'debug');
        
        try {
            const output = execSync(command, { 
                cwd: __dirname, 
                encoding: 'utf8',
                stdio: 'pipe'
            });
            this.log(`${description} completato`, 'success');
            return { success: true, output };
        } catch (error) {
            this.log(`${description} fallito: ${error.message}`, 'error');
            return { success: false, error: error.message, output: error.stdout };
        }
    }

    findLatestReport(pattern) {
        const files = fs.readdirSync(__dirname)
            .filter(file => file.match(pattern))
            .map(file => ({
                name: file,
                time: fs.statSync(path.join(__dirname, file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);
        
        return files.length > 0 ? files[0].name : null;
    }

    async runFullTestSuite(environment = 'vercel') {
        this.log(`🚀 Avvio suite completa di test su ${environment}`);
        
        // 1. Test standard
        this.log('\n📋 FASE 1: Test Standard');
        const testResult = await this.runCommand(
            `node automated-test.js ${environment} all`,
            'Test automatizzati standard'
        );
        this.results.tests = testResult;

        // 2. Debug autenticazione
        this.log('\n🔍 FASE 2: Debug Autenticazione');
        const debugResult = await this.runCommand(
            `node auth-debug.js ${environment}`,
            'Debug completo autenticazione'
        );
        this.results.debug = debugResult;

        // 3. Debug test suite
        this.log('\n🔬 FASE 3: Debug Test Suite');
        const debugSuiteResult = await this.runCommand(
            `node debug-test-suite.js ${environment} all`,
            'Debug test suite avanzato'
        );

        // 4. Analisi errori
        this.log('\n🔧 FASE 4: Analisi Errori');
        const latestReport = this.findLatestReport(/test-report-.*\.json$/);
        
        if (latestReport) {
            this.log(`Analizzando report: ${latestReport}`);
            const fixResult = await this.runCommand(
                `node fix-errors.js ${latestReport}`,
                'Analisi errori e suggerimenti'
            );
            this.results.fixes = fixResult;

            // 5. Applicazione correzioni (opzionale)
            if (process.argv.includes('--apply-fixes')) {
                this.log('\n🛠️ FASE 5: Applicazione Correzioni');
                await this.runCommand(
                    `node fix-errors.js ${latestReport} --apply`,
                    'Applicazione correzioni automatiche'
                );
            }
        } else {
            this.log('Nessun report trovato per analisi errori', 'warning');
        }

        // 6. Report finale
        this.generateFinalReport(environment);
    }

    generateFinalReport(environment) {
        this.log('\n📊 GENERAZIONE REPORT FINALE');
        
        const reportData = {
            timestamp: new Date().toISOString(),
            environment,
            results: this.results,
            summary: this.generateSummary()
        };

        const reportFile = `master-report-${environment}-${this.timestamp}.json`;
        fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
        
        this.log(`Report finale salvato: ${reportFile}`, 'success');
        
        // Stampa riepilogo
        this.printSummary();
    }

    generateSummary() {
        const summary = {
            tests: {
                executed: this.results.tests?.success || false,
                issues: []
            },
            debug: {
                executed: this.results.debug?.success || false,
                issues: []
            },
            fixes: {
                executed: this.results.fixes?.success || false,
                issues: []
            }
        };

        // Analizza output per estrarre informazioni
        if (this.results.tests?.output) {
            const testOutput = this.results.tests.output;
            if (testOutput.includes('❌ TEST FALLITI:')) {
                const failedSection = testOutput.split('❌ TEST FALLITI:')[1];
                if (failedSection) {
                    const failures = failedSection.split('\n')
                        .filter(line => line.includes('•'))
                        .map(line => line.trim());
                    summary.tests.issues = failures;
                }
            }
        }

        return summary;
    }

    printSummary() {
        this.log('\n============================================================');
        this.log('📊 RIEPILOGO FINALE MASTER TEST');
        this.log('============================================================');
        
        this.log(`✅ Test Standard: ${this.results.tests?.success ? 'OK' : 'FAILED'}`);
        this.log(`✅ Debug Auth: ${this.results.debug?.success ? 'OK' : 'FAILED'}`);
        this.log(`✅ Analisi Errori: ${this.results.fixes?.success ? 'OK' : 'FAILED'}`);
        
        const summary = this.generateSummary();
        if (summary.tests.issues.length > 0) {
            this.log('\n❌ PROBLEMI IDENTIFICATI:');
            summary.tests.issues.forEach(issue => {
                this.log(`  ${issue}`);
            });
        }
        
        this.log('\n💡 PROSSIMI PASSI:');
        this.log('  1. Verificare il deployment delle correzioni su Vercel');
        this.log('  2. Controllare le variabili d\'ambiente');
        this.log('  3. Eseguire nuovamente i test dopo il deployment');
        this.log('  4. Usare --apply-fixes per applicare correzioni automatiche');
        
        this.log('\n📁 FILE GENERATI:');
        this.log('  - Report test: test-report-*.json');
        this.log('  - Debug auth: auth-debug/*.json');
        this.log('  - Debug responses: debug-responses/*.json');
        this.log(`  - Report master: master-report-*-${this.timestamp}.json`);
        
        this.log('============================================================');
    }
}

// Esecuzione
if (require.main === module) {
    const args = process.argv.slice(2);
    const environment = args.find(arg => ['local', 'vercel'].includes(arg)) || 'vercel';
    
    console.log('🎯 TEST MASTER - Suite Completa di Test e Debug');
    console.log('============================================================');
    console.log(`🌍 Ambiente: ${environment}`);
    console.log(`🔧 Correzioni automatiche: ${args.includes('--apply-fixes') ? 'ABILITATE' : 'DISABILITATE'}`);
    console.log('============================================================\n');
    
    const master = new TestMaster();
    master.runFullTestSuite(environment)
        .then(() => {
            console.log('\n🎉 Suite completa terminata!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Errore durante l\'esecuzione:', error);
            process.exit(1);
        });
}

module.exports = TestMaster;