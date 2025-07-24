# 🤝 Contributing to Gestionale Spese Famiglia

Grazie per il tuo interesse nel contribuire al progetto! Questa guida ti aiuterà a iniziare.

## 📋 Indice

- [Codice di Condotta](#-codice-di-condotta)
- [Come Contribuire](#-come-contribuire)
- [Setup Ambiente di Sviluppo](#-setup-ambiente-di-sviluppo)
- [Workflow Git](#-workflow-git)
- [Convenzioni Codice](#-convenzioni-codice)
- [Testing](#-testing)
- [Pull Request](#-pull-request)
- [Segnalazione Bug](#-segnalazione-bug)
- [Richiesta Funzionalità](#-richiesta-funzionalità)

## 📜 Codice di Condotta

Questo progetto aderisce al [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). Partecipando, ti impegni a rispettare questo codice.

## 🚀 Come Contribuire

Ci sono molti modi per contribuire:

- 🐛 **Segnalare bug** - Aiutaci a migliorare segnalando problemi
- 💡 **Proporre funzionalità** - Suggerisci nuove idee
- 📝 **Migliorare documentazione** - Correggi o espandi la documentazione
- 🔧 **Correggere bug** - Risolvi problemi esistenti
- ⭐ **Implementare funzionalità** - Aggiungi nuove caratteristiche
- 🧪 **Scrivere test** - Migliora la copertura dei test

## 🛠️ Setup Ambiente di Sviluppo

### Prerequisiti

- **Node.js 18+**
- **npm** o **yarn**
- **Git**
- **VSCode** (raccomandato)

### Installazione

```bash
# 1. Fork del repository su GitHub
# 2. Clone del tuo fork
git clone https://github.com/YOUR_USERNAME/gestionale-spese-famiglia.git
cd gestionale-spese-famiglia

# 3. Aggiungi upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/gestionale-spese-famiglia.git

# 4. Installa dipendenze
npm install

# 5. Copia file ambiente
cp .env.example .env.local

# 6. Setup database
npx prisma generate
npx prisma db push

# 7. Avvia server sviluppo
npm run dev
```

### Estensioni VSCode Raccomandate

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "Prisma.prisma",
    "ms-playwright.playwright"
  ]
}
```

## 🌿 Workflow Git

### Convenzioni Branch

```bash
# Tipi di branch
feature/nome-funzionalita    # Nuove funzionalità
fix/nome-bug                 # Correzioni bug
docs/argomento              # Documentazione
refactor/componente         # Refactoring
test/area-test              # Test
chore/task                  # Manutenzione
```

### Processo di Sviluppo

```bash
# 1. Sincronizza con upstream
git checkout main
git pull upstream main

# 2. Crea branch feature
git checkout -b feature/add-expense-categories

# 3. Sviluppa e committa
git add .
git commit -m "feat: add expense categories management"

# 4. Push del branch
git push origin feature/add-expense-categories

# 5. Apri Pull Request su GitHub
```

### Conventional Commits

Utilizziamo [Conventional Commits](https://www.conventionalcommits.org/) per messaggi di commit consistenti:

```bash
# Formato
<type>[optional scope]: <description>

# Esempi
feat: add expense filtering by date range
fix: resolve balance calculation bug
docs: update API documentation
style: format code with prettier
refactor: extract expense calculation logic
test: add unit tests for expense service
chore: update dependencies
```

**Tipi disponibili:**
- `feat` - Nuova funzionalità
- `fix` - Correzione bug
- `docs` - Documentazione
- `style` - Formattazione codice
- `refactor` - Refactoring
- `test` - Test
- `chore` - Manutenzione
- `perf` - Miglioramento performance
- `ci` - CI/CD
- `build` - Build system

## 💻 Convenzioni Codice

### TypeScript

```typescript
// ✅ Buono
interface ExpenseFormData {
  amount: number;
  description: string;
  categoryId: string;
  date: Date;
}

const createExpense = async (data: ExpenseFormData): Promise<Expense> => {
  // implementazione
};

// ❌ Evitare
const createExpense = async (data: any) => {
  // implementazione
};
```

### React Components

```typescript
// ✅ Buono - Functional Component con TypeScript
interface ExpenseCardProps {
  expense: Expense;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  onEdit,
  onDelete
}) => {
  return (
    <div className="expense-card">
      {/* JSX */}
    </div>
  );
};

// ❌ Evitare - Componenti senza tipizzazione
export const ExpenseCard = ({ expense, onEdit, onDelete }) => {
  // implementazione
};
```

### Styling

```typescript
// ✅ Buono - Tailwind CSS con classi semantiche
<button className="btn-primary hover:btn-primary-hover transition-colors">
  Salva Spesa
</button>

// ✅ Buono - Classi condizionali con clsx
import { clsx } from 'clsx';

const buttonClass = clsx(
  'btn-base',
  {
    'btn-primary': variant === 'primary',
    'btn-secondary': variant === 'secondary',
    'btn-disabled': disabled
  }
);

// ❌ Evitare - Stili inline
<button style={{ backgroundColor: 'blue', padding: '10px' }}>
  Salva Spesa
</button>
```

### File e Directory

```bash
# Convenzioni naming
components/ExpenseCard.tsx        # PascalCase per componenti
hooks/useExpenses.ts              # camelCase con prefisso 'use'
utils/formatCurrency.ts           # camelCase per utility
types/expense.ts                  # camelCase per tipi
api/expenses/route.ts             # camelCase per API routes
```

## 🧪 Testing

### Esecuzione Test

```bash
# Tutti i test
npm run test

# Test in modalità watch
npm run test:watch

# Coverage report
npm run test:coverage

# Test specifici
npm run test -- ExpenseCard
```

### Scrittura Test

```typescript
// __tests__/components/ExpenseCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseCard } from '@/components/ExpenseCard';
import { mockExpense } from '@/test-utils/mocks';

describe('ExpenseCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders expense information correctly', () => {
    render(
      <ExpenseCard
        expense={mockExpense}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(mockExpense.description)).toBeInTheDocument();
    expect(screen.getByText(`€${mockExpense.amount}`)).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <ExpenseCard
        expense={mockExpense}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /modifica/i }));
    expect(mockOnEdit).toHaveBeenCalledWith(mockExpense.id);
  });
});
```

### Coverage Requirements

- **Componenti**: ≥ 80%
- **Utility Functions**: ≥ 90%
- **API Routes**: ≥ 70%
- **Hooks**: ≥ 85%

## 📝 Pull Request

### Checklist PR

Prima di aprire una PR, assicurati che:

- [ ] Il codice segue le convenzioni del progetto
- [ ] Tutti i test passano (`npm run test`)
- [ ] Il linting è pulito (`npm run lint`)
- [ ] La build funziona (`npm run build`)
- [ ] I test coprono le nuove funzionalità
- [ ] La documentazione è aggiornata
- [ ] I commit seguono Conventional Commits
- [ ] La PR ha una descrizione chiara

### Template PR

```markdown
## Descrizione
Breve descrizione delle modifiche apportate.

## Tipo di Modifica
- [ ] Bug fix (modifica non breaking che risolve un problema)
- [ ] Nuova funzionalità (modifica non breaking che aggiunge funzionalità)
- [ ] Breaking change (fix o funzionalità che causa malfunzionamenti)
- [ ] Aggiornamento documentazione

## Test
Descrivi i test eseguiti per verificare le modifiche.

## Checklist
- [ ] Il mio codice segue le linee guida del progetto
- [ ] Ho eseguito una self-review del codice
- [ ] Ho commentato il codice in aree difficili da comprendere
- [ ] Ho aggiornato la documentazione
- [ ] Le mie modifiche non generano nuovi warning
- [ ] Ho aggiunto test che dimostrano che la mia correzione è efficace
- [ ] I test nuovi ed esistenti passano localmente
```

### Review Process

1. **Automated Checks**: CI/CD esegue test, lint, build
2. **Code Review**: Almeno un maintainer deve approvare
3. **Testing**: Verifica funzionalità su preview deploy
4. **Merge**: Squash and merge su main branch

## 🐛 Segnalazione Bug

Usa il [template bug report](https://github.com/OWNER/REPO/issues/new?template=bug_report.md) con:

- **Descrizione**: Cosa è successo vs cosa ti aspettavi
- **Passi per riprodurre**: Lista numerata dei passi
- **Ambiente**: OS, browser, versione Node.js
- **Screenshot**: Se applicabile
- **Log errori**: Console errors o stack trace

## 💡 Richiesta Funzionalità

Usa il [template feature request](https://github.com/OWNER/REPO/issues/new?template=feature_request.md) con:

- **Problema**: Quale problema risolverebbe?
- **Soluzione**: Descrivi la soluzione che vorresti
- **Alternative**: Soluzioni alternative considerate
- **Contesto**: Informazioni aggiuntive

## 🏷️ Labels

- `bug` - Qualcosa non funziona
- `enhancement` - Nuova funzionalità o richiesta
- `documentation` - Miglioramenti alla documentazione
- `good first issue` - Buono per newcomers
- `help wanted` - Aiuto extra richiesto
- `priority: high` - Alta priorità
- `priority: low` - Bassa priorità
- `status: in progress` - Lavoro in corso
- `status: needs review` - Necessita review

## 🎯 Roadmap

Vedi [ROADMAP.md](./ROADMAP.md) per funzionalità pianificate e priorità.

## 📞 Supporto

- **Issues**: Per bug e feature request
- **Discussions**: Per domande e discussioni
- **Email**: [maintainer@email.com](mailto:maintainer@email.com)

---

**Grazie per contribuire al progetto! 🙏**

*Ogni contributo, grande o piccolo, è apprezzato e aiuta a migliorare l'esperienza per tutti gli utenti.*