# Каталог компонентов и свойств (v1)

Контракт редактора и смежных подсистем. Типы и связи задаёт редактор.  
Источник значений по умолчанию в коде: `client/src/model/catalog.ts`.

## Типы компонентов

| id | Название | Превью |
|---|---|---|
| `container` | Контейнер | rect |
| `row` | Строка | rect |
| `column` | Столбец | rect |
| `divider` | Разделитель | rect |
| `text_field` | Поле текста | rounded |
| `button` | Кнопка | rounded |
| `list` | Список | rect |
| `label` | Текстовая метка | rect |
| `task_panel` | Панель условия задания | rect |
| `code_editor` | Редактор кода | rect |
| `results_panel` | Панель результатов проверки | rect |
| `dialog_panel` | Панель диалога с ассистентом | rect |
| `hints_panel` | Панель подсказок | rect |
| `history_panel` | Панель истории | rect |
| `steps_panel` | Панель шагов | rect |
| `solution_panel` | Панель решения | rect |
| `bubble` | Пузырь | pill |
| `modal` | Модальное окно | rounded |
| `tabs` | Вкладки | rounded |

## Виды связей

| id | Назначение |
|---|---|
| `contains` | вложение |
| `code_link` | к редактору кода |
| `result_link` | к результатам |
| `dialog_link` | к диалогу |
| `history_link` | к истории |

## Словарь свойств

База: `name`, `x`, `y`, `width`, `height`, `order`, `visible`, `enabled`, `opacity`, `margin`, `tooltip`.

Вид: `backgroundColor`, `color`, `borderColor`, `borderWidth`, `borderStyle`, `borderRadius`, `fontSize`, `fontWeight`, `textAlign`.

Раскладка: `padding`, `flexGrow`, `flexShrink`, `alignSelf`.

Лимиты: `minWidth`, `minHeight`, `maxWidth`, `maxHeight`.

Текст / ввод: `text`, `placeholder`, `readOnly`.

Семантика: `semanticRole`, `actionId` (только у кнопки).

Служебные: `id`, `typeId`.

### Общие значения по умолчанию (если тип не переопределяет)

| Свойство | Значение |
|---|---|
| `x`, `y` | `24` |
| `order` | `1` |
| `visible` | `true` |
| `enabled` | `true` |
| `opacity` | `1` |
| `margin` | `0` |
| `tooltip` | `""` |
| `backgroundColor` | `#f4f4f4` |
| `color` | `#1a1a1a` |
| `borderColor` | `#6f6f6f` |
| `borderWidth` | `1` |
| `borderStyle` | `solid` |
| `borderRadius` | `0` |
| `fontSize` | `13` |
| `fontWeight` | `normal` |
| `textAlign` | `left` |
| `padding` | `0` |
| `flexGrow` | `0` |
| `flexShrink` | `1` |
| `alignSelf` | `auto` |
| `minWidth`, `minHeight`, `maxWidth`, `maxHeight` | `0` |
| `text`, `placeholder` | `""` |
| `readOnly` | `false` |
| `semanticRole`, `actionId` | `""` |

`maxWidth` / `maxHeight` = `0` означает «без ограничения».

## Стандартные значения по типам

Ниже — то, что задаёт тип при создании (поверх общих значений).

### `container`
- `name`: Контейнер  
- `width` × `height`: 280 × 160  
- `backgroundColor`: `#ececec`  
- `padding`: 8  

### `row`
- `name`: Строка  
- `width` × `height`: 300 × 52  
- `backgroundColor`: `#e8eef5`  
- `padding`: 4  

### `column`
- `name`: Столбец  
- `width` × `height`: 140 × 200  
- `backgroundColor`: `#eef5e8`  
- `padding`: 4  

### `divider`
- `name`: Разделитель  
- `width` × `height`: 280 × 10  
- `backgroundColor`: `#b0b0b0`  
- `borderWidth`: 0  
- `borderStyle`: `none`  

### `text_field`
- `name`: Поле текста  
- `width` × `height`: 240 × 40  
- `backgroundColor`: `#ffffff`  
- `borderRadius`: 4  
- `placeholder`: Введите текст  
- `textAlign`: `left`  

