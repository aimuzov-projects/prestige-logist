<p align="center">
	<a href="https://github.com/aimuzov-projects/prestige-logist/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/aimuzov-projects/prestige-logist/deploy.yml?branch=main&label=deploy" alt="Deploy"></a>
	<a href="https://logist.aimuzov.online"><img src="https://img.shields.io/website?url=https%3A%2F%2Flogist.aimuzov.online&label=site" alt="Site status"></a>
	<a href="package.json"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Faimuzov-projects%2Fprestige-logist%2Fmain%2Fpackage.json&query=%24.engines.node&label=node&logo=nodedotjs&logoColor=white&color=5fa04e" alt="Node"></a>
	<a href="https://www.typescriptlang.org"><img src="https://img.shields.io/github/package-json/dependency-version/aimuzov-projects/prestige-logist/dev/typescript?logo=typescript&logoColor=white&color=3178c6" alt="TypeScript"></a>
	<a href="https://astro.build"><img src="https://img.shields.io/github/package-json/dependency-version/aimuzov-projects/prestige-logist/dev/astro?logo=astro&logoColor=white&color=bc52ee" alt="Astro"></a>
	<a href="https://svelte.dev"><img src="https://img.shields.io/github/package-json/dependency-version/aimuzov-projects/prestige-logist/dev/svelte?logo=svelte&logoColor=white&color=ff3e00" alt="Svelte"></a>
	<a href="https://caddyserver.com"><img src="https://img.shields.io/badge/Caddy-2.10-1f88c0?logo=caddy&logoColor=white" alt="Caddy"></a>
	<a href="https://www.docker.com"><img src="https://img.shields.io/badge/Docker-compose-2496ed?logo=docker&logoColor=white" alt="Docker"></a>
	<a href="LICENSE"><img src="https://img.shields.io/github/license/aimuzov-projects/prestige-logist" alt="License"></a>
</p>

<p align="center"><b>English</b> · <a href="README.ru.md">Русский</a></p>

Turns an electronic forwarding order (KND 1110486) into a road cargo carriage request (KND 1110361), FNS format 5.01: [logist.aimuzov.online](https://logist.aimuzov.online). The tool and the documents are in Russian.

An operator drops the order's zip, fills in what the order does not carry (order number, carrier, FIAS addresses, package kind) and downloads the request XML in windows-1251, ready for Diadoc and Kontur.Logistika.

## How it is built

Everything lives in `src/`:

- [`src/frontend`](src/frontend) — the [Astro](https://astro.build) site (`srcDir`). The wizard is a [Svelte 5](https://svelte.dev) island, its state is a class on runes in [`wizard.svelte.ts`](src/frontend/lib/wizard.svelte.ts).
- [`src/backend`](src/backend) — the API: plain `node:http`, Node runs the TypeScript itself, no build step. Five endpoints under `/api`: `analyze`, `build`, `carrier`, `address`, `packaging`.
  Inside, [`src/backend/core`](src/backend/core) is the conversion core: it reads zip and writes windows-1251, so it runs only in the API.
- [`src/shared`](src/shared) — what both sides need: the API contract types and a couple of pure helpers. The site never imports from `src/backend`.

The parsed order goes to the browser whole and comes back with every rebuild, so the zip is uploaded exactly once and the server keeps no state. The request is rebuilt on every form change with a 300 ms debounce, each new request aborts the previous one. Missing fields go into the draft as `[[Field name]]` placeholders, and the download stays disabled until none are left.

The output is **windows-1251** on purpose: Kontur.Logistika reads the file as 1251 regardless of the XML declaration, and a utf-8 file comes out with every field empty.

## Getting started

Requires Node 26.11.1, the same version is pinned in `package.json` and both Dockerfiles.

```sh
cp .env.example .env   # DADATA_TOKEN is optional: without it addresses and carriers are entered by hand
npm ci
npm run api            # the API on localhost:8787
npm run dev            # the site, /api is proxied to the API
```

Before committing:

```sh
npm run format:check && npm run lint:js && npm run lint:css && npm run check && npm test
```

## External sources

- [dadata](https://dadata.ru) — FIAS address search and company details by INN (EGRUL/EGRIP). The token is `DADATA_TOKEN` in `.env`.
- Kontur's open picklist of package kinds (OKVGUM type, `8A` is a wooden pallet), fetched once per process.

## Deployment

A push to `main` triggers GitHub Actions: checks first, then an SSH login to the `projects` server. There the key is bound to [`deploy/remote.sh`](deploy/remote.sh), which pulls `main` and rebuilds two containers from [`deploy/docker-compose.yml`](deploy/docker-compose.yml): `prestige-logist` (nginx with the static site) and `prestige-logist-api`. The shared Caddy from [aimuzov-projects/infra-server](https://github.com/aimuzov-projects/infra-server) serves the domain and sends `/api/*` to the API. `.env` with the dadata token lives on the server in `/srv/prestige-logist`.

## License

The code is licensed under [MIT](LICENSE).
