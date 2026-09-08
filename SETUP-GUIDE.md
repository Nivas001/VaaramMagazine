# Setup Guide

Everything you need to get this website live. Follow the parts in order.
Nothing here costs money — the only bill you will ever get is your domain name.

Set aside about **an hour** for the first run through.

---

## Part 0 — What you are signing up for

| Service | What it does for you | Cost | Card needed? |
| --- | --- | --- | --- |
| **GitHub** | Stores the website code | Free | No |
| **Supabase** | Database + your admin login | Free | No |
| **Cloudflare R2** | Stores the PDFs and banner images | Free up to 10 GB | **Yes** — but you are not charged inside the free limits |
| **Vercel** | Runs the website | Free | No |
| **Web3Forms** *(optional)* | Emails you a copy of each enquiry | Free | No |
| Your domain registrar | Your web address | ~₹800–1,200/year | Yes |

> **About the Cloudflare card.** R2 asks for a card even on the free plan. It is
> the one service worth it: R2 never charges for downloads, so if one issue goes
> viral your bill stays at zero. Every other storage option charges per download.
>
> **You can skip R2 at first.** Leave those settings blank and the site uses
> Supabase Storage instead. That works fine, but the free plan allows only about
> 5 GB of downloads a month — roughly 300 downloads of a 15 MB paper. Add R2 the
> moment you outgrow it.

---

## Part 1 — Put the code on GitHub

1. Create a free account at **github.com**.
2. Click **+** (top right) → **New repository**.
3. Name it `adexpress-website`. Choose **Private**. Click **Create repository**.
4. On your computer, open Terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/adexpress-website.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

---

## Part 2 — Supabase (database + admin login)

### 2.1 Create the project

1. Go to **supabase.com** → **Start your project** → sign in with GitHub.
2. **New project**.
   - **Name:** `adexpress`
   - **Database password:** click Generate, then **save it somewhere safe**
   - **Region:** pick the one closest to your readers (e.g. Mumbai / Singapore)
3. Wait about two minutes for it to finish setting up.

### 2.2 Create the tables

1. In the left sidebar click **SQL Editor** → **New query**.
2. Open the file `supabase/schema.sql` from the project folder.
3. Copy **all** of it, paste it into the editor, click **RUN**.
4. You should see *Success. No rows returned*. That is correct.

### 2.3 Create your admin login

Signing in uses a six-digit code emailed to you — there is no password to
choose, lose or leak.

1. Left sidebar → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Enter the email address you will sign in with.
3. Tick **Auto Confirm User**, then create.
4. Left sidebar → **Authentication** → **Providers** → **Email**: make sure
   **Enable email provider** is on.
5. Left sidebar → **Authentication** → **Sign In / Providers**: turn
   **Allow new users to sign up** **off**.

> Step 5 matters. The login page asks Supabase for a code with
> `shouldCreateUser: false`, so only addresses you have added here can ever
> request one. With sign-ups disabled as well, nobody can create an account
> from the outside even if that setting is changed later.
>
> Anyone listed under **Users** has full admin access, so add only people who
> should be able to publish.

### 2.4 Copy your three keys

Left sidebar → **Project Settings** → **API** (or **Data API**).

| Copy this | Into this `.env.local` line |
| --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` / `publishable` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` / `secret` key | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ The **service_role** key is a master key to your database. Never put it in a
> message, a screenshot, or any file that starts with `NEXT_PUBLIC_`.

---

## Part 3 — Vercel (putting the site online)

1. Go to **vercel.com** → **Sign up** → **Continue with GitHub**.
2. **Add New… → Project** → find `adexpress-website` → **Import**.
3. Before clicking Deploy, open **Environment Variables** and add each line from
   your `.env.local` (name on the left, value on the right).
   - For `NEXT_PUBLIC_SITE_URL`, use `https://YOUR-PROJECT.vercel.app` for now.
     You will change it to your real domain in Part 5.
4. Click **Deploy** and wait a couple of minutes.
5. Open the URL it gives you. The site is live.
6. Go to `your-url/admin`, sign in with the account from step 2.3, and upload a
   test PDF to confirm everything works.

> **A note on Vercel's free plan.** Vercel's terms reserve the Hobby (free) plan
> for non-commercial use, and a paper that sells advertising is commercial. In
> practice small sites run on it without trouble, but if you want to be strictly
> correct, **Netlify** and **Cloudflare Pages** both allow commercial use on
> their free tiers and deploy this same code. Import the same GitHub repository
> there instead — the environment variables are identical.

