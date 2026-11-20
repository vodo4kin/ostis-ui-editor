# ostis-ui-editor

Визуальный редактор пользовательских интерфейсов для среды OSTIS.

Модель интерфейса представляется в sc-памяти в терминах абстрактных понятий `concept_ui_*` и отношений `nrel_ui_*`. 

Клиентская часть реализована на TypeScript и React. Доступ к sc-памяти выполняется через библиотеку [ts-sc-client](https://github.com/ostis-ai/ts-sc-client). 

В качестве сервера используется sc-machine.

Структура репозитория:

- `client` — исходный код редактора;
- `docs` — каталог типов и свойств, формальная схема UI, демонстрационные материалы;
- `ui_examples` — примеры интерфейсов в формате SCs.

## Требования

Для работы необходимы:

1. Установленный и собранный [ostis-example-app](https://github.com/ostis-apps/ostis-example-app) (sc-machine). (**ВАЖНО! Используйте Native Installation**)
2. Загрузка в базу знаний формальной схемы UI.
3. [Node.js](https://nodejs.org/en) для запуска клиентской части.

Адрес подключения клиента к серверу по умолчанию: `ws://127.0.0.1:8090/ws_json`.

## Формальная схема UI в базе знаний

Схема задаёт классы компонентов, классы свойств и отношения модели UI.

Расположение файла схемы:

- в репозитории редактора — `docs/abstract_ui_model.scs`;
- в дереве ostis-example-app — `knowledge-base/ui_editor_model/abstract_ui_model.scs`.

Для подготовки базы знаний скопируйте `docs/abstract_ui_model.scs` по пути:

```text
knowledge-base/ui_editor_model/abstract_ui_model.scs
```

Затем из корня ostis-example-app выполните сборку базы знаний и запуск sc-machine:

```bash
./scripts/start.sh build_kb
./scripts/start.sh machine
```

Файлы `.gwf` в каталоге `docs` предназначены для просмотра конструкций в редакторе SCg и в сборку базы знаний не включаются.

Описание типов компонентов, свойств и соответствия имён редактора именам в SC приведено в `docs/catalog.md`.

## Клиентская часть

Установка зависимостей и запуск в режиме разработки:

```bash
cd client
npm install
npm run dev
```

Адрес приложения выводится [Vite](https://vite.dev/), обычно `http://127.0.0.1:5173`.

Сборка клиентской части:

```bash
cd client
npm run build
```

## Порядок запуска

1. Разместить схему UI в базе знаний ostis-example-app.
2. Выполнить `./scripts/start.sh build_kb`.
3. При необходимости установить модуль трансляции SC-HTML (см. ниже).
4. Выполнить `./scripts/start.sh machine` и убедиться, что сервер слушает порт `8090`.
5. В каталоге `client` выполнить `npm install`, затем `npm run dev`.
6. Открыть адрес клиента в браузере.

В редакторе доступны получение списка интерфейсов из базы знаний, создание, сохранение и удаление интерфейса. При отсутствии связи с базой знаний используется команда «Подключиться к БЗ».

## Модуль трансляции SC-HTML

Предпросмотр и экспорт HTML выполняются агентом внешней библиотеки [ostis-ui](https://github.com/Glentas/ostis-ui) (ветка `feature/SCS_to_HTML`).

Сборка модуля выполняется отдельно от ostis-example-app. Версия sc-machine — `0.10.5`, как у ostis-example-app. Для C++ необходим стандарт **20**.

```bash
git clone https://github.com/Glentas/ostis-ui.git
cd ostis-ui
git switch feature/SCS_to_HTML

python3 -m venv .venv
source .venv/bin/activate
pip install conan

conan profile detect
conan remote add ostis-ai https://conan.ostis.net/artifactory/api/conan/ostis-ai-library

conan install . -s build_type=Release -s compiler.cppstd=20 --build=missing
cmake --preset release-conan
cmake --build --preset release
```

Готовая библиотека:

```text
ostis-ui/build/Release/lib/libostis-ui-html-translator.so
```

Её нужно скопировать в каталог расширений ostis-example-app:

```bash
cp build/Release/lib/libostis-ui-html-translator.so \
  /path/to/ostis-example-app/build/Release/extensions/
```

Перезапустите sc-machine. В журнале старта должны быть строки вида:

```text
Initialize module: .../libostis-ui-html-translator.so
Initialize HTMLTranslatorModule
Subscribe agent implementation `htmlTranslationModule::HTMLTranslatorAgent` ...
```

После этого в редакторе:

- **Предпросмотр** — сохранение текущего интерфейса в БЗ, запуск агента и открытие HTML во вкладке браузера;
- **Экспорт → html** — то же для выбранного интерфейса с сохранением файла `.html` на диск.

## Примеры

Примеры интерфейсов, описанные на SCs, представлены в каталоге [`ui_examples`](ui_examples).

## Горячие клавиши

Модификатор **Mod** — `Ctrl` на Windows и Linux, `Cmd` на macOS. Сочетания действуют при открытом интерфейсе, вне полей ввода.

| Действие | Сочетание |
|---|---|
| Сохранить в БЗ | Mod+S |
| Экспорт текущего интерфейса (SCs) | Mod+Shift+S |
| Отменить | Mod+Z |
| Повторить | Mod+Shift+Z или Mod+Y |
| Выделить все компоненты | Mod+A |
| Дублировать выделенное | Mod+D |
| Вырезать | Mod+X |
| Копировать | Mod+C |
| Вставить | Mod+V |
| Удалить выделенное | Delete или Backspace |
| Снять выделение | Esc |
| Сдвиг на 1 px | ← ↑ → ↓ |
| Сдвиг на 10 px | Shift+← ↑ → ↓ |
| Слой выше | Alt+↑ |
| Слой ниже | Alt+↓ |

## В разработке

- диалоговый режим и генерация интерфейса по запросу пользователя;
- адаптация интерфейса под контекст использования.
