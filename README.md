<p align="center">
	<img src="https://img.shields.io/badge/English-0f8577?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MCAzMCI+PGNsaXBQYXRoIGlkPSJ0Ij48cGF0aCBkPSJNMzAsMTVoMzB2MTV6djE1aC0zMHpoLTMwdi0xNXp2LTE1aDMweiIvPjwvY2xpcFBhdGg+PHBhdGggZD0iTTAsMHYzMGg2MHYtMzB6IiBmaWxsPSIjMDEyMTY5Ii8+PHBhdGggZD0iTTAsMCA2MCwzME02MCwwIDAsMzAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSI2Ii8+PHBhdGggZD0iTTAsMCA2MCwzME02MCwwIDAsMzAiIGNsaXAtcGF0aD0idXJsKCN0KSIgc3Ryb2tlPSIjQzgxMDJFIiBzdHJva2Utd2lkdGg9IjQiLz48cGF0aCBkPSJNMzAsMHYzME0wLDE1aDYwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMTAiLz48cGF0aCBkPSJNMzAsMHYzME0wLDE1aDYwIiBzdHJva2U9IiNDODEwMkUiIHN0cm9rZS13aWR0aD0iNiIvPjwvc3ZnPg==" alt="English">
	<a href="README.ru.md"><img src="https://img.shields.io/badge/%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9-555?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5IDYiPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0wIDBoOXYzSDB6Ii8+PHBhdGggZmlsbD0iIzAwMzlhNiIgZD0iTTAgMmg5djJIMHoiLz48cGF0aCBmaWxsPSIjZDUyYjFlIiBkPSJNMCA0aDl2MkgweiIvPjwvc3ZnPg==" alt="Русский"></a>
</p>

<p align="center">
	<a href="https://logist.aimuzov.online"><img src=".github/assets/banner.en.jpg" alt="Logist: a carrier request from a forwarding order" width="100%"></a>
</p>

<p align="center">
	<a href="https://github.com/aimuzov-projects/prestige-logist/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/aimuzov-projects/prestige-logist/deploy.yml?branch=main&label=deploy" alt="Deploy"></a>
	<a href="https://logist.aimuzov.online"><img src="https://img.shields.io/website?url=https%3A%2F%2Flogist.aimuzov.online&label=site" alt="Site status"></a>
	<a href="package.json"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Faimuzov-projects%2Fprestige-logist%2Fmain%2Fpackage.json&query=%24.engines.node&label=node&logo=nodedotjs&logoColor=white&color=5fa04e" alt="Node"></a>
	<a href="https://astro.build"><img src="https://img.shields.io/github/package-json/dependency-version/aimuzov-projects/prestige-logist/dev/astro?logo=astro&logoColor=white&color=bc52ee" alt="Astro"></a>
	<a href="https://svelte.dev"><img src="https://img.shields.io/github/package-json/dependency-version/aimuzov-projects/prestige-logist/dev/svelte?logo=svelte&logoColor=white&color=ff3e00" alt="Svelte"></a>
	<a href="LICENSE"><img src="https://img.shields.io/github/license/aimuzov-projects/prestige-logist" alt="License"></a>
</p>

<h3 align="center">A carrier request from a forwarding order</h3>
<p align="center">An electronic forwarding order (KND 1110486) in, a road carriage request (KND 1110361) in windows-1251 out, ready for Diadoc and Kontur.Logistika</p>

<table>
	<tr>
		<td width="50%" align="center"><img src=".github/assets/form.jpg" alt="Parsed order"><br><b>Order</b> parsed, gaps listed in the sidebar</td>
		<td width="50%" align="center"><img src=".github/assets/route.jpg" alt="Route in the dark theme"><br><b>Route</b> with FIAS addresses</td>
	</tr>
</table>

