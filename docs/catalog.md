# Каталог компонентов и свойств

Контракт редактора и смежных подсистем. Типы и связи задаёт редактор.  
Источник в коде: `client/src/model/catalog.ts`, `client/src/model/types.ts`.

## Типы компонентов

| id | Название | Превью |
|---|---|---|
| `image` | Изображение | rect |
| `sound` | Звук | rect |
| `text` | Текст | rect |
| `divider` | Разделитель | rect |
| `spacer` | Пустое пространство | rect |
| `menu` | Меню | rect |
| `menu_bar` | Строка меню | rect |
| `list` | Список | rect |
| `scroll` | Панель прокрутки | rect |
| `window` | Окно | rect |
| `text_field` | Однострочное поле | rounded |
| `text_area` | Многострочное поле | rounded |
| `slider` | Ползунок | rect |
| `select` | Выбор | rounded |
| `button` | Кнопка | rounded |
| `menu_item` | Пункт меню | rect |

У `image` и `sound` поле `text` — идентификатор ресурса в модели.

## Виды связей

| id | Назначение |
|---|---|
| `contains` | вложение (родитель → потомок) |

## Свойства

У всех типов один набор ключей.

| Ключ | Смысл |
|---|---|
| `name` | имя |
| `x`, `y` | положение |
| `width`, `height` | размер |
| `order` | порядок слоя |
| `visible` | видимость |
| `enabled` | доступность |
| `opacity` | прозрачность (0…1) |
| `text` | текст или id ресурса |
| `tooltip` | подсказка |
| `actionId` | действие |
| `backgroundColor` | цвет фона |
| `color` | цвет текста |
| `borderColor` | цвет рамки |
| `borderWidth` | толщина рамки |
| `borderStyle` | стиль рамки: `solid` \| `dashed` \| `none` |
| `fontSize` | размер шрифта |
| `fontWeight` | начертание: `normal` \| `bold` |
| `textAlign` | выравнивание: `left` \| `center` \| `right` |
| `padding` | внутренний отступ |
| `margin` | внешний отступ |
| `minWidth`, `minHeight` | минимальный размер |
| `maxWidth`, `maxHeight` | максимальный размер; `0` — без ограничения |

Служебные поля компонента: `id`, `typeId`.

### Значения по умолчанию

| Свойство | Значение |
|---|---|
| `x`, `y` | `24` |
| `order` | `1` |
| `visible` | `true` |
| `enabled` | `true` |
| `opacity` | `1` |
| `text`, `tooltip`, `actionId` | `""` |
| `backgroundColor` | `#f4f4f4` |
| `color` | `#1a1a1a` |
| `borderColor` | `#6f6f6f` |
| `borderWidth` | `1` |
| `borderStyle` | `solid` |
| `fontSize` | `13` |
| `fontWeight` | `normal` |
| `textAlign` | `left` |
| `padding`, `margin` | `0` |
| `minWidth`, `minHeight`, `maxWidth`, `maxHeight` | `0` |

Размеры и переопределения по типу — в `defaults` у `catalog.ts`.

## Расширение

Сначала каталог редактора, потом база знаний и остальные модули.
