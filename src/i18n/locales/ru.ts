export const ru = {
  Export: "Экспорт",
  "download config": "скачать конфигурацию",
  "copy to clipboard": "скопировать в буфер обмена",
  or: "или",
  "upload config": "загрузить конфигурацию",
  "Could not read file.": "Не удалось прочитать файл.",
  "Could not export config.": "Не удалось экспортировать конфигурацию.",
  "Paste here...": "Вставьте сюда...",
  "options ヽ(・ω・*)": "настройки ヽ(・ω・*)",
  options: "настройки",
  "options.language": "язык",
  "options language": "язык настроек",
  "toggle options section": "свернуть или развернуть раздел настроек",
  rules: "правила",
  "rules.urls.mode": "режим правил URL",
  "Controls which URL rules list is enforced at runtime.":
    "Определяет, какой список правил URL применяется при работе расширения.",
  blacklist: "список блокировки",
  whitelist: "список разрешений",
  "rules.urls.blacklist": "заблокированные URL",
  See: "См.",
  "for syntax and examples, and": "для синтаксиса и примеров и",
  "for valid action names.": "для допустимых названий действий.",
  "rules.urls.whitelist": "разрешённые URL",
  "rules.forceNormalMode": "принудительный обычный режим",
  "Keeps nav in normal mode on page load by rejecting automatic focus into editable fields until you manually focus one.":
    "Сохраняет обычный режим nav при загрузке страницы, запрещая автоматический фокус в полях ввода, пока вы не выберете поле вручную.",
  hotkeys: "горячие клавиши",
  "hotkeys.mappings": "назначения клавиш",
  hints: "подсказки",
  "hints.showCapitalizedLetters": "показывать заглавные буквы",
  "Changes how hint labels are displayed. The required key presses stay lowercase.":
    "Меняет отображение меток подсказок. Вводить по-прежнему нужно строчные буквы.",
  "hints.improveThumbnailMarkers": "улучшить метки на миниатюрах",
  "Makes hint markers much easier to see on thumbnail-like media targets by centering them and rendering a larger badge.":
    "Располагает метки по центру миниатюр и увеличивает их для лучшей видимости.",
  "hints.activationIndicator.enabled": "включить индикатор активации",
  "Shows a temporary activation ring after you open or focus something through hints.":
    "Ненадолго показывает кольцо после открытия элемента или установки фокуса через подсказки.",
  "hints.activationIndicator.color": "цвет индикатора активации",
  "hints.charset": "набор букв подсказок",
  "Controls which letters are used to generate hint labels. Letters earlier in the charset are prioritized first.":
    "Задаёт буквы для создания меток подсказок. Буквы в начале списка имеют приоритет.",
  "This applies to generated (non-reserved) hint labels. Reserved directive labels can still be typed even if they use letters outside this charset.":
    "Применяется к создаваемым незарезервированным меткам. Зарезервированные метки директив можно вводить, даже если их буквы отсутствуют в этом наборе.",
  "Use letters only, with no spaces and no duplicates. Any repeated character, whitespace, or non-letter is treated as an error.":
    "Используйте только буквы без пробелов и повторений. Повторяющиеся символы, пробелы и другие знаки считаются ошибкой.",
  "hints.minLabelLength": "минимальная длина метки",
  "Sets the minimum number of characters generated hint labels must use.":
    "Задаёт минимальное число символов в создаваемых метках подсказок.",
  "hints.avoidAdjacentPairs": "исключить соседние пары",
  "Lists consecutive character pairs to avoid inside generated hint labels. It is recommended to put hard-to-press character pairs here.":
    "Пары последовательных букв, которых следует избегать в метках. Рекомендуется указать сочетания, которые трудно нажимать подряд.",
  "Separate pairs with spaces or newlines. Entries must be exactly two letters, and `#` starts a comment anywhere on the line.":
    "Разделяйте пары пробелами или переносами строк. В каждой паре должно быть две буквы; `#` начинает комментарий в любом месте строки.",
  "hints.directives": "директивы подсказок",
  "Sets preferred hint directives for special elements.":
    "Задаёт предпочтительные директивы подсказок для особых элементов.",
  "for valid directive names.": "для допустимых названий директив.",
  "Matching directive hints show their directive icon next to the hint label.":
    "Подсказки подходящих директив показывают значок директивы рядом с меткой.",
  "Each directive must be on its own line, with exactly one space after `@element` and between labels.":
    "Каждая директива должна занимать отдельную строку с одним пробелом после `@element` и между метками.",
  "hints.advanced.customSelectors": "пользовательские селекторы",
  "Adds site-specific selector overrides for hint generation.":
    "Добавляет селекторы для создания подсказок на отдельных сайтах.",
  "for syntax and examples.": "для синтаксиса и примеров.",
  "Use `* <regex-pattern> {` to start a site block, then one selector per line as `<key> <css-selector>`, and close the block with `}`.":
    "Начните блок сайта с `* <regex-pattern> {`, добавьте по одному селектору на строку в формате `<key> <css-selector>` и закройте блок символом `}`.",
  "`<key>` must be letters only and at least as long as `hints.minLabelLength`, or exactly `<auto>` to generate a label automatically.":
    "`<key>` должен содержать только буквы и иметь длину не меньше `hints.minLabelLength`; используйте `<auto>` для автоматического создания метки.",
  "hints.styling": "оформление подсказок",
  "Use the built-in hint marker look, or switch to editable CSS for full control.":
    "Используйте встроенное оформление меток или редактируйте CSS для полного контроля.",
  default: "по умолчанию",
  custom: "своё",
  "hints.customCSS": "пользовательский CSS подсказок",
  bar: "строка ввода",
  "bar.color": "цвет строки ввода",
  "Sets the outline color of the bar prompt UI.": "Задаёт цвет рамки строки ввода.",
  "bar.searchEngineURL": "URL поисковой системы",
  "Used when bar input is treated as a search instead of a URL.":
    "Используется, когда текст в строке распознаётся как поисковый запрос, а не URL.",
  "Use `{}` to represent the search query.": "Используйте `{}` для обозначения поискового запроса.",
  "Example: `https://www.google.com/search?q={}`.": "Пример: `https://www.google.com/search?q={}`.",
  "bar.search.suggestions": "поисковые предложения",
  "Shows live query suggestions as you type.": "Показывает поисковые предложения во время ввода.",
  "Suggestions are sourced from DuckDuckGo's public autocomplete suggestions API and are not based on your personal search history. Requests are sent directly from your browser to DuckDuckGo and do not include cookies, accounts, extension identifiers, or other personal data.":
    "Предложения поступают из общедоступного API автодополнения DuckDuckGo и не основаны на вашей истории поиска. Запросы отправляются браузером напрямую в DuckDuckGo без файлов cookie, учётных записей, идентификаторов расширения и других личных данных.",
  "bar.search.history": "история поиска",
  "Shows matches from your local browser history for past searches and visited links.":
    "Показывает совпадения из локальной истории поиска и посещённых страниц браузера.",
  "History lookups stay on-device and are not sent to us or any third party.":
    "Поиск по истории выполняется на устройстве и не передаётся нам или третьим лицам.",
  "bar.search.bookmarks": "поиск по закладкам",
  "bar.search.tabs": "поиск открытых вкладок",
  "bar search tabs": "поиск вкладок в строке",
  "Shows matching open tabs in the bar. Selecting a tab switches to it instead of opening a duplicate. Tab lookups stay on-device.":
    "Показывает подходящие открытые вкладки в строке. Выбор вкладки переключает на неё, а не открывает копию. Поиск выполняется на устройстве.",
  "Shows matches from a configurable bookmark list that you manage locally.":
    "Показывает совпадения из настраиваемого списка закладок, хранящегося локально.",
  "bar.search.bookmarks.storage": "список закладок",
  'Use one bookmark per line in the format `"bookmark name": "value"`.':
    'Укажите по одной закладке на строку в формате `"bookmark name": "value"`.',
  "import bookmarks": "импортировать закладки",
  "export all": "экспортировать всё",
  "import all (replace)": "импортировать всё (заменить)",
  find: "поиск на странице",
  "find.color": "цвет поиска",
  "Sets the outline color for the find bar and the next/prev widget.":
    "Задаёт цвет рамки строки поиска и кнопок следующего/предыдущего совпадения.",
  save: "сохранить",
  "save & export": "сохранить и экспортировать",
  "import & save": "импортировать и сохранить",
  danger: "опасная зона",
  "reset to default": "сбросить по умолчанию",
  "Made with ❤️ by Max Hu et al.": "Сделано с ❤️ Максом Ху и другими.",
  "Join the": "Присоединяйтесь к",
  "nav logo": "логотип nav",
  "toggle rules section": "свернуть или развернуть правила",
  "rules urls mode blacklist": "режим блокировки URL",
  "rules urls mode whitelist": "режим разрешения URL",
  "rules urls blacklist": "заблокированные URL",
  "rules urls whitelist": "разрешённые URL",
  "rules force normal mode": "принудительный обычный режим",
  "toggle hotkeys section": "свернуть или развернуть горячие клавиши",
  "hotkeys mappings": "назначения клавиш",
  "toggle hints section": "свернуть или развернуть подсказки",
  "hints show capitalized letters": "показывать метки заглавными буквами",
  "hints improve thumbnail markers": "улучшить метки на миниатюрах",
  "hints show activation indicator": "показывать индикатор активации",
  "hints show activation indicator color": "цвет индикатора активации",
  "hints charset": "набор букв подсказок",
  "hints min label length": "минимальная длина метки",
  "hints avoid adjacent pairs": "исключить соседние пары",
  "hints directives": "директивы подсказок",
  "hints advanced custom selectors": "пользовательские селекторы подсказок",
  "hints styling default": "стандартное оформление подсказок",
  "hints styling custom": "своё оформление подсказок",
  "hints custom css": "пользовательский CSS подсказок",
  "toggle bar section": "свернуть или развернуть строку ввода",
  "bar color": "цвет строки ввода",
  "bar search engine url": "URL поисковой системы строки ввода",
  "bar search suggestions": "предложения поиска в строке ввода",
  "bar search history": "история поиска строки ввода",
  "bar search bookmarks": "поиск закладок в строке ввода",
  "bar search bookmarks storage": "список закладок строки ввода",
  "toggle find section": "свернуть или развернуть поиск",
  "find color": "цвет поиска",
  "save options": "сохранить настройки",
  "save and export options": "сохранить и экспортировать настройки",
  "import and save options": "импортировать и сохранить настройки",
  "reset options to default": "сбросить настройки по умолчанию",
  "Include site": "Включить сайт",
  "Exclude site": "Исключить сайт",
  "This will be added to {path}.": "Будет добавлено в {path}.",
  add: "добавить",
  cancel: "отмена",
  ok: "ОК",
  confirm: "подтвердить",
  reset: "сбросить",
  "Save (Ctrl+S)": "Сохранить (ctrl+s)",
  "Save & export (Ctrl+E)": "Сохранить и экспортировать (ctrl+e)",
  "Import & save (Ctrl+I)": "Импортировать и сохранить (ctrl+i)",
  "Choose color for {field}": "Выбрать цвет для {field}",
  "Contains one or more invalid entries.": "Содержит одну или несколько недопустимых записей.",
  "Contains errors.": "Есть ошибки.",
  "No errors detected.": "Ошибок не обнаружено.",
  "{path} has unresolved errors; aborting save.":
    "В {path} есть неисправленные ошибки, сохранение отменено.",
  "Changes saved.": "Изменения сохранены.",
  "Input your save. This will overwrite your current config.":
    "Вставьте сохранение. Это перезапишет текущую конфигурацию.",
  "Input was empty, nothing imported.": "Ввод пуст, ничего не импортировано.",
  "Invalid save format, expected NAV_SAVE_FORMAT_v#.#.#_.":
    "Неверный формат сохранения, ожидается NAV_SAVE_FORMAT_v#.#.#_.",
  "Incorrect save format.": "Недопустимый формат сохранения.",
  "Invalid config data.": "Недопустимые данные конфигурации.",
  "Config saved & copied to clipboard.": "Конфигурация сохранена и скопирована в буфер обмена.",
  "Could not save config to clipboard.": "Не удалось скопировать конфигурацию в буфер обмена.",
  "Do you want to reset your options to default? This cannot be undone.":
    "Сбросить настройки по умолчанию? Это действие нельзя отменить.",
  "Options reset to default.": "Настройки сброшены по умолчанию.",
  "You selected no, options did not reset.": "Отменено, настройки не сброшены.",
  "Incorrect format, expected NAV_BOOKMARKS_FORMAT_v#.#.#_ or MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_.":
    "Неверный формат сохранения, ожидается NAV_BOOKMARKS_FORMAT_v#.#.#_ или MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_.",
  "1 bookmark imported.": "Импортирована 1 закладка.",
  "{count} bookmarks imported.": "Импортировано закладок: {count}.",
  "1 bookmark copied to clipboard.": "1 закладка скопирована в буфер обмена.",
  "{count} bookmarks copied to clipboard.": "Закладок скопировано в буфер обмена: {count}.",
  "Could not copy bookmarks to clipboard.": "Не удалось скопировать закладки в буфер обмена.",
  "Input your bookmarks to import.": "Введите закладки для импорта.",
  "Input your bookmarks to import. This will overwrite your current bookmarks.":
    "Введите закладки. Текущие закладки будут заменены.",
  'Accepts NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} and MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...]. MTAB folders are flattened.':
    'Поддерживаются NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} и MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...]. Папки MTAB преобразуются в плоский список.',
  Notifications: "Уведомления",
  action: "действие",
  "line {line}: {message}": "строка {line}: {message}",
  'Invalid action "{action}".': "Недопустимое действие «{action}».",
  "Expected at least one action name.": "Требуется хотя бы одно название действия.",
  'Invalid rule prefix "{prefix}".': "Недопустимый префикс правила «{prefix}».",
  "Regex pattern cannot be empty.": "Регулярное выражение не может быть пустым.",
  'Invalid regex pattern "{pattern}".': "Недопустимое регулярное выражение «{pattern}».",
  'Operator "{prefix}" must follow a "*" pattern line.':
    "Оператор «{prefix}» должен следовать за строкой шаблона «*».",
  "position {position}: Spaces are not allowed in hints.charset.":
    "позиция {position}: В hints.charset нельзя использовать пробелы.",
  'position {position}: "{char}" is not a letter a-z.':
    "позиция {position}: «{char}» не является буквой a-z.",
  'position {position}: "{char}" is duplicated.': "позиция {position}: «{char}» повторяется.",
  "hints.charset must contain at least 2 unique letters.":
    "hints.charset должен содержать не менее 2 разных букв.",
  "Remove leading or trailing spaces.": "Удалите пробелы в начале или конце строки.",
  'Expected format "@element label1 label2 label3" with single spaces.':
    "Ожидается формат «@element label1 label2 label3» с одиночными пробелами.",
  'Unknown directive "@{directive}". See docs#directive-names for valid directives.':
    "Неизвестная директива «@{directive}». Допустимые директивы см. в docs#directive-names.",
  'Duplicate "@{directive}" directive.': "Повторная директива «@{directive}».",
  'Label "{label}" must contain only letters a-z, or be exactly "<unbound>".':
    "Метка «{label}» должна содержать только буквы a-z или быть равна «<unbound>».",
  'Label "{label}" must be exactly one character longer than the previous label.':
    "Метка «{label}» должна быть ровно на один символ длиннее предыдущей.",
  'Label "{label}" is duplicated.': "Метка «{label}» повторяется.",
  'Missing "@{directive}" directive. Use "@{directive} <unbound>" if it should stay unbound.':
    "Отсутствует директива «@{directive}». Используйте «@{directive} <unbound>», чтобы оставить её без назначения.",
  'Expected "* <regex-pattern> {".': "Ожидается «* <regex-pattern> {».",
  "Unexpected closing brace.": "Неожиданная закрывающая фигурная скобка.",
  "Missing closing brace for this block.": "У блока отсутствует закрывающая фигурная скобка.",
  "Add at least one selector entry to this block.": "Добавьте хотя бы один селектор в этот блок.",
  'Expected "<key> <css-selector>".': "Ожидается «<key> <css-selector>».",
  'Key must be letters only and at least as long as hints.minLabelLength, or exactly "<auto>".':
    "Ключ должен содержать только буквы и иметь длину не меньше hints.minLabelLength или быть равен «<auto>».",
  'Duplicate custom selector key "{key}" in the same block.':
    "Повторный ключ селектора «{key}» в одном блоке.",
  'Invalid CSS selector "{selector}".': "Недопустимый CSS-селектор «{selector}».",
  'line {line}: "{pair}" must be exactly 2 letters (a-z).':
    "строка {line}: «{pair}» должен содержать ровно 2 буквы (a-z).",
  'line {line}: "{pair}" is duplicated.': "строка {line}: «{pair}» повторяется.",
  'line {line}: Expected format "bookmark name": "value".':
    "строка {line}: Ожидается формат «bookmark name»: «value».",
  "Missing whitespace separator between key sequence and action name.":
    "Отсутствует пробел между последовательностью клавиш и названием действия.",
  "Missing key sequence before the action name.":
    "Отсутствует последовательность клавиш перед названием действия.",
  "Missing action name after the key sequence.":
    "Отсутствует название действия после последовательности клавиш.",
  'Unknown action name. Received "{action}".': "Неизвестное название действия: «{action}».",
  'Sequence is already used by another action in the same mode. Mode "{mode}" already has a binding for "{sequence}".':
    "Последовательность уже используется другим действием в том же режиме. В режиме «{mode}» уже есть назначение для «{sequence}».",
  'Every action must be declared at least once. Declare "{action}" or set it to "<unbound>".':
    "Каждое действие нужно объявить хотя бы один раз. Объявите «{action}» или назначьте ему «<unbound>»."
} as const;