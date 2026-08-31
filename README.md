# HYPRRIDE — staff admin panel

Internal booking board for HYPRRIDE. Served by GitHub Pages at
<https://hyprride-hyprtech.github.io/hyprride-admin/>.

Deliberately **not** on a custom domain — no `CNAME` file here, so it never appears
under hyprride.com and nothing on the public site links to it.

| File | What it is |
|---|---|
| `index.html` | The panel — Overview, Bookings, Fleet tabs |
| `admin.css` / `admin.js` | Styles / board logic, status actions, live poll |
| `admin-auth.js` | Firebase email one-time-link sign-in + allowed-staff list |

## Sign-in

Staff email → one-time link by email. Allowed addresses are in `ALLOWED_EMAILS` at the
top of `admin-auth.js`. The Firebase project must list this host under
**Authentication → Settings → Authorized domains**.

If Firebase is unreachable, a password form appears as a fallback.

> **This repo is public**, which is what free GitHub Pages requires. Treat the fallback
> password as public knowledge and rely on the email link as the real gate. Do not put
> customer data, keys or secrets in this repo. The Firebase config here is a client ID,
> which is safe to publish by design.

## Known limitation

The site is static, so bookings live in the browser they were made in. This board shows
bookings made on the same device — customer bookings arrive by WhatsApp, which stays the
source of truth.