---

## Part 4 — Cloudflare R2 (recommended, do this within the first month)

### 4.1 Create the bucket

1. Go to **cloudflare.com** → sign up → **R2 Object Storage** in the sidebar.
2. Add a payment card when asked. You will not be charged within the free limits.
3. **Create bucket** → name it `adexpress-media` → **Create**.

### 4.2 Make the bucket readable by the public

1. Open the bucket → **Settings** tab → **Public access**.
2. Either:
   - **Custom domain** (better): add `media.YOUR-DOMAIN.com`. Cloudflare sets up
     the DNS for you if your domain is on Cloudflare. Your public URL is then
     `https://media.YOUR-DOMAIN.com`.
   - **or R2.dev subdomain**: click **Allow Access**. Your public URL is the
     `https://pub-xxxxxxxx.r2.dev` address it shows you.
3. Save whichever URL you ended up with.

### 4.3 Allow uploads from your website

Still in **Settings**, find **CORS policy** → **Edit** → paste this, replacing
the domain with yours:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://YOUR-DOMAIN.com",
      "https://YOUR-PROJECT.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

(The same text is in `cors-r2.json` in the project folder.)

> If uploads fail in the admin dashboard with a network error, it is almost
> always this step. Check the domain here matches your site exactly.

### 4.4 Create API keys

1. R2 overview page → **Manage R2 API Tokens** → **Create API token**.
2. Permissions: **Object Read & Write**. Scope it to your bucket. Create.
3. Copy the three values it shows you **now** — the secret is shown only once.

| Copy this | Into this `.env.local` line |
| --- | --- |
| Account ID (top right of the R2 page) | `R2_ACCOUNT_ID` |
| Access Key ID | `R2_ACCESS_KEY_ID` |
| Secret Access Key | `R2_SECRET_ACCESS_KEY` |
| `adexpress-media` | `R2_BUCKET_NAME` |
| The public URL from step 4.2 | `NEXT_PUBLIC_R2_PUBLIC_URL` |

4. Add all five to Vercel → your project → **Settings → Environment Variables**,
   then **Deployments → ⋯ → Redeploy**.

---

## Part 5 — Your domain

1. Buy a domain anywhere (GoDaddy, Namecheap, Cloudflare, BigRock…).
2. In Vercel: **Settings → Domains → Add** → type your domain.
3. Vercel shows you the DNS records to create. Add them at your registrar:
   - `A` record, name `@`, value `76.76.21.21`
   - `CNAME` record, name `www`, value `cname.vercel-dns.com`
4. Wait for it to verify (usually minutes, sometimes a few hours).
5. Update `NEXT_PUBLIC_SITE_URL` in Vercel to `https://your-domain.com` and
   redeploy. **This matters for Google** — it is what the sitemap uses.

---

## Part 6 — Keep the database awake (2 minutes, important)

Supabase pauses a free project after **7 days with no activity**. If that
happens your site goes down until you log in and resume it. The project already
contains a job that prevents this — you just need to give it the keys.

1. On GitHub, open your repository → **Settings** → **Secrets and variables** →
   **Actions** → **New repository secret**.