Lives at [logist.aimuzov.online](https://logist.aimuzov.online). A static [Astro](https://astro.build) site with a single Svelte island, the request form, plus a small Node API with no build step (`src/backend/`) that parses the order, writes the XML and talks to dadata.

An operator drops the order's zip, fills in what the order does not carry and downloads the request XML that Diadoc and Kontur.Logistika expect.

The tool and the documents are in Russian, so the names below are translated.

## What's inside

- **Form** (`/`): one long scroll with four sections: order, carrier, route, request. The sidebar and Back/Next scroll to sections, and the highlight follows the screen. The sidebar lists what is still missing by section, and missing fields are highlighted in the form.
- **Demo**: "Open example" loads a synthetic order, and its archive can be downloaded and uploaded by hand (`public/demo/poruchenie-primer.zip`). All companies and INNs in it are fictional.
- **Download**: the "Download request" button never goes grey. Pressed too early, it shows a toast with what is missing and scrolls to the first gap.
- **Keyboard**: Tab walks only through fields and edit buttons, the "?" tips and navigation are out of it, so the form fills in without a mouse. Address and package suggestions also take the arrow keys.
- **How it works** (`/about`): a help page for the operator.
- **Theme**: light and dark, follows the system by default.
- **API**: `POST /api/analyze`, `POST /api/build`, `GET /api/carrier`, `GET /api/address`, `GET /api/packaging`, `GET /api/health`.

## How it is built

Everything lives in `src/`:

- [`src/frontend`](src/frontend): the Astro site (`srcDir`). The form is a [Svelte 5](https://svelte.dev) island, its state is a class on runes in [`wizard.svelte.ts`](src/frontend/lib/wizard.svelte.ts).
- [`src/backend`](src/backend): the API on plain `node:http`, Node runs the TypeScript itself. Inside, [`src/backend/core`](src/backend/core) is the conversion core: it reads zip and writes windows-1251, so it runs only in the API.
- [`src/shared`](src/shared): what both sides need, the API contract types, the required fields and a couple of pure helpers. The site never imports from `src/backend`.

Every file, components included, is named in kebab-case, and the `unicorn/filename-case` rule in oxlint keeps it that way.

The parsed order goes to the browser whole and comes back with every rebuild, so the zip is uploaded exactly once and the server keeps no state.

The request is rebuilt on every form change with a 300 ms debounce, each new request aborts the previous one. The form counts the gaps itself by the same rules as the server ([`src/shared/fields.ts`](src/shared/fields.ts)), so the highlight doesn't wait for a response. In the XML missing fields become placeholders like `[[Order number]]`.

The output is **windows-1251** on purpose: Kontur.Logistika reads the file as 1251 regardless of the XML declaration, and a utf-8 file comes out with every field empty.

## What the operator fills in

| Field                     | Source                                                         |
| ------------------------- | -------------------------------------------------------------- |
| Order number              | by hand only                                                   |
| Carrier INN               | by hand, the rest of the details come from EGRUL/EGRIP         |
| Loading and unloading     | from the order if it has FIAS, otherwise a dadata search       |
| Loading and delivery date | from `ДатОтгрС` and `ДатДостГрС` of the order                  |
| Package kind              | Kontur's picklist (`8A` is a wooden pallet)                    |
| Signer                    | from the forwarder's title, asked only when there was no title |

Fixed values (times, cargo state, vehicle parameters) live in [`src/backend/core/request/constants.ts`](src/backend/core/request/constants.ts), time zones are derived from the region code of each address in [`src/backend/core/timezone.ts`](src/backend/core/timezone.ts). The Russian README has the full field mapping between the two documents.

## Running

Stack and layout follow [infra-site-template](https://github.com/aimuzov-projects/infra-site-template): Astro + Svelte 5, Prettier, oxlint, stylelint (BEM), `node --test`. Requires Node 26.11.1, the same version is pinned in `package.json` and both Dockerfiles.

```sh
cp .env.example .env   # DADATA_TOKEN is optional: without it addresses and carriers are entered by hand
npm ci
npm run api            # the API on localhost:8787
npm run dev            # the site, /api is proxied to the API
```

Before committing, the same checks as in CI:

```sh
npm run format:check && npm run lint:js && npm run lint:css && npm run check && npm test
```

The core tests (`node --test`) build a request from the synthetic order in [`src/backend/core/fixtures`](src/backend/core/fixtures) and check the encoding, time zones and placeholders.

The e2e tests in [`e2e`](e2e) build the site and open it in Chromium with the shared checks of [infra-site-kit](https://github.com/aimuzov-projects/infra-site-kit): the sitemap pages answer without console errors and pass axe, the theme button switches the scheme and peeks at the other one. The browser is installed once with `npx playwright install chromium`, then `npm run test:e2e`.

## Content Security Policy

The build puts a CSP with hashes of Astro's scripts and styles into every page (the `security.csp` option in `astro.config.mjs`), with no third-party sources at all. `npm run dev` has no policy, so violations only show up after `npm run build && npm run preview` and in production.

- No `style=""` attributes or handlers like `onclick`: styles go through classes, handlers live in `<script>`.
- An inline script that runs before the first paint doesn't pass by hash, so the theme choice lives in a separate file, [`public/theme.js`](public/theme.js).

## External sources

- [dadata](https://dadata.ru): FIAS address search and company details by INN (EGRUL/EGRIP). The token is `DADATA_TOKEN` in `.env`.
- Kontur's open picklist of package kinds (OKVGUM type), fetched once per process and cached.

## Deployment

The projects server from [infra-server](https://github.com/aimuzov-projects/infra-server): merging the release PR that release-please keeps open runs `deploy.yml`, which runs the checks and logs in over SSH. There the key runs the shared [`deploy/site.sh`](https://github.com/aimuzov-projects/infra-server/blob/main/deploy/site.sh) of infra-server, which pulls `main` and rebuilds two containers from [`deploy/docker-compose.yml`](deploy/docker-compose.yml): `prestige-logist` (nginx with the static site) and `prestige-logist-api`. The domain, TLS and the `/api` route are handled by the shared Caddy. `.env` with the dadata token lives on the server in `/srv/prestige-logist`.

To roll back fast, run Deploy by hand with the previous tag: `gh workflow run deploy.yml -f tag=v1.2.3`. A fix of the bad commit goes out through the release PR like any change.

## License

The code is licensed under [MIT](LICENSE).
