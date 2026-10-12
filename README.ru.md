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

<p align="center"><a href="README.md">English</a> · <b>Русский</b></p>

Из электронного поручения экспедитору (КНД 1110486) делает заказ-заявку на перевозку груза автомобильным транспортом (КНД 1110361), формат ФНС 5.01: [logist.aimuzov.online](https://logist.aimuzov.online).

Оператор перетаскивает zip поручения, дозаполняет то, чего в поручении нет, и скачивает XML заявки в windows-1251 — такой, какой ждут Диадок и Контур Логистика.

## Как устроено

Всё живёт в `src/`:

- [`src/frontend`](src/frontend) — сайт на [Astro](https://astro.build) (`srcDir`). Визард — остров на [Svelte 5](https://svelte.dev), состояние — класс на рунах в [`wizard.svelte.ts`](src/frontend/lib/wizard.svelte.ts).
- [`src/backend`](src/backend) — API на голом `node:http`, Node запускает TypeScript сам, без сборки. Пять ручек под `/api`: `analyze`, `build`, `carrier`, `address`, `packaging`.
  Внутри, в [`src/backend/core`](src/backend/core), — ядро конвертации: оно читает zip и пишет windows-1251, поэтому работает только в API.
- [`src/shared`](src/shared) — то, что нужно обеим сторонам: типы контракта API и пара чистых функций. Сайт из `src/backend` ничего не импортирует.

Визард из четырёх шагов: поручение → перевозчик → маршрут → заявка. Шаги — вкладки, ходить по ним можно в любом порядке, на каждой видно, сколько там осталось незаполненного.

Разобранное поручение сразу уезжает на клиент целиком. Обратно на сервер уходит уже оно, а не исходный zip: файл поднимается ровно один раз, состояния на сервере не остаётся вовсе.

Заявка пересобирается сама на каждую правку формы — с паузой 300 мс, и каждый новый запрос отменяет предыдущий, поэтому быстрый набор не оставляет ответов, пришедших не в том порядке. Незаполненное уходит в XML заглушками вида `[[Номер заказа]]`, а скачивание закрыто, пока список пропусков не опустеет.

Выход — **windows-1251**, как у Диадока и Контур Логистики. Это не косметика: Логистика разбирает файл как 1251, не глядя на декларацию, и от utf-8 у неё все поля выходят пустыми.

## Что заполняет оператор

| Поле                       | Откуда берётся                                                |
| -------------------------- | ------------------------------------------------------------- |
| Номер заказа               | только руками                                                 |
| ИНН перевозчика            | руками, остальные реквизиты подтянутся из ЕГРЮЛ/ЕГРИП         |
| Адреса погрузки и выгрузки | из поручения, если там ФИАС; иначе поиском по dadata          |
| Даты подачи и выгрузки     | из `ДатОтгрС` и `ДатДостГрС` поручения                        |
| Вид тары                   | поиск по справочнику Контура (`8A` — поддон деревянный)       |
| Подписант                  | из титула экспедитора; спрашиваем, только если титула не было |

Свои реквизиты собираются по ИНН экспедитора из поручения, и старшинство источников разное ([`src/backend/core/prefill.ts`](src/backend/core/prefill.ts)): полное наименование главнее в ЕГРЮЛ, потому что заявке нужно полное, а поручение везёт краткое; адрес — наоборот из поручения, потому что в ЕГРЮЛ он юридический.

Всё остальное зашито в [`src/backend/core/request/constants.ts`](src/backend/core/request/constants.ts): время подачи и выгрузки (`09:00:00`), `СостГруз`, `МетОпрМасс`, `РаспрГр`, `ДелГр`, габариты места и параметры ТС нулями, согласования времён. Опустить эти атрибуты нельзя — эталоны выводят их всегда, и без них принимающая сторона не разбирает соседние поля.

Двух вещей в заявке нет намеренно: телефона грузоотправителя (блок `Конт` не выводится) и ящика ЭДО перевозчика — взять его неоткуда, поэтому сегмент получателя в `ИдФайл` остаётся пустым.

## Что переносится из поручения

| Заявка                          | Поручение                                |
| ------------------------------- | ---------------------------------------- |
| `СвГО` — заказчик               | `СвЭксп` — экспедитор                    |
| `ОргВладИнфр` на погрузке       | `СвГруз/СвГО` — грузоотправитель         |
| `ПунктПод`, `АдрПункт` погрузки | `АдрГруз/АдрПриемГруз` + `ДатОтгрС`      |
| `АдрПункт` выгрузки             | `АдрПунктНазн/АдрВыдГруз` + `ДатДостГрС` |
| `ОпГруз`, `МасГруз`             | `СвГруз/ОпГруз` + `ВесГруз`              |
| `ПарТСПрвз/@ТипПогр`            | `СвТС/@ТипКузов` (`Боковая` → `бок`)     |
| `ПодпИнфГО`                     | `ПодпИнфЭксп` титула экспедитора         |

Адреса переезжают из `АдрГАР` в `АдрФИАС`: структура совпадает, убирается только `НаимРегион`.

Часовой пояс у каждой точки свой: он выводится из кода региона её адреса по таблице в [`src/backend/core/timezone.ts`](src/backend/core/timezone.ts). Погрузка в Свердловской области даёт `+05:00`, выгрузка в Москве — `+03:00`. Неизвестный регион откатывается на московское время. Области хватает для 83 субъектов, а Якутия и Сахалин на области не делятся — там пояс уточняется по району из адреса.

Дата и время формирования заявки — московские: у контейнера API стоит `TZ=Europe/Moscow`.

## Запуск

Нужен Node 26.11.1, та же версия закреплена в `package.json` и в обоих Dockerfile.

```sh
cp .env.example .env   # DADATA_TOKEN необязателен: без него адреса и перевозчик вводятся руками
npm ci
npm run api            # API на localhost:8787
npm run dev            # сайт, /api проксируется в API
```

Перед коммитом:

```sh
npm run format:check && npm run lint:js && npm run lint:css && npm run check && npm test
```

Тесты ядра (`node --test`) собирают заявку из синтетического поручения в [`src/backend/core/fixtures`](src/backend/core/fixtures) и проверяют кодировку, пояса и заглушки.

## Внешние источники

- [dadata](https://dadata.ru) — поиск адреса по ФИАС и реквизиты по ИНН из ЕГРЮЛ/ЕГРИП. Токен — `DADATA_TOKEN` в `.env`.
- Справочник видов тары — открытый список Контура (ОКВГУМТип), тянется один раз на процесс и кэшируется.

## Выкладка

Пуш в `main` запускает GitHub Actions: сначала проверки, затем вход по SSH на сервер `projects`. Там ключ привязан к [`deploy/remote.sh`](deploy/remote.sh): он подтягивает `main` и пересобирает два контейнера из [`deploy/docker-compose.yml`](deploy/docker-compose.yml) — `prestige-logist` (nginx со статикой) и `prestige-logist-api`. Домен держит общий Caddy из [aimuzov-projects/infra-server](https://github.com/aimuzov-projects/infra-server), `/api/*` он отдаёт API. `.env` с токеном dadata лежит на сервере в `/srv/prestige-logist`.

## Лицензия

Код — под [MIT](LICENSE).
