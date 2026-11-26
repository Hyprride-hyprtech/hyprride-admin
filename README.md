# HYPRRIDE — staff sign-in

Served by GitHub Pages at <https://hyprride-hyprtech.github.io/hyprride-admin/>.
Deliberately **not** on a custom domain and not linked from the public site.

Bookings moved to Hyprverse: the website's booking pages forward customers there, and staff
manage bookings in the Hyprverse console. This page sends staff to the Hyprverse sign-in
(<https://hyprverse.in/login>), where the Hyprverse server checks who they are. Owner accounts
can sign in with a 6-digit code sent by email; team members use their Staff password.

The page has no Firebase, no password, no customer data, and makes no network requests (its
Content-Security-Policy is `default-src 'none'`). Its one script deletes the copy of old bookings
that the previous booking board kept in each staff browser.

| File | What it is |
|---|---|
| `index.html` | The sign-in page |
| `admin.css` | Its styles |
| `admin.js` | Deletes the old board's booking copy from the browser |

## History

Until 26 Nov 2026 this was a booking board on an old Firebase database whose bookings anyone
could read. That database is retired. **This repo is public:** never put customer data,
keys or a password check in it. A password written into a page's code protects nothing, because
anyone can read the code.
