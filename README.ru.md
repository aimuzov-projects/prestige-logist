<p align="center">
	<a href="README.md"><img src="https://img.shields.io/badge/English-555?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MCAzMCI+PGNsaXBQYXRoIGlkPSJ0Ij48cGF0aCBkPSJNMzAsMTVoMzB2MTV6djE1aC0zMHpoLTMwdi0xNXp2LTE1aDMweiIvPjwvY2xpcFBhdGg+PHBhdGggZD0iTTAsMHYzMGg2MHYtMzB6IiBmaWxsPSIjMDEyMTY5Ii8+PHBhdGggZD0iTTAsMCA2MCwzME02MCwwIDAsMzAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSI2Ii8+PHBhdGggZD0iTTAsMCA2MCwzME02MCwwIDAsMzAiIGNsaXAtcGF0aD0idXJsKCN0KSIgc3Ryb2tlPSIjQzgxMDJFIiBzdHJva2Utd2lkdGg9IjQiLz48cGF0aCBkPSJNMzAsMHYzME0wLDE1aDYwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMTAiLz48cGF0aCBkPSJNMzAsMHYzME0wLDE1aDYwIiBzdHJva2U9IiNDODEwMkUiIHN0cm9rZS13aWR0aD0iNiIvPjwvc3ZnPg==" alt="English"></a>
	<img src="https://img.shields.io/badge/%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9-0f8577?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5IDYiPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0wIDBoOXYzSDB6Ii8+PHBhdGggZmlsbD0iIzAwMzlhNiIgZD0iTTAgMmg5djJIMHoiLz48cGF0aCBmaWxsPSIjZDUyYjFlIiBkPSJNMCA0aDl2MkgweiIvPjwvc3ZnPg==" alt="Русский">
</p>

<p align="center">
	<a href="https://logist.aimuzov.online"><img src=".github/assets/banner.jpg" alt="Логист: заявка перевозчику из поручения экспедитору" width="100%"></a>
</p>

<p align="center">
	<a href="https://github.com/aimuzov-projects/prestige-logist/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/aimuzov-projects/prestige-logist/deploy.yml?branch=main&label=deploy" alt="Deploy"></a>
	<a href="https://logist.aimuzov.online"><img src="https://img.shields.io/website?url=https%3A%2F%2Flogist.aimuzov.online&label=site" alt="Site status"></a>
	<a href="package.json"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Faimuzov-projects%2Fprestige-logist%2Fmain%2Fpackage.json&query=%24.engines.node&label=node&logo=nodedotjs&logoColor=white&color=5fa04e" alt="Node"></a>
	<a href="https://astro.build"><img src="https://img.shields.io/github/package-json/dependency-version/aimuzov-projects/prestige-logist/dev/astro?logo=astro&logoColor=white&color=bc52ee" alt="Astro"></a>
	<a href="https://svelte.dev"><img src="https://img.shields.io/github/package-json/dependency-version/aimuzov-projects/prestige-logist/dev/svelte?logo=svelte&logoColor=white&color=ff3e00" alt="Svelte"></a>
	<a href="LICENSE"><img src="https://img.shields.io/github/license/aimuzov-projects/prestige-logist" alt="License"></a>
</p>

<h3 align="center">Заявка перевозчику из поручения экспедитору</h3>
<p align="center">Электронное поручение (КНД 1110486) на входе, заказ-заявка на перевозку (КНД 1110361) в windows-1251 на выходе — для Диадока и Контур Логистики</p>

<table>
	<tr>
		<td width="50%" align="center"><img src=".github/assets/form.jpg" alt="Разобранное поручение"><br><b>Поручение</b> разобрано, пропуски в сайдбаре</td>
		<td width="50%" align="center"><img src=".github/assets/route.jpg" alt="Маршрут в тёмной теме"><br><b>Маршрут</b>: адреса по ФИАС</td>
	</tr>
</table>

