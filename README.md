# 📱 Gestionale Spese Famiglia - PWA

Una moderna Progressive Web App per la gestione delle spese familiari, costruita con Next.js, TypeScript e Tailwind CSS.

## ✨ Caratteristiche

- 📱 **PWA (Progressive Web App)** - Installabile come app nativa su smartphone e tablet
- 🔐 Autenticazione utenti con NextAuth.js
- 💰 Tracciamento e categorizzazione delle spese
- 👨‍👩‍👧‍👦 Gestione membri della famiglia
- 🧮 Calcolo automatico dei bilanci
- 📱 Design responsive e mobile-first
- 🌙 Supporto modalità scura
- 🇮🇹 Interfaccia completamente in italiano
- 📊 Ripartizione personalizzata delle spese
- 💾 Funzionalità offline

## 🚀 Installazione come App Mobile

### Android:
1. Apri l'app nel browser Chrome
2. Tocca il menu (3 punti) → "Aggiungi alla schermata Home"
3. L'app verrà installata come app nativa

### iOS:
1. Apri l'app in Safari
2. Tocca il pulsante Condividi → "Aggiungi alla schermata Home"
3. L'app verrà installata come app nativa

## 🛠️ Sviluppo Locale

### Installazione dipendenze:
```bash
npm install
```

### Configurazione ambiente:
Copia `.env.example` in `.env.local` e compila i valori richiesti.

### Avvio server di sviluppo:
```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

### Setup Database:
```bash
npx prisma generate
npx prisma db push
```

## 🌐 Deploy Gratuito su Vercel

### Opzione 1: Deploy Automatico
1. Fai push del codice su GitHub
2. Vai su [vercel.com](https://vercel.com)
3. Importa il repository GitHub
4. Vercel farà il deploy automaticamente

### Opzione 2: Deploy da CLI
```bash
npm install -g vercel
vercel
```

### Configurazione Variabili d'Ambiente su Vercel:
1. Nel dashboard Vercel, vai su Settings → Environment Variables
2. Aggiungi:
   - `NEXTAUTH_SECRET`: una stringa segreta casuale
   - `NEXTAUTH_URL`: l'URL del tuo deploy Vercel
   - `DATABASE_URL`: URL del database (Vercel fornisce PostgreSQL gratuito)

## 🔧 Tecnologie Utilizzate

- **Next.js 14** - Framework React
- **TypeScript** - Tipizzazione statica
- **Tailwind CSS** - Styling
- **Prisma** - ORM Database
- **NextAuth.js** - Autenticazione
- **PWA** - Service Worker e Manifest
- **SQLite** - Database di sviluppo

## 📱 Funzionalità PWA

- ✅ Installabile su dispositivi mobili
- ✅ Funziona offline
- ✅ Icone personalizzate
- ✅ Splash screen
- ✅ Notifiche push (future)
- ✅ Aggiornamenti automatici

## 🎯 Utilizzo

1. **Registrazione/Login**: Crea un account o accedi
2. **Configura Famiglia**: Aggiungi membri della famiglia
3. **Crea Categorie**: Organizza le spese per categoria
4. **Aggiungi Spese**: Registra le spese con ripartizione personalizzata
5. **Monitora Bilanci**: Visualizza chi deve cosa a chi

## 🆓 Hosting Gratuito

- **Vercel**: 100GB bandwidth, deploy illimitati
- **Netlify**: Alternativa con funzionalità simili
- **Railway**: Include database PostgreSQL gratuito

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── providers.tsx      # Context providers
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard
│   ├── Header.tsx         # Navigation header
│   ├── ExpenseList.tsx    # Expense listing
│   ├── AddExpenseModal.tsx # Add expense form
│   ├── FamilySettings.tsx # Family management
│   └── LoadingSpinner.tsx # Loading component
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema
├── types/                # TypeScript definitions
│   ├── index.ts          # Main types
│   └── next-auth.d.ts    # NextAuth types
└── public/               # Static assets
```

## Usage

### Adding Family Members

1. Navigate to the "Family Settings" tab
2. Click "Add Member" to add new family members
3. Customize names and roles as needed

### Cost Sharing Configuration

1. In Family Settings, adjust the percentage shares for each member
2. Use "Equal Split" for automatic equal distribution
3. Ensure total percentages add up to 100%

### Logging Expenses

1. Click "Add Expense" on the dashboard
2. Fill in the expense details:
   - Amount (required)
   - Description (required)
   - Date (required)
   - Location (optional)
   - Category (required)
   - Who paid (required)
3. Submit to add the expense

### Filtering Expenses

- Use the search bar to find specific expenses
- Filter by category or family member
- View summary statistics and totals

## Customization

### Adding New Categories

Categories are currently predefined but can be extended in the database schema and mock data.

### Styling

The app uses Tailwind CSS with a custom design system. Key customizations:

- **Colors**: Primary (blue) and secondary (gray) color palettes
- **Typography**: PT Sans font family
- **Animations**: Subtle hover and transition effects
- **Components**: Reusable component classes in `globals.css`

## 📞 Supporto

Per problemi o domande, apri una issue su GitHub.

---

**🎉 La tua app di gestione spese è pronta per essere utilizzata gratuitamente!**