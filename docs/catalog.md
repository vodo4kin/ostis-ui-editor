# Каталог компонентов и свойств

Типы и связи задаёт редактор. Код: `client/src/model/catalog.ts`, `client/src/model/types.ts`.

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

У `image` и `sound` поле `text` — id ресурса.

## Связи

| id | Назначение |
|---|---|
| `contains` | вложение, родитель → потомок |

## Свойства

Одинаковый набор ключей у всех типов.

| Ключ | Смысл |
|---|---|
| `name` | имя |
| `x`, `y` | положение |
| `width`, `height` | размер |
| `order` | порядок слоя |
| `visible` | видимость |
| `enabled` | доступность |
| `opacity` | прозрачность, 0…1 |
| `text` | текст или id ресурса |
| `tooltip` | подсказка |
| `actionId` | действие |
| `backgroundColor` | цвет фона |
| `color` | цвет текста |
| `borderColor` | цвет рамки |
| `borderWidth` | толщина рамки |
| `borderStyle` | `solid` / `dashed` / `none` |
| `fontSize` | размер шрифта |
| `fontWeight` | `normal` / `bold` |
| `textAlign` | `left` / `center` / `right` |
| `padding` | внутренний отступ |
| `margin` | внешний отступ |
| `minWidth`, `minHeight` | минимальный размер |
| `maxWidth`, `maxHeight` | максимум; `0` — без ограничения |

Служебные поля: `id`, `typeId`.

## Имена в SC

| Ключ | Класс |
|---|---|
| `name` | `concept_ui_name` |
| `x` | `concept_ui_x` |
| `y` | `concept_ui_y` |
| `width` | `concept_ui_width` |
| `height` | `concept_ui_height` |
| `order` | `concept_ui_order` |
| `visible` | `concept_ui_visible` |
| `enabled` | `concept_ui_enabled` |
| `opacity` | `concept_ui_opacity` |
| `text` | `concept_ui_text_value` |
| `tooltip` | `concept_ui_tooltip` |
| `actionId` | `concept_ui_action_id` |
| `backgroundColor` | `concept_ui_background_color` |
| `color` | `concept_ui_color` |
| `borderColor` | `concept_ui_border_color` |
| `borderWidth` | `concept_ui_border_width` |
| `borderStyle` | `concept_ui_border_style` |
| `fontSize` | `concept_ui_font_size` |
| `fontWeight` | `concept_ui_font_weight` |
| `textAlign` | `concept_ui_text_align` |
| `padding` | `concept_ui_padding` |
| `margin` | `concept_ui_margin` |
| `minWidth` | `concept_ui_min_width` |
| `minHeight` | `concept_ui_min_height` |
| `maxWidth` | `concept_ui_max_width` |
| `maxHeight` | `concept_ui_max_height` |

Отношения: `nrel_ui_contains`, `nrel_ui_id`, `nrel_ui_value`, `nrel_inclusion`.

## Значения по умолчанию

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

Размеры по типу — в `defaults` в `catalog.ts`.

Новый тип или свойство сначала в каталоге редактора, потом в SC и у остальных.