Живёт на [logist.aimuzov.online](https://logist.aimuzov.online). Статичный сайт на [Astro](https://astro.build) с одним островом на Svelte, формой заявки, и маленький API на Node без сборки (`src/backend/`): он разбирает поручение, собирает XML и ходит в dadata.

Оператор перетаскивает zip поручения, дозаполняет то, чего в поручении нет, и скачивает XML заявки — такой, какой ждут Диадок и Контур Логистика.

## Что внутри

- **Форма** (`/`): одна длинная прокрутка из четырёх разделов — поручение, перевозчик, маршрут, заявка. Сайдбар и «Назад/Дальше» прокручивают к разделам, подсветка следует за экраном. В сайдбаре список того, что осталось заполнить, по разделам; незаполненные поля в форме подсвечены.
- **Пример**: «Открыть пример» загружает синтетическое поручение, а архив с ним можно скачать и загрузить самому (`public/demo/poruchenie-primer.zip`). Все компании и ИНН в нём вымышленные.
- **Скачивание**: кнопка «Скачать заявку» не гаснет. Нажали раньше времени — тост перечисляет, чего не хватает, и форма прокручивается к первому пропуску.
- **Клавиатура**: Tab ходит только по полям и кнопкам правки, «?» и навигация из него убраны — форма заполняется без мыши. По вариантам адресов и тары можно ходить стрелками.
- **Как это работает** (`/about`): справка для оператора.
- **Тема**: светлая и тёмная, по умолчанию как в системе.
- **API**: `POST /api/analyze`, `POST /api/build`, `GET /api/carrier`, `GET /api/address`, `GET /api/packaging`, `GET /api/health`.

## Как устроено

Всё живёт в `src/`:

- [`src/frontend`](src/frontend) — сайт на Astro (`srcDir`). Форма — остров на [Svelte 5](https://svelte.dev), состояние — класс на рунах в [`wizard.svelte.ts`](src/frontend/lib/wizard.svelte.ts).
- [`src/backend`](src/backend) — API на голом `node:http`, Node запускает TypeScript сам. Внутри, в [`src/backend/core`](src/backend/core), — ядро конвертации: оно читает zip и пишет windows-1251, поэтому работает только в API.
- [`src/shared`](src/shared) — то, что нужно обеим сторонам: типы контракта API, обязательные поля и пара чистых функций. Сайт из `src/backend` ничего не импортирует.

Все файлы, компоненты тоже, называются в kebab-case, за этим следит правило `unicorn/filename-case` в oxlint.

Разобранное поручение сразу уезжает на клиент целиком. Обратно на сервер уходит уже оно, а не исходный zip: файл поднимается ровно один раз, состояния на сервере не остаётся вовсе.

Заявка пересобирается сама на каждую правку формы — с паузой 300 мс, и каждый новый запрос отменяет предыдущий. Пропуски форма считает сама по тем же правилам, что и сервер ([`src/shared/fields.ts`](src/shared/fields.ts)), поэтому подсветка не ждёт ответа. В XML незаполненное уходит заглушками вида `[[Номер заказа]]`.

Выход — **windows-1251**, как у Диадока и Контур Логистики. Это не косметика: Логистика разбирает файл как 1251, не глядя на декларацию, и от utf-8 у неё все поля выходят пустыми.

## Что заполняет оператор

| Поле                       | Откуда берётся                                                |
| -------------------------- | ------------------------------------------------------------- |
| Номер заказа               | только руками                                                 |
| ИНН перевозчика            | руками, остальные реквизиты подтянутся из ЕГРЮЛ/ЕГРИП         |
| Адреса погрузки и выгрузки | из поручения, если там ФИАС; иначе поиском по dadata          |
| Даты подачи и выгрузки     | из `ДатОтгрС` и `ДатДостГрС` поручения                        |
| Вид тары                   | поиск по справочнику Контура (`8A` — поддон деревянный)       |
| Подписант                  | из титула экспедитора; спрашиваем, только если титула не было |

Свои реквизиты собираются по ИНН экспедитора из поручения, и старшинство источников разное ([`src/backend/core/prefill.ts`](src/backend/core/prefill.ts)): полное наименование главнее в ЕГРЮЛ, потому что заявке нужно полное, а поручение везёт краткое; адрес — наоборот из поручения, потому что в ЕГРЮЛ он юридический.

Всё остальное зашито в [`src/backend/core/request/constants.ts`](src/backend/core/request/constants.ts): время подачи и выгрузки (`09:00:00`), `СостГруз`, `МетОпрМасс`, `РаспрГр`, `ДелГр`, габариты места и параметры ТС нулями, согласования времён. Опустить эти атрибуты нельзя — эталоны выводят их всегда, и без них принимающая сторона не разбирает соседние поля.

Двух вещей в заявке нет намеренно: телефона грузоотправителя (блок `Конт` не выводится) и ящика ЭДО перевозчика — взять его неоткуда, поэтому сегмент получателя в `ИдФайл` остаётся пустым.

## Что переносится из поручения

| Заявка                          | Поручение                                |
| ------------------------------- | ---------------------------------------- |
| `СвГО` — заказчик               | `СвЭксп` — экспедитор                    |
| `ОргВладИнфр` на погрузке       | `СвГруз/СвГО` — грузоотправитель         |
| `ПунктПод`, `АдрПункт` погрузки | `АдрГруз/АдрПриемГруз` + `ДатОтгрС`      |
| `АдрПункт` выгрузки             | `АдрПунктНазн/АдрВыдГруз` + `ДатДостГрС` |
| `ОпГруз`, `МасГруз`             | `СвГруз/ОпГруз` + `ВесГруз`              |
| `ПарТСПрвз/@ТипПогр`            | `СвТС/@ТипКузов` (`Боковая` → `бок`)     |
| `ПодпИнфГО`                     | `ПодпИнфЭксп` титула экспедитора         |

Адреса переезжают из `АдрГАР` в `АдрФИАС`: структура совпадает, убирается только `НаимРегион`.

Часовой пояс у каждой точки свой: он выводится из кода региона её адреса по таблице в [`src/backend/core/timezone.ts`](src/backend/core/timezone.ts). Погрузка в Свердловской области даёт `+05:00`, выгрузка в Москве — `+03:00`. Неизвестный регион откатывается на московское время. Области хватает для 83 субъектов, а Якутия и Сахалин на области не делятся — там пояс уточняется по району из адреса.

Дата и время формирования заявки — московские: у контейнера API стоит `TZ=Europe/Moscow`.

## Запуск

Стек и раскладка как в [infra-template-site](https://github.com/aimuzov-projects/infra-template-site): Astro + Svelte 5, Prettier, oxlint, stylelint (БЭМ), `node --test`. Нужен Node 26.11.1, та же версия закреплена в `package.json` и в обоих Dockerfile.

```sh
cp .env.example .env   # DADATA_TOKEN необязателен: без него адреса и перевозчик вводятся руками
npm ci
npm run api            # API на localhost:8787
npm run dev            # сайт, /api проксируется в API
```

Перед коммитом те же проверки, что в CI:

```sh
npm run format:check && npm run lint:js && npm run lint:css && npm run check && npm test
```

Тесты ядра (`node --test`) собирают заявку из синтетического поручения в [`src/backend/core/fixtures`](src/backend/core/fixtures) и проверяют кодировку, пояса и заглушки.

## Content Security Policy

Сборка кладёт в каждую страницу CSP с хешами скриптов и стилей Astro (настройка `security.csp` в `astro.config.mjs`). Чужих источников в ней нет совсем. В `npm run dev` политики нет, поэтому нарушения видны только после `npm run build && npm run preview` и на проде.

- Никаких атрибутов `style=""` и обработчиков вроде `onclick`: стили задаются классами, обработчики живут в `<script>`.
- Встроенный скрипт до отрисовки по хешу не проходит, поэтому выбор темы лежит отдельным файлом [`public/theme.js`](public/theme.js).

## Внешние источники

- [dadata](https://dadata.ru) — поиск адреса по ФИАС и реквизиты по ИНН из ЕГРЮЛ/ЕГРИП. Токен — `DADATA_TOKEN` в `.env`.
- Справочник видов тары — открытый список Контура (ОКВГУМТип), тянется один раз на процесс и кэшируется.

## Выкладка

Сервер projects из [infra-server](https://github.com/aimuzov-projects/infra-server): пуш в `main` запускает `deploy.yml`, тот прогоняет проверки и заходит по SSH. Там ключ привязан к [`deploy/remote.sh`](deploy/remote.sh), который подтягивает `main` и пересобирает два контейнера из [`deploy/docker-compose.yml`](deploy/docker-compose.yml): `prestige-logist` (nginx со статикой) и `prestige-logist-api`. Домен, TLS и маршрут `/api` держит общий Caddy. `.env` с токеном dadata лежит на сервере в `/srv/prestige-logist`.

Откатить выкладку: сделать `git revert` плохого коммита в `main` и запушить.

## Лицензия

Код распространяется по лицензии [MIT](LICENSE).