2. Add two secrets:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_ANON_KEY` — your anon key
3. Go to the **Actions** tab → **Keep Supabase awake** → **Run workflow** to test
   it once. From then on it runs by itself every five days.

---

## Part 7 — Email copies of enquiries (optional)

Every enquiry is already saved and visible at `/admin/enquiries`. This step just
also sends them to your inbox.

1. Go to **web3forms.com**, enter your email, get an access key emailed to you.
2. Add it to Vercel as `WEB3FORMS_ACCESS_KEY` and redeploy.

Free plan: 250 enquiries a month.

---

## Part 8 — Make the site yours

Open **`site.config.ts`** in the project. Everything the visitor reads is here:

- `name`, `legalName`, `tagline` — your paper's name
- `since` — the year you started
- `contact` — phone, WhatsApp number, email, address, office hours
- `social` — leave a line empty to hide that icon
- `editions` — the editions you publish. **The `slug` is used in the database, so
  once you have published issues, do not change existing slugs.**
- `stats` — the four numbers on the home page
- `process` — the "How we work" steps
- `categories` — the ad categories listed on the Advertise page

Save, commit, push — Vercel redeploys automatically:

```bash
git add .
git commit -m "Update site details"
git push
```

To change the colours, edit the `@theme` block at the top of `app/globals.css`.

---

## Part 9 — Google (SEO)

The site already produces `sitemap.xml`, `robots.txt`, page titles, descriptions
and structured data. To finish:

1. Go to **search.google.com/search-console** → **Add property** → **URL prefix**
   → your domain.
2. Verify it (the **DNS record** method is easiest).
3. **Sitemaps** → submit `sitemap.xml`.
4. Add your business on **Google Business Profile** too — for a local paper this
   brings more traffic than anything else.

Give it one to two weeks to appear in results.

---

## Publishing an issue each week

1. Go to `your-domain.com/admin` and sign in.
2. **Publish** in the top menu.
3. Drag this week's PDF onto the box.
4. Fill in the title, choose the edition, check the date.
5. Click **Publish this issue**.

The cover picture and page count are worked out for you. The issue appears on
the site within about a minute.

**Keep PDFs under about 25 MB.** Readers on mobile data will thank you, and you
will fit far more issues in free storage. If your PDF is bigger, compress it —
`ilovepdf.com/compress_pdf` is free and works well.

---

## Adding a sponsor banner

1. `/admin` → **Banners**.
2. Upload the advertiser's image, enter their name and the link.
3. Choose where it appears:

| Placement | Suggested image size |
| --- | --- |
| Home — below hero | 1200 × 200 px |
| Home — mid page | 1200 × 250 px |
| Archive — between issues | 1200 × 200 px |
| Reader — beside the PDF | 600 × 500 px |
| Every page — above footer | 1200 × 200 px |

4. Optionally set an end date, then **Add banner**.

Views and clicks for each banner are shown on that page, so you have real numbers
to show the advertiser at renewal time.

---

## If something goes wrong

| Problem | What to do |
| --- | --- |
| Upload fails with a network error | R2 CORS (step 4.3). Check the domain matches exactly. |
| Site says it can't connect to the database | Supabase project is paused — open supabase.com and click Resume. Then do Part 6. |
| No sign-in code arrives | Check the address exists under Supabase → Authentication → Users, and that the email provider is enabled. Codes expire after a few minutes — request a new one. |
| New issue doesn't appear | Wait one minute and refresh — pages cache for 60 seconds. Also check it isn't saved as a Draft. |
| PDF won't open in the reader | Confirm the PDF opens normally on your computer, and that the bucket's public access is on (step 4.2). |
| Enquiry emails not arriving | Check `WEB3FORMS_ACCESS_KEY` in Vercel, and your spam folder. The enquiry is still saved in `/admin/enquiries` either way. |

---

## Your `.env.local` checklist

```
NEXT_PUBLIC_SITE_URL=             ← Part 5
NEXT_PUBLIC_SUPABASE_URL=         ← Part 2.4
NEXT_PUBLIC_SUPABASE_ANON_KEY=    ← Part 2.4
SUPABASE_SERVICE_ROLE_KEY=        ← Part 2.4  (secret!)
R2_ACCOUNT_ID=                    ← Part 4.4
R2_ACCESS_KEY_ID=                 ← Part 4.4
R2_SECRET_ACCESS_KEY=             ← Part 4.4  (secret!)
R2_BUCKET_NAME=adexpress-media    ← Part 4.1
NEXT_PUBLIC_R2_PUBLIC_URL=        ← Part 4.2
WEB3FORMS_ACCESS_KEY=             ← Part 7 (optional)
```

The same values must also be added in Vercel under
**Settings → Environment Variables**. `.env.local` is only used on your own
computer, and is deliberately never uploaded to GitHub.

---

## Appendix — Before you start: install Node.js

To run or build the site on your own computer you need **Node.js 20 or newer**.

1. Go to **nodejs.org** and download the **LTS** version for your operating system.
2. Install it, then open Terminal (macOS) or Command Prompt (Windows) and check:

```bash
node --version
```

You should see something like `v22.20.0`. Then, in the project folder:

```bash
npm install
npm run dev
```

You do **not** need Node.js installed to run the live website — Vercel, Netlify
and Cloudflare install it for you when they build. It is only needed if you want
to preview changes on your own machine first.
