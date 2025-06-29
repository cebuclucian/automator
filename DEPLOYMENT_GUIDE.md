# Ghid Deploy Supabase Edge Functions și Configurare Stripe

## Pasul 1: Verifică și configurează variabilele de mediu

### 1.1 Configurează .env local
Creează fișierul `.env` în root-ul proiectului cu următoarele variabile:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
VITE_STRIPE_PUBLIC_KEY=your_stripe_publishable_key

# Site URL
VITE_SITE_URL=http://localhost:5173
```

### 1.2 Configurează variabilele în Supabase Dashboard
Mergi în Supabase Dashboard → Settings → Edge Functions → Environment Variables și adaugă:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (va fi generat mai târziu)
```

## Pasul 2: Deploy funcțiile Edge în Supabase

### 2.1 Instalează Supabase CLI (dacă nu e instalat)
```bash
npm install -g supabase
```

### 2.2 Login în Supabase CLI
```bash
supabase login
```

### 2.3 Link proiectul local cu proiectul Supabase
```bash
supabase link --project-ref YOUR_PROJECT_ID
```

### 2.4 Deploy funcțiile Edge
```bash
# Deploy toate funcțiile odată
supabase functions deploy

# Sau deploy individual
supabase functions deploy generate-materials
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
supabase functions deploy download-material
```

## Pasul 3: Configurează Stripe Webhook

### 3.1 Obține URL-ul webhook-ului
După deploy, URL-ul va fi:
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook
```

### 3.2 Configurează webhook în Stripe Dashboard

1. Mergi în [Stripe Dashboard](https://dashboard.stripe.com)
2. Navighează la **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Adaugă URL-ul: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook`
5. Selectează următoarele evenimente:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`

### 3.3 Obține și configurează Webhook Secret
1. După crearea webhook-ului, click pe el
2. Copiază **Signing secret** (începe cu `whsec_`)
3. Adaugă-l în Supabase Dashboard → Settings → Edge Functions → Environment Variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

## Pasul 4: Configurează produsele Stripe

### 4.1 Creează produsele în Stripe Dashboard
1. Mergi la **Products** în Stripe Dashboard
2. Creează următoarele produse cu prețuri recurente (monthly):

**Basic Plan:**
- Nume: "Automator Basic"
- Preț: €9/lună
- Copiază Price ID (începe cu `price_`)

**Pro Plan:**
- Nume: "Automator Pro" 
- Preț: €39/lună
- Copiază Price ID

**Enterprise Plan:**
- Nume: "Automator Enterprise"
- Preț: €89/lună
- Copiază Price ID

### 4.2 Actualizează stripe-config.ts
Înlocuiește Price ID-urile în `src/stripe-config.ts`:

```typescript
export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_basic',
    priceId: 'price_YOUR_BASIC_PRICE_ID',
    name: 'Basic',
    description: '1 curs complet/lună',
    mode: 'subscription',
    price: 9,
    currency: 'EUR'
  },
  {
    id: 'prod_pro',
    priceId: 'price_YOUR_PRO_PRICE_ID',
    name: 'Pro',
    description: '5 cursuri/lună',
    mode: 'subscription',
    price: 39,
    currency: 'EUR'
  },
  {
    id: 'prod_enterprise',
    priceId: 'price_YOUR_ENTERPRISE_PRICE_ID',
    name: 'Enterprise',
    description: '20 cursuri/lună',
    mode: 'subscription',
    price: 89,
    currency: 'EUR'
  }
];
```

## Pasul 5: Testează funcționalitatea

### 5.1 Testează înregistrarea utilizatorilor
1. Mergi la `/register`
2. Creează un cont nou
3. Verifică în Supabase Dashboard → Table Editor → users că utilizatorul a fost creat

### 5.2 Testează generarea cursurilor
1. Login cu contul creat
2. Mergi la `/genereaza-curs`
3. Completează formularul și generează un curs
4. Verifică în tabelul `jobs` că job-ul a fost creat
5. Monitorizează progresul în `/jobs/JOB_ID`

### 5.3 Testează Stripe checkout
1. Mergi la `/preturi`
2. Încearcă să cumperi un plan
3. Folosește cardurile de test Stripe:
   - Succes: `4242 4242 4242 4242`
   - Eșec: `4000 0000 0000 0002`

## Pasul 6: Configurează Storage pentru materiale

### 6.1 Creează bucket-ul în Supabase
1. Mergi în Supabase Dashboard → Storage
2. Creează un bucket nou numit `course-materials`
3. Configurează politicile de acces:

```sql
-- Permite utilizatorilor să citească propriile materiale
CREATE POLICY "Users can read own materials" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'course-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permite serviciului să scrie materiale
CREATE POLICY "Service can write materials" ON storage.objects
FOR INSERT TO service_role
WITH CHECK (bucket_id = 'course-materials');
```

## Troubleshooting

### Probleme comune și soluții:

**1. Funcțiile Edge nu se deploy-ează:**
- Verifică că ești logat în Supabase CLI: `supabase status`
- Verifică că proiectul este linked corect

**2. Webhook-ul Stripe nu funcționează:**
- Verifică că `STRIPE_WEBHOOK_SECRET` este setat corect
- Testează webhook-ul în Stripe Dashboard

**3. Generarea cursurilor eșuează:**
- Verifică logs-urile funcției în Supabase Dashboard → Edge Functions → Logs
- Asigură-te că bucket-ul `course-materials` există

**4. Plățile nu se procesează:**
- Verifică că Price ID-urile din `stripe-config.ts` sunt corecte
- Verifică că webhook-ul primește evenimente

## Comenzi utile pentru debugging:

```bash
# Verifică status-ul proiectului
supabase status

# Urmărește logs-urile funcțiilor
supabase functions logs generate-materials
supabase functions logs stripe-webhook

# Testează o funcție local
supabase functions serve generate-materials
```

## Finalizare

După completarea acestor pași, aplicația ta va fi complet funcțională cu:
- ✅ Autentificare utilizatori
- ✅ Generare cursuri AI în 7 pași
- ✅ Procesare plăți Stripe
- ✅ Download securizat materiale
- ✅ Management abonamente

Pentru suport suplimentar, verifică documentația Supabase și Stripe.