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

У `image` и `sound` поле `text_value` — id ресурса.

## Связи

| id | Назначение |
|---|---|
| `contains` | вложение: интерфейс → корни, компонент → потомок |

В SC отдельно: `nrel_ui_has_component` — интерфейс → все его компоненты.  
В редакторе это список `components`, не вид связи на холсте.

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
| `text_value` | текст или id ресурса |
| `tooltip` | подсказка |
| `action_id` | действие |
| `background_color` | цвет фона |
| `color` | цвет текста |
| `border_color` | цвет рамки |
| `border_width` | толщина рамки |
| `border_style` | `solid` / `dashed` / `none` |
| `corner_radius` | скругление углов |
| `font_size` | размер шрифта |
| `font_weight` | `normal` / `bold` |
| `text_align` | `left` / `center` / `right` |
| `padding` | внутренний отступ |
| `margin` | внешний отступ |
| `min_width`, `min_height` | минимальный размер |
| `max_width`, `max_height` | максимум; `0` — без ограничения |

Служебные поля: `id`, `typeId`.

## Имена в SC

| Что | SC |
|---|---|
| интерфейс | `concept_ui_interface` |
| корень типов компонентов | `concept_ui_object` |
| `components` | `nrel_ui_has_component` |
| `contains` | `nrel_ui_contains` |
| id | `nrel_ui_id` |
| значение свойства | `nrel_ui_value` |
| включение типа в `concept_ui_object` | `nrel_inclusion` |

### Типы компонентов

| id | Класс |
|---|---|
| `image` | `concept_ui_image` |
| `sound` | `concept_ui_sound` |
| `text` | `concept_ui_text` |
| `divider` | `concept_ui_divider` |
| `spacer` | `concept_ui_spacer` |
| `menu` | `concept_ui_menu` |
| `menu_bar` | `concept_ui_menu_bar` |
| `list` | `concept_ui_list` |
| `scroll` | `concept_ui_scroll` |
| `window` | `concept_ui_window` |
| `text_field` | `concept_ui_text_field` |
| `text_area` | `concept_ui_text_area` |
| `slider` | `concept_ui_slider` |
| `select` | `concept_ui_select` |
| `button` | `concept_ui_button` |
| `menu_item` | `concept_ui_menu_item` |

### Свойства

Класс: `concept_ui_<ключ>`.

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
| `text_value` | `concept_ui_text_value` |
| `tooltip` | `concept_ui_tooltip` |
| `action_id` | `concept_ui_action_id` |
| `background_color` | `concept_ui_background_color` |
| `color` | `concept_ui_color` |
| `border_color` | `concept_ui_border_color` |
| `border_width` | `concept_ui_border_width` |
| `border_style` | `concept_ui_border_style` |
| `corner_radius` | `concept_ui_corner_radius` |
| `font_size` | `concept_ui_font_size` |
| `font_weight` | `concept_ui_font_weight` |
| `text_align` | `concept_ui_text_align` |
| `padding` | `concept_ui_padding` |
| `margin` | `concept_ui_margin` |
| `min_width` | `concept_ui_min_width` |
| `min_height` | `concept_ui_min_height` |
| `max_width` | `concept_ui_max_width` |
| `max_height` | `concept_ui_max_height` |

## Значения по умолчанию

| Свойство | Значение |
|---|---|
| `x`, `y` | `24` |
| `order` | `1` |
| `visible` | `true` |
| `enabled` | `true` |
| `opacity` | `1` |
| `text_value`, `tooltip`, `action_id` | `""` |
| `background_color` | `#f4f4f4` |
| `color` | `#1a1a1a` |
| `border_color` | `#6f6f6f` |
| `border_width` | `1` |
| `border_style` | `solid` |
| `corner_radius` | `0` |
| `font_size` | `13` |
| `font_weight` | `normal` |
| `text_align` | `left` |
| `padding`, `margin` | `0` |
| `min_width`, `min_height`, `max_width`, `max_height` | `0` |

Размеры по типу — в `defaults` в `catalog.ts`.

Новый тип, свойство или отношение сначала в каталоге редактора, потом в SC и у остальных.
