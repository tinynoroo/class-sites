# class-sites

A gallery where students upload the website they built as a folder, and it goes live right away.

Built for a web-making class: each student picks an address, drops in their folder, and gets a working URL to share. Everyone's site shows up on one gallery page. The interface is in Korean.

## How it works

1. **Upload.** Choose a folder that has an `index.html`, pick an address (`/sites/<address>/`), and enter a name and a password.
2. **Live.** The folder is served as a static site at that address, and a card is added to the gallery.
3. **Edit.** From the gallery card, enter the password to change the title or replace the files.

## Details

- **Whole-folder upload.** The selected top-level folder name is stripped, so `my-site/index.html` is served as `index.html`. `Index.html` and `INDEX.HTML` are normalized too.
- **Atomic replace.** Files are written to a temporary folder and swapped in, so a site never appears half-uploaded.
- **Junk is skipped.** Dotfiles, `node_modules`, `__MACOSX`, `Thumbs.db`, and `desktop.ini` are dropped on upload.
- **Per-site password.** Stored as a salted scrypt hash. After 10 wrong attempts a site is locked for 10 minutes.
- **Limits.** Up to 1,000 files and 100 MB per site (`MAX_UPLOAD_MB`).
- **Custom 404.** A site's own `404.html` is used when present.
- **No database.** Sites and their metadata are plain files under `storage/`.

## Running it

```
npm install
npm run dev
```

Or with Docker:

```
docker compose up --build
```

The compose file binds to `127.0.0.1:9006` and joins an external Docker network named `dbnet`, because it was written for a server managed with [noroo-deploy](https://github.com/tinynoroo/noroo-deploy). To run it on its own, create the network first (`docker network create dbnet`) or remove the `networks` lines.

| Variable | Default | Meaning |
|---|---|---|
| `STORAGE_DIR` | `storage` | Where uploaded sites and metadata are kept |
| `MAX_UPLOAD_MB` | `100` | Total size limit per site |

## Stack

Next.js (App Router), React, TypeScript. No database and no external services.

## A note on trust

Uploaded sites are served from the same origin as the gallery, and anyone who can reach the upload page can publish. That fits a classroom where you know who is uploading. It is not meant to be an open hosting service on the public internet.
