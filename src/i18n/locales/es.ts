export const es = {
  "expand editor": "ampliar editor",
  "close editor": "cerrar editor",
  "bar.styling": "Estilo de la barra",
  "bar.customCSS": "CSS personalizado de la barra",
  "find.styling": "Estilo de búsqueda",
  "find.customCSS": "CSS personalizado de búsqueda",
  "bar styling default": "Estilo predeterminado de la barra",
  "bar styling custom": "Estilo personalizado de la barra",
  "bar custom css": "CSS personalizado de la barra",
  "find styling default": "Estilo de búsqueda predeterminado",
  "find styling custom": "Estilo de búsqueda personalizado",
  "find custom css": "CSS personalizado de búsqueda",
  "Edit [data-nav-hint-marker] to change hint colors, fonts, and spacing.":
    "Edita [data-nav-hint-marker] para cambiar los colores, fuentes y espaciado de las etiquetas.",
  "Use :scope for the bar, #nav-find-input for its input, and .nav-find-suggestion for suggestions.":
    "Usa :scope para la barra, #nav-find-input para su campo de entrada y .nav-find-suggestion para las sugerencias.",
  "Use :scope for the find bar and widget, and --nav-find-match-background for match colors.":
    "Usa :scope para la barra de búsqueda y su control, y --nav-find-match-background para los colores de las coincidencias.",
  Export: "Exportar",
  "download config": "descargar configuración",
  "copy to clipboard": "copiar al portapapeles",
  or: "o",
  "upload config": "subir configuración",
  "Could not read file.": "No se pudo leer el archivo.",
  "Could not export config.": "No se pudo exportar la configuración.",
  "Paste here...": "Pega aquí...",
  "options ヽ(・ω・*)": "opciones ヽ(・ω・*)",
  options: "opciones",
  "options.language": "idioma",
  "options language": "idioma de las opciones",
  "toggle options section": "Mostrar u ocultar sección de configuración",
  rules: "reglas",
  "rules.urls.mode": "modo de reglas de URL",
  "Controls which URL rules list is enforced at runtime.":
    "Controla qué lista de reglas de URL se aplica durante la ejecución.",
  blacklist: "lista de bloqueo",
  whitelist: "lista de permitidos",
  "rules.urls.blacklist": "lista de URL bloqueadas",
  See: "Consulta",
  "for syntax and examples, and": "para ver la sintaxis y ejemplos, y",
  "for valid action names.": "para ver los nombres de acciones válidos.",
  "rules.urls.whitelist": "lista de URL permitidas",
  "rules.forceNormalMode": "forzar modo normal",
  "Keeps nav in normal mode on page load by rejecting automatic focus into editable fields until you manually focus one.":
    "Mantiene nav en modo normal al cargar la página e impide el enfoque automático en campos editables hasta que enfoques uno manualmente.",
  hotkeys: "atajos",
  "hotkeys.mappings": "asignaciones de teclas",
  hints: "etiquetas",
  "hints.showCapitalizedLetters": "mostrar letras mayúsculas",
  "Changes how hint labels are displayed. The required key presses stay lowercase.":
    "Cambia la apariencia de las etiquetas. Las teclas necesarias siguen siendo minúsculas.",
  "hints.improveThumbnailMarkers": "mejorar marcadores de miniaturas",
  "Makes hint markers much easier to see on thumbnail-like media targets by centering them and rendering a larger badge.":
    "Centra y amplía las etiquetas en miniaturas y otros elementos multimedia para que se vean mejor.",
  "hints.activationIndicator.enabled": "activar indicador de activación",
  "Shows a temporary activation ring after you open or focus something through hints.":
    "Muestra un anillo temporal tras abrir o enfocar un elemento mediante etiquetas.",
  "hints.activationIndicator.color": "color del indicador de activación",
  "hints.charset": "caracteres de las etiquetas",
  "Controls which letters are used to generate hint labels. Letters earlier in the charset are prioritized first.":
    "Controla las letras usadas para generar etiquetas. Las primeras letras tienen prioridad.",
  "This applies to generated (non-reserved) hint labels. Reserved directive labels can still be typed even if they use letters outside this charset.":
    "Se aplica a las etiquetas generadas, no reservadas. Las etiquetas de directivas reservadas se pueden escribir aunque usen otras letras.",
  "Use letters only, with no spaces and no duplicates. Any repeated character, whitespace, or non-letter is treated as an error.":
    "Usa solo letras, sin espacios ni duplicados. Los caracteres repetidos, espacios y otros símbolos se consideran errores.",
  "hints.minLabelLength": "longitud mínima de etiqueta",
  "Sets the minimum number of characters generated hint labels must use.":
    "Establece el número mínimo de caracteres de las etiquetas generadas.",
  "hints.avoidAdjacentPairs": "evitar pares adyacentes",
  "Lists consecutive character pairs to avoid inside generated hint labels. It is recommended to put hard-to-press character pairs here.":
    "Pares de caracteres consecutivos que se evitarán al generar etiquetas. Se recomienda incluir combinaciones difíciles de pulsar.",
  "Separate pairs with spaces or newlines. Entries must be exactly two letters, and `#` starts a comment anywhere on the line.":
    "Separa los pares con espacios o saltos de línea. Cada entrada debe tener dos letras; `#` inicia un comentario en cualquier punto de la línea.",
  "hints.directives": "directivas de etiquetas",
  "Sets preferred hint directives for special elements.":
    "Establece las directivas preferidas para elementos especiales.",
  "for valid directive names.": "para ver los nombres de directivas válidos.",
  "Matching directive hints show their directive icon next to the hint label.":
    "Las etiquetas que coinciden con una directiva muestran su icono junto a la etiqueta.",
  "Each directive must be on its own line, with exactly one space after `@element` and between labels.":
    "Cada directiva debe ocupar una línea, con un solo espacio después de `@element` y entre etiquetas.",
  "hints.advanced.customSelectors": "selectores personalizados",
  "Adds site-specific selector overrides for hint generation.":
    "Añade selectores específicos por sitio para generar etiquetas.",
  "for syntax and examples.": "para ver la sintaxis y ejemplos.",
  "Use `* <regex-pattern> {` to start a site block, then one selector per line as `<key> <css-selector>`, and close the block with `}`.":
    "Inicia un bloque de sitio con `* <regex-pattern> {`, añade un selector por línea como `<key> <css-selector>` y cierra el bloque con `}`.",
  "`<key>` must be letters only and at least as long as `hints.minLabelLength`, or exactly `<auto>` to generate a label automatically.":
    "`<key>` debe contener solo letras y tener al menos la longitud de `hints.minLabelLength`, o ser `<auto>` para generar una etiqueta automáticamente.",
  "hints.styling": "estilo de etiquetas",
  "Use the built-in hint marker look, or switch to editable CSS for full control.":
    "Usa el estilo integrado o edita el CSS para tener control total.",
  default: "predeterminado",
  custom: "personalizado",
  "hints.customCSS": "CSS personalizado de etiquetas",
  bar: "barra",
  "bar.color": "color de la barra",
  "bar.width": "ancho de la barra",
  "bar.textSize": "tamaño de letra de la barra",
  "find.width": "ancho de la barra de búsqueda",
  "find.textSize": "tamaño de letra de la barra de búsqueda",
  "bar width": "ancho de la barra",
  "bar text size": "tamaño de letra de la barra",
  "find width": "ancho de la barra de búsqueda",
  "find text size": "tamaño de letra de la barra de búsqueda",
  "bar.tabsColor": "color de la barra de búsqueda de pestañas",
  "bar tabs color": "color de la barra de búsqueda de pestañas",
  "Sets the outline color of the tab search bar.":
    "Establece el color del borde de la barra de búsqueda de pestañas.",
  "Sets the outline color of the bar prompt UI.":
    "Establece el color del borde de la barra de entrada.",
  "bar.searchEngineURL": "URL del buscador",
  "Used when bar input is treated as a search instead of a URL.":
    "Se usa cuando la entrada de la barra se interpreta como una búsqueda y no como una URL.",
  "Use `{}` to represent the search query.": "Usa `{}` para representar la consulta de búsqueda.",
  "Example: `https://www.google.com/search?q={}`.":
    "Ejemplo: `https://www.google.com/search?q={}`.",
  "bar.search.suggestions": "sugerencias de búsqueda",
  "Shows live query suggestions as you type.": "Muestra sugerencias de búsqueda mientras escribes.",
  "Suggestions are sourced from DuckDuckGo's public autocomplete suggestions API and are not based on your personal search history. Requests are sent directly from your browser to DuckDuckGo and do not include cookies, accounts, extension identifiers, or other personal data.":
    "Las sugerencias proceden de la API pública de autocompletado de DuckDuckGo, no de tu historial personal. Las solicitudes se envían directamente desde tu navegador a DuckDuckGo sin cookies, cuentas, identificadores de la extensión ni otros datos personales.",
  "bar.search.history": "historial de búsqueda",
  "Shows matches from your local browser history for past searches and visited links.":
    "Muestra coincidencias de búsquedas y enlaces visitados en el historial local del navegador.",
  "History lookups stay on-device and are not sent to us or any third party.":
    "Las consultas del historial permanecen en tu dispositivo y no se envían a nosotros ni a terceros.",
  "bar.search.bookmarks": "buscar en marcadores",
  "bar.search.tabs": "buscar pestañas abiertas",
  "bar search tabs": "buscar pestañas en la barra",
  "Shows matching open tabs in the bar. Selecting a tab switches to it instead of opening a duplicate. Tab lookups stay on-device.":
    "Muestra pestañas abiertas coincidentes en la barra. Seleccionar una pestaña cambia a ella en lugar de abrir un duplicado. La búsqueda permanece en el dispositivo.",
  "Shows matches from a configurable bookmark list that you manage locally.":
    "Muestra coincidencias de una lista configurable de marcadores que administras localmente.",
  "bar.search.bookmarks.storage": "lista de marcadores",
  'Use one bookmark per line in the format `"bookmark name": "value"`.':
    'Usa un marcador por línea con el formato `"bookmark name": "value"`.',
  "import bookmarks": "importar marcadores",
  "export all": "exportar todos",
  "import all (replace)": "importar todos (reemplazar)",
  find: "buscar",
  "find.color": "color de búsqueda",
  "Sets the outline color for the find bar and the next/prev widget.":
    "Establece el color del borde de la barra de búsqueda y del control siguiente/anterior.",
  save: "guardar",
  "save & export": "guardar y exportar",
  "import & save": "importar y guardar",
  danger: "zona de peligro",
  "reset to default": "restablecer valores predeterminados",
  "Made with ❤️ by Max Hu et al.": "Hecho con ❤️ por Max Hu y otros.",
  "Join the": "Únete a",
  "nav logo": "logotipo de nav",
  "toggle rules section": "expandir o contraer reglas",
  "rules urls mode blacklist": "modo de URL bloqueadas",
  "rules urls mode whitelist": "modo de URL permitidas",
  "rules urls blacklist": "URL bloqueadas",
  "rules urls whitelist": "URL permitidas",
  "rules force normal mode": "forzar modo normal",
  "toggle hotkeys section": "expandir o contraer atajos",
  "hotkeys mappings": "asignaciones de teclas",
  "toggle hints section": "expandir o contraer etiquetas",
  "hints show capitalized letters": "mostrar etiquetas en mayúsculas",
  "hints improve thumbnail markers": "mejorar marcadores de miniaturas",
  "hints show activation indicator": "mostrar indicador de activación",
  "hints show activation indicator color": "color del indicador de activación",
  "hints charset": "caracteres de las etiquetas",
  "hints min label length": "longitud mínima de etiqueta",
  "hints avoid adjacent pairs": "evitar pares adyacentes",
  "hints directives": "directivas de etiquetas",
  "hints advanced custom selectors": "selectores personalizados de etiquetas",
  "hints styling default": "estilo predeterminado de etiquetas",
  "hints styling custom": "estilo personalizado de etiquetas",
  "hints custom css": "CSS personalizado de etiquetas",
  "toggle bar section": "expandir o contraer barra",
  "bar color": "color de la barra",
  "bar search engine url": "URL del buscador de la barra",
  "bar search suggestions": "sugerencias de búsqueda de la barra",
  "bar search history": "historial de búsqueda de la barra",
  "bar search bookmarks": "buscar marcadores en la barra",
  "bar search bookmarks storage": "lista de marcadores de la barra",
  "toggle find section": "expandir o contraer búsqueda",
  "find color": "color de búsqueda",
  "save options": "guardar opciones",
  "save and export options": "guardar y exportar opciones",
  "import and save options": "importar y guardar opciones",
  "reset options to default": "restablecer opciones predeterminadas",
  "Include site": "Incluir sitio",
  "Exclude site": "Excluir sitio",
  "This will be added to {path}.": "Se añadirá a {path}.",
  add: "añadir",
  cancel: "cancelar",
  ok: "aceptar",
  confirm: "confirmar",
  reset: "restablecer",
  "Save (Ctrl+S)": "Guardar (ctrl+s)",
  "Save & export (Ctrl+E)": "Guardar y exportar (ctrl+e)",
  "Import & save (Ctrl+I)": "Importar y guardar (ctrl+i)",
  "Choose color for {field}": "Elegir color para {field}",
  "Contains one or more invalid entries.": "Contiene una o más entradas no válidas.",
  "Contains errors.": "Contiene errores.",
  "No errors detected.": "No se detectaron errores.",
  "{path} has unresolved errors; aborting save.":
    "{path} tiene errores sin resolver; se cancela el guardado.",
  "Changes saved.": "Cambios guardados.",
  "Input your save. This will overwrite your current config.":
    "Pega tu configuración guardada. Esto sobrescribirá tu configuración actual.",
  "Input was empty, nothing imported.": "La entrada estaba vacía; no se importó nada.",
  "Invalid save format, expected NAV_SAVE_FORMAT_v#.#.#_.":
    "Formato incorrecto; se esperaba NAV_SAVE_FORMAT_v#.#.#_.",
  "Incorrect save format.": "Formato de guardado no válido.",
  "Invalid config data.": "Datos de configuración no válidos.",
  "Config saved & copied to clipboard.": "Configuración guardada y copiada al portapapeles.",
  "Could not save config to clipboard.": "No se pudo guardar la configuración en el portapapeles.",
  "Do you want to reset your options to default? This cannot be undone.":
    "¿Restablecer las opciones predeterminadas? Esta acción no se puede deshacer.",
  "Options reset to default.": "Opciones restablecidas.",
  "You selected no, options did not reset.": "Cancelado; no se restablecieron las opciones.",
  "Incorrect format, expected NAV_BOOKMARKS_FORMAT_v#.#.#_ or MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_.":
    "Formato incorrecto; se esperaba NAV_BOOKMARKS_FORMAT_v#.#.#_ o MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_.",
  "1 bookmark imported.": "1 marcador importado.",
  "{count} bookmarks imported.": "{count} marcadores importados.",
  "1 bookmark copied to clipboard.": "1 marcador copiado al portapapeles.",
  "{count} bookmarks copied to clipboard.": "{count} marcadores copiados al portapapeles.",
  "Could not copy bookmarks to clipboard.": "No se pudieron copiar los marcadores al portapapeles.",
  "Input your bookmarks to import.": "Introduce los marcadores que quieres importar.",
  "Input your bookmarks to import. This will overwrite your current bookmarks.":
    "Introduce los marcadores. Esto sobrescribirá tus marcadores actuales.",
  'Accepts NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} and MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...]. MTAB folders are flattened.':
    'Acepta NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} y MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...]. Las carpetas de MTAB se convierten en una lista plana.',
  Notifications: "Notificaciones",
  action: "acción",
  "line {line}: {message}": "línea {line}: {message}",
  'Invalid action "{action}".': 'Acción no válida "{action}".',
  "Expected at least one action name.": "Se esperaba al menos un nombre de acción.",
  'Invalid rule prefix "{prefix}".': 'Prefijo de regla no válido "{prefix}".',
  "Regex pattern cannot be empty.": "El patrón de expresión regular no puede estar vacío.",
  'Invalid regex pattern "{pattern}".': 'Patrón de expresión regular no válido "{pattern}".',
  'Operator "{prefix}" must follow a "*" pattern line.':
    'El operador "{prefix}" debe seguir a una línea de patrón "*".',
  "position {position}: Spaces are not allowed in hints.charset.":
    "posición {position}: No se permiten espacios en hints.charset.",
  'position {position}: "{char}" is not a letter a-z.':
    'posición {position}: "{char}" no es una letra a-z.',
  'position {position}: "{char}" is duplicated.': 'posición {position}: "{char}" está duplicado.',
  "hints.charset must contain at least 2 unique letters.":
    "hints.charset debe contener al menos 2 letras distintas.",
  "Remove leading or trailing spaces.": "Elimina los espacios al principio o al final.",
  'Expected format "@element label1 label2 label3" with single spaces.':
    'Se esperaba el formato "@element label1 label2 label3" con espacios simples.',
  'Unknown directive "@{directive}". See docs#directive-names for valid directives.':
    'Directiva desconocida "@{directive}". Consulta docs#directive-names para ver las directivas válidas.',
  'Duplicate "@{directive}" directive.': 'Directiva "@{directive}" duplicada.',
  'Label "{label}" must contain only letters a-z, or be exactly "<unbound>".':
    'La etiqueta "{label}" debe contener solo letras a-z o ser exactamente "<unbound>".',
  'Label "{label}" must be exactly one character longer than the previous label.':
    'La etiqueta "{label}" debe tener exactamente un carácter más que la anterior.',
  'Label "{label}" is duplicated.': 'La etiqueta "{label}" está duplicada.',
  'Missing "@{directive}" directive. Use "@{directive} <unbound>" if it should stay unbound.':
    'Falta la directiva "@{directive}". Usa "@{directive} <unbound>" si debe quedar sin asignar.',
  'Expected "* <regex-pattern> {".': 'Se esperaba "* <regex-pattern> {".',
  "Unexpected closing brace.": "Llave de cierre inesperada.",
  "Missing closing brace for this block.": "Falta la llave de cierre de este bloque.",
  "Add at least one selector entry to this block.": "Añade al menos un selector a este bloque.",
  'Expected "<key> <css-selector>".': 'Se esperaba "<key> <css-selector>".',
  'Key must be letters only and at least as long as hints.minLabelLength, or exactly "<auto>".':
    'La clave debe contener solo letras y tener al menos la longitud de hints.minLabelLength, o ser exactamente "<auto>".',
  'Duplicate custom selector key "{key}" in the same block.':
    'Clave de selector personalizado "{key}" duplicada en el mismo bloque.',
  'Invalid CSS selector "{selector}".': 'Selector CSS no válido "{selector}".',
  'line {line}: "{pair}" must be exactly 2 letters (a-z).':
    'línea {line}: "{pair}" debe tener exactamente 2 letras (a-z).',
  'line {line}: "{pair}" is duplicated.': 'línea {line}: "{pair}" está duplicado.',
  'line {line}: Expected format "bookmark name": "value".':
    'línea {line}: Se esperaba el formato "bookmark name": "value".',
  "Missing whitespace separator between key sequence and action name.":
    "Falta un espacio entre la secuencia de teclas y el nombre de la acción.",
  "Missing key sequence before the action name.":
    "Falta la secuencia de teclas antes del nombre de la acción.",
  "Missing action name after the key sequence.":
    "Falta el nombre de la acción después de la secuencia de teclas.",
  'Unknown action name. Received "{action}".': 'Nombre de acción desconocido: "{action}".',
  'Sequence is already used by another action in the same mode. Mode "{mode}" already has a binding for "{sequence}".':
    'Otra acción ya usa esta secuencia en el mismo modo. El modo "{mode}" ya tiene una asignación para "{sequence}".',
  'Every action must be declared at least once. Declare "{action}" or set it to "<unbound>".':
    'Cada acción debe declararse al menos una vez. Declara "{action}" o asígnale "<unbound>".'
} as const;