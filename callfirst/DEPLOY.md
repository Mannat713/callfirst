# Putting CallFirst live

Three things to do, about 30 minutes in total. You need no coding for any of them.

## 1. Put the code on GitHub (10 minutes)

1. Go to https://github.com and sign in, or create a free account.
2. Click the **+** at the top right, then **New repository**.
3. Name it `callfirst`. Choose **Public**. Leave every checkbox empty. Click **Create repository**.
4. On the next page, click the link **uploading an existing file**.
5. Unzip `callfirst.zip` on your computer. Open the unzipped `callfirst` folder, select **everything inside it**, and drag it all onto the GitHub page.
   - If you cannot see a folder called `.github`, turn on hidden files first: on Mac press `Cmd + Shift + .` in Finder; on Windows choose **View → Show → Hidden items**.
6. Wait for the upload to finish, then click **Commit changes**.

Your repository link is now `https://github.com/YOUR-USERNAME/callfirst`. This is the first link the submission form asks for.

## 2. Deploy on Vercel (5 minutes)

1. Go to https://vercel.com and choose **Continue with GitHub**.
2. Click **Add New… → Project**, find `callfirst` in the list, and click **Import**.
3. Open **Environment Variables** and add one:
   - Name: `NEXT_PUBLIC_SITE_URL`
   - Value: your domain with `https://` in front, for example `https://callfirst.in`
4. Click **Deploy** and wait about a minute. You will get an address ending in `.vercel.app`. Open it to check the site works.

## 3. Connect your own domain (15 minutes)

The competition does not accept the `.vercel.app` address, so you need a domain.

1. Buy one from Namecheap, GoDaddy or any registrar. A `.in` domain is usually the cheapest. Students can get one free through the GitHub Student Developer Pack.
2. In Vercel, open your project, then **Settings → Domains**. Type your domain and click **Add**.
3. Vercel shows one or two DNS records (an **A** record and a **CNAME**). Log in to where you bought the domain, open its **DNS** settings, and add exactly those records.
4. Wait. It usually takes a few minutes, sometimes up to an hour. Vercel shows a green tick when the domain is live and secure (HTTPS is set up for you).
5. If the domain differs from what you typed in step 2.3, update `NEXT_PUBLIC_SITE_URL` under **Settings → Environment Variables**, then **Deployments → … → Redeploy**.

Your live product link is `https://YOUR-DOMAIN`. This is the second link the form asks for.

## Optional bonus items

### Microsoft Clarity (analytics)

1. Go to https://clarity.microsoft.com, sign in, and create a project with your domain.
2. Copy the **Project ID** (Settings → Overview).
3. In Vercel add an environment variable `NEXT_PUBLIC_CLARITY_ID` with that ID, then redeploy.

Clarity loads on the home page, blog and privacy page. It is deliberately not loaded on the app page, so recordings can never contain a visitor's lead data.

### Google Search Console (SEO)

1. Go to https://search.google.com/search-console and add a property using **URL prefix** with your domain.
2. Choose the **HTML tag** method. Copy only the code inside `content="..."`.
3. In Vercel add an environment variable `NEXT_PUBLIC_GSC_VERIFICATION` with that code, then redeploy.
4. Back in Search Console click **Verify**, then open **Sitemaps** and submit `sitemap.xml`.

## Check before you submit

- [ ] `https://YOUR-DOMAIN` opens the landing page with a padlock in the address bar.
- [ ] **Try with sample leads** shows a ranked list.
- [ ] `https://YOUR-DOMAIN/sitemap.xml` lists your own domain, not `callfirst.in`.
- [ ] The GitHub repository is public.