### `button`
- `name`: Кнопка  
- `width` × `height`: 140 × 40  
- `backgroundColor`: `#dfe8f5`  
- `borderRadius`: 6  
- `text`: Кнопка  
- `textAlign`: `center`  
- `fontWeight`: `bold`  

### `list`
- `name`: Список  
- `width` × `height`: 220 × 130  
- `backgroundColor`: `#ffffff`  

### `label`
- `name`: Метка  
- `width` × `height`: 180 × 36  
- `backgroundColor`: `transparent`  
- `borderStyle`: `none`  
- `borderWidth`: 0  
- `text`: Метка  

### `task_panel`
- `name`: Условие задания  
- `width` × `height`: 320 × 120  
- `padding`: 8  
- `text`: Условие  
- `semanticRole`: `task`  
- `minWidth`: 200  
- `minHeight`: 80  

### `code_editor`
- `name`: Редактор кода  
- `width` × `height`: 360 × 180  
- `backgroundColor`: `#1e1e1e`  
- `color`: `#d4d4d4`  
- `padding`: 8  
- `placeholder`: `# код`  
- `semanticRole`: `code`  
- `minWidth`: 240  
- `minHeight`: 120  
- `fontSize`: 12  

### `results_panel`
- `name`: Результаты проверки  
- `width` × `height`: 280 × 100  
- `padding`: 8  
- `text`: Результаты  
- `semanticRole`: `results`  

### `dialog_panel`
- `name`: Диалог  
- `width` × `height`: 280 × 160  
- `padding`: 8  
- `text`: Диалог  
- `semanticRole`: `dialog`  

### `hints_panel`
- `name`: Подсказки  
- `width` × `height`: 240 × 100  
- `padding`: 8  
- `text`: Подсказка  
- `semanticRole`: `hints`  
- `backgroundColor`: `#fff8e6`  

### `history_panel`
- `name`: История  
- `width` × `height`: 240 × 120  
- `padding`: 8  
- `text`: История  
- `semanticRole`: `history`  

### `steps_panel`
- `name`: Шаги  
- `width` × `height`: 220 × 140  
- `padding`: 8  
- `text`: Шаги  
- `semanticRole`: `steps`  

### `solution_panel`
- `name`: Решение  
- `width` × `height`: 280 × 120  
- `padding`: 8  
- `text`: Решение  
- `semanticRole`: `solution`  

### `bubble`
- `name`: Пузырь  
- `width` × `height`: 200 × 64  
- `backgroundColor`: `#e7f0ff`  
- `borderRadius`: 28  
- `text`: Сообщение  
- `textAlign`: `center`  
- `padding`: 8  

### `modal`
- `name`: Модальное окно  
- `width` × `height`: 300 × 180  
- `backgroundColor`: `#ffffff`  
- `borderRadius`: 10  
- `padding`: 12  
- `text`: Модальное окно  

### `tabs`
- `name`: Вкладки  
- `width` × `height`: 300 × 44  
- `backgroundColor`: `#f0f0f0`  
- `borderRadius`: 6  
- `text`: Вкладка 1 \| Вкладка 2  
- `textAlign`: `center`  

## Матрица разрешённых свойств

- **container / row / column** — база + вид + раскладка + лимиты  
- **divider** — база + цвет/толщина линии (без шрифтов и flex)  
- **text_field** — база + вид + text/placeholder/readOnly + лимиты  
- **button** — база + вид + text + actionId + semanticRole + лимиты  
- **list** — база + вид + лимиты  
- **label** — база + вид + text  
- **панели ассистента** (`task_panel`, `code_editor`, `results_panel`, `dialog_panel`, `hints_panel`, `history_panel`, `steps_panel`, `solution_panel`) — база + вид + раскладка + лимиты + text (у `code_editor` — ввод) + semanticRole  
- **bubble** — база + вид + text  
- **modal** — база + вид + раскладка + лимиты + text  
- **tabs** — база + вид + text  

Точный список ключей — в `allowedProps` у каждого типа в `catalog.ts`.

## Расширение

Сначала каталог редактора, потом база знаний и остальные модули.
