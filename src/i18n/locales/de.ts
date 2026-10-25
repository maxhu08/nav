export const de = {
  Export: "Exportieren",
  "download config": "Konfiguration herunterladen",
  "copy to clipboard": "In die Zwischenablage kopieren",
  or: "oder",
  "upload config": "Konfiguration hochladen",
  "Could not read file.": "Datei konnte nicht gelesen werden.",
  "Could not export config.": "Konfiguration konnte nicht exportiert werden.",
  "Paste here...": "Hier einfügen...",
  "options ヽ(・ω・*)": "Einstellungen ヽ(・ω・*)",
  options: "Einstellungen",
  "options.language": "Sprache",
  "options language": "Sprache der Einstellungen",
  "toggle options section": "Einstellungsbereich ein-/ausklappen",
  rules: "Regeln",
  "rules.urls.mode": "URL-Regelmodus",
  "Controls which URL rules list is enforced at runtime.":
    "Bestimmt, welche URL-Regelliste zur Laufzeit angewendet wird.",
  blacklist: "Sperrliste",
  whitelist: "Zulassungsliste",
  "rules.urls.blacklist": "URL-Sperrliste",
  See: "Siehe",
  "for syntax and examples, and": "für Syntax und Beispiele sowie",
  "for valid action names.": "für gültige Aktionsnamen.",
  "rules.urls.whitelist": "URL-Zulassungsliste",
  "rules.forceNormalMode": "Normalmodus erzwingen",
  "Keeps nav in normal mode on page load by rejecting automatic focus into editable fields until you manually focus one.":
    "Hält nav beim Laden im Normalmodus und verhindert automatischen Fokus auf Eingabefelder, bis du eines manuell fokussierst.",
  hotkeys: "Tastenkürzel",
  "hotkeys.mappings": "Tastenbelegungen",
  hints: "Hinweise",
  "hints.showCapitalizedLetters": "Großbuchstaben anzeigen",
  "Changes how hint labels are displayed. The required key presses stay lowercase.":
    "Ändert die Darstellung der Hinweislabels. Die einzugebenden Buchstaben bleiben klein.",
  "hints.improveThumbnailMarkers": "Vorschaubild-Markierungen verbessern",
  "Makes hint markers much easier to see on thumbnail-like media targets by centering them and rendering a larger badge.":
    "Zentriert Hinweislabels auf Medienvorschauen und vergrößert sie für bessere Sichtbarkeit.",
  "hints.activationIndicator.enabled": "Aktivierungsanzeige aktivieren",
  "Shows a temporary activation ring after you open or focus something through hints.":
    "Zeigt kurz einen Ring an, nachdem du über Hinweise etwas öffnest oder fokussierst.",
  "hints.activationIndicator.color": "Farbe der Aktivierungsanzeige",
  "hints.charset": "Hinweiszeichensatz",
  "Controls which letters are used to generate hint labels. Letters earlier in the charset are prioritized first.":
    "Legt die Buchstaben für generierte Hinweislabels fest. Frühere Buchstaben werden bevorzugt.",
  "This applies to generated (non-reserved) hint labels. Reserved directive labels can still be typed even if they use letters outside this charset.":
    "Gilt für generierte, nicht reservierte Labels. Reservierte Direktivenlabels bleiben auch mit anderen Buchstaben eingebbar.",
  "Use letters only, with no spaces and no duplicates. Any repeated character, whitespace, or non-letter is treated as an error.":
    "Nur Buchstaben, ohne Leerzeichen oder Wiederholungen. Wiederholte Zeichen, Leerraum und andere Zeichen gelten als Fehler.",
  "hints.minLabelLength": "Minimale Labellänge",
  "Sets the minimum number of characters generated hint labels must use.":
    "Legt die Mindestanzahl an Zeichen für generierte Hinweislabels fest.",
  "hints.avoidAdjacentPairs": "Benachbarte Zeichenpaare vermeiden",
  "Lists consecutive character pairs to avoid inside generated hint labels. It is recommended to put hard-to-press character pairs here.":
    "Zeichenpaare, die in generierten Labels vermieden werden. Trage hier schwer zu tippende Kombinationen ein.",
  "Separate pairs with spaces or newlines. Entries must be exactly two letters, and `#` starts a comment anywhere on the line.":
    "Paare durch Leerzeichen oder Zeilenumbrüche trennen. Jeder Eintrag muss genau zwei Buchstaben haben; `#` beginnt überall in der Zeile einen Kommentar.",
  "hints.directives": "Hinweisdirektiven",
  "Sets preferred hint directives for special elements.":
    "Legt bevorzugte Hinweisdirektiven für besondere Elemente fest.",
  "for valid directive names.": "für gültige Direktivennamen.",
  "Matching directive hints show their directive icon next to the hint label.":
    "Passende Direktivenhinweise zeigen ihr Symbol neben dem Label.",
  "Each directive must be on its own line, with exactly one space after `@element` and between labels.":
    "Jede Direktive steht in einer eigenen Zeile mit genau einem Leerzeichen nach `@element` und zwischen Labels.",
  "hints.advanced.customSelectors": "Eigene Selektoren",
  "Adds site-specific selector overrides for hint generation.":
    "Fügt seitenspezifische Selektorregeln für die Hinweiserzeugung hinzu.",
  "for syntax and examples.": "für Syntax und Beispiele.",
  "Use `* <regex-pattern> {` to start a site block, then one selector per line as `<key> <css-selector>`, and close the block with `}`.":
    "Beginne einen Seitenblock mit `* <regex-pattern> {`, füge je Zeile einen Selektor als `<key> <css-selector>` ein und schließe ihn mit `}`.",
  "`<key>` must be letters only and at least as long as `hints.minLabelLength`, or exactly `<auto>` to generate a label automatically.":
    "`<key>` darf nur Buchstaben enthalten und muss mindestens `hints.minLabelLength` lang sein; `<auto>` erzeugt automatisch ein Label.",
  "hints.styling": "Hinweisgestaltung",
  "Use the built-in hint marker look, or switch to editable CSS for full control.":
    "Nutze die integrierte Hinweisgestaltung oder bearbeite CSS für volle Kontrolle.",
  default: "Standard",
  custom: "Benutzerdefiniert",
  "hints.customCSS": "Eigenes Hinweis-CSS",
  bar: "Adressleiste",
  "bar.color": "Leistenfarbe",
  "Sets the outline color of the bar prompt UI.": "Legt die Rahmenfarbe der Eingabeleiste fest.",
  "bar.searchEngineURL": "Suchmaschinen-URL",
  "Used when bar input is treated as a search instead of a URL.":
    "Wird verwendet, wenn die Eingabe als Suche statt als URL erkannt wird.",
  "Use `{}` to represent the search query.": "Verwende `{}` als Platzhalter für die Suchanfrage.",
  "Example: `https://www.google.com/search?q={}`.":
    "Beispiel: `https://www.google.com/search?q={}`.",
  "bar.search.suggestions": "Suchvorschläge",
  "Shows live query suggestions as you type.": "Zeigt beim Tippen aktuelle Suchvorschläge.",
  "Suggestions are sourced from DuckDuckGo's public autocomplete suggestions API and are not based on your personal search history. Requests are sent directly from your browser to DuckDuckGo and do not include cookies, accounts, extension identifiers, or other personal data.":
    "Vorschläge stammen aus DuckDuckGos öffentlicher Autovervollständigungs-API, nicht aus deinem Suchverlauf. Anfragen gehen direkt vom Browser an DuckDuckGo und enthalten keine Cookies, Konten, Erweiterungskennungen oder andere persönliche Daten.",
  "bar.search.history": "Suchverlauf",
  "Shows matches from your local browser history for past searches and visited links.":
    "Zeigt passende frühere Suchanfragen und besuchte Links aus deinem lokalen Browserverlauf.",
  "History lookups stay on-device and are not sent to us or any third party.":
    "Verlaufsabfragen bleiben auf deinem Gerät und werden weder an uns noch an Dritte gesendet.",
  "bar.search.bookmarks": "Lesezeichensuche",
  "bar.search.tabs": "Offene Tabs durchsuchen",
  "bar search tabs": "Tabs in der Leiste durchsuchen",
  "Shows matching open tabs in the bar. Selecting a tab switches to it instead of opening a duplicate. Tab lookups stay on-device.":
    "Zeigt passende offene Tabs in der Leiste. Die Auswahl wechselt zum Tab, statt ihn erneut zu öffnen. Die Suche bleibt auf dem Gerät.",
  "Shows matches from a configurable bookmark list that you manage locally.":
    "Zeigt Treffer aus einer anpassbaren, lokal verwalteten Lesezeichenliste.",
  "bar.search.bookmarks.storage": "Lesezeichenliste",
  'Use one bookmark per line in the format `"bookmark name": "value"`.':
    'Ein Lesezeichen pro Zeile im Format `"bookmark name": "value"` eingeben.',
  "import bookmarks": "Lesezeichen importieren",
  "export all": "Alle exportieren",
  "import all (replace)": "Alle importieren (ersetzen)",
  find: "Suchen",
  "find.color": "Suchfarbe",
  "Sets the outline color for the find bar and the next/prev widget.":
    "Legt die Rahmenfarbe der Suchleiste und der Vor-/Zurück-Steuerung fest.",
  save: "Speichern",
  "save & export": "Speichern & exportieren",
  "import & save": "Importieren & speichern",
  danger: "Gefahrenbereich",
  "reset to default": "Auf Standard zurücksetzen",
  "Made with ❤️ by Max Hu et al.": "Mit ❤️ von Max Hu und anderen erstellt.",
  "Join the": "Tritt bei auf",
  "nav logo": "nav-Logo",
  "toggle rules section": "Regelbereich ein-/ausklappen",
  "rules urls mode blacklist": "URL-Sperrlistenmodus",
  "rules urls mode whitelist": "URL-Zulassungslistenmodus",
  "rules urls blacklist": "URL-Sperrliste",
  "rules urls whitelist": "URL-Zulassungsliste",
  "rules force normal mode": "Normalmodus erzwingen",
  "toggle hotkeys section": "Tastenkürzel ein-/ausklappen",
  "hotkeys mappings": "Tastenbelegungen",
  "toggle hints section": "Hinweisbereich ein-/ausklappen",
  "hints show capitalized letters": "Hinweislabels groß anzeigen",
  "hints improve thumbnail markers": "Vorschaubild-Markierungen verbessern",
  "hints show activation indicator": "Aktivierungsanzeige anzeigen",
  "hints show activation indicator color": "Farbe der Aktivierungsanzeige",
  "hints charset": "Hinweiszeichensatz",
  "hints min label length": "Minimale Hinweislänge",
  "hints avoid adjacent pairs": "Benachbarte Zeichenpaare vermeiden",
  "hints directives": "Hinweisdirektiven",
  "hints advanced custom selectors": "Eigene Hinweisselektoren",
  "hints styling default": "Standard-Hinweisgestaltung",
  "hints styling custom": "Eigene Hinweisgestaltung",
  "hints custom css": "Eigenes Hinweis-CSS",
  "toggle bar section": "Leistenbereich ein-/ausklappen",
  "bar color": "Leistenfarbe",
  "bar search engine url": "Suchmaschinen-URL der Leiste",
  "bar search suggestions": "Suchvorschläge der Leiste",
  "bar search history": "Suchverlauf der Leiste",
  "bar search bookmarks": "Lesezeichensuche der Leiste",
  "bar search bookmarks storage": "Lesezeichenliste der Leiste",
  "toggle find section": "Suchbereich ein-/ausklappen",
  "find color": "Suchfarbe",
  "save options": "Einstellungen speichern",
  "save and export options": "Einstellungen speichern und exportieren",
  "import and save options": "Einstellungen importieren und speichern",
  "reset options to default": "Einstellungen auf Standard zurücksetzen",
  "Include site": "Seite einschließen",
  "Exclude site": "Seite ausschließen",
  "This will be added to {path}.": "Wird zu {path} hinzugefügt.",
  add: "Hinzufügen",
  cancel: "Abbrechen",
  ok: "OK",
  confirm: "Bestätigen",
  reset: "Zurücksetzen",
  "Save (Ctrl+S)": "Speichern (Strg+S)",
  "Save & export (Ctrl+E)": "Speichern und exportieren (Strg+E)",
  "Import & save (Ctrl+I)": "Importieren und speichern (Strg+I)",
  "Choose color for {field}": "Farbe für {field} wählen",
  "Contains one or more invalid entries.": "Enthält mindestens einen ungültigen Eintrag.",
  "Contains errors.": "Enthält Fehler.",
  "No errors detected.": "Keine Fehler gefunden.",
  "{path} has unresolved errors; aborting save.":
    "{path} enthält ungelöste Fehler, Speichern abgebrochen.",
  "Changes saved.": "Änderungen gespeichert.",
  "Input your save. This will overwrite your current config.":
    "Speicherstand einfügen. Dies überschreibt deine aktuelle Konfiguration.",
  "Input was empty, nothing imported.": "Eingabe war leer, nichts importiert.",
  "Invalid save format, expected NAV_SAVE_FORMAT_v#.#.#_.":
    "Falsches Speicherformat, erwartet: NAV_SAVE_FORMAT_v#.#.#_.",
  "Incorrect save format.": "Ungültiges Speicherformat.",
  "Invalid config data.": "Ungültige Konfigurationsdaten.",
  "Config saved & copied to clipboard.":
    "Konfiguration gespeichert und in die Zwischenablage kopiert.",
  "Could not save config to clipboard.":
    "Konfiguration konnte nicht in die Zwischenablage kopiert werden.",
  "Do you want to reset your options to default? This cannot be undone.":
    "Einstellungen auf Standard zurücksetzen? Dies kann nicht rückgängig gemacht werden.",
  "Options reset to default.": "Einstellungen auf Standard zurückgesetzt.",
  "You selected no, options did not reset.": "Abgebrochen, Einstellungen nicht zurückgesetzt.",
  "Incorrect format, expected NAV_BOOKMARKS_FORMAT_v#.#.#_ or MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_.":
    "Falsches Speicherformat, erwartet: NAV_BOOKMARKS_FORMAT_v#.#.#_ oder MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_.",
  "1 bookmark imported.": "1 Lesezeichen importiert.",
  "{count} bookmarks imported.": "{count} Lesezeichen importiert.",
  "1 bookmark copied to clipboard.": "1 Lesezeichen in die Zwischenablage kopiert.",
  "{count} bookmarks copied to clipboard.": "{count} Lesezeichen in die Zwischenablage kopiert.",
  "Could not copy bookmarks to clipboard.":
    "Lesezeichen konnten nicht in die Zwischenablage kopiert werden.",
  "Input your bookmarks to import.": "Zu importierende Lesezeichen eingeben.",
  "Input your bookmarks to import. This will overwrite your current bookmarks.":
    "Lesezeichen eingeben. Dies überschreibt deine aktuellen Lesezeichen.",
  'Accepts NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} and MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...]. MTAB folders are flattened.':
    'Akzeptiert NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} und MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...]. MTAB-Ordner werden aufgelöst.',
  Notifications: "Benachrichtigungen",
  action: "Aktion",
  "line {line}: {message}": "Zeile {line}: {message}",
  'Invalid action "{action}".': 'Ungültige Aktion "{action}".',
  "Expected at least one action name.": "Mindestens ein Aktionsname erforderlich.",
  'Invalid rule prefix "{prefix}".': 'Ungültiges Regelpräfix "{prefix}".',
  "Regex pattern cannot be empty.": "Regex-Muster darf nicht leer sein.",
  'Invalid regex pattern "{pattern}".': 'Ungültiges Regex-Muster "{pattern}".',
  'Operator "{prefix}" must follow a "*" pattern line.':
    'Operator "{prefix}" muss auf eine Musterzeile mit "*" folgen.',
  "position {position}: Spaces are not allowed in hints.charset.":
    "Position {position}: Leerzeichen sind in hints.charset nicht erlaubt.",
  'position {position}: "{char}" is not a letter a-z.':
    'Position {position}: "{char}" ist kein Buchstabe a-z.',
  'position {position}: "{char}" is duplicated.':
    'Position {position}: "{char}" kommt mehrfach vor.',
  "hints.charset must contain at least 2 unique letters.":
    "hints.charset muss mindestens 2 verschiedene Buchstaben enthalten.",
  "Remove leading or trailing spaces.": "Führende oder nachgestellte Leerzeichen entfernen.",
  'Expected format "@element label1 label2 label3" with single spaces.':
    'Erwartetes Format: "@element label1 label2 label3" mit einzelnen Leerzeichen.',
  'Unknown directive "@{directive}". See docs#directive-names for valid directives.':
    'Unbekannte Direktive "@{directive}". Gültige Direktiven siehe docs#directive-names.',
  'Duplicate "@{directive}" directive.': 'Doppelte Direktive "@{directive}".',
  'Label "{label}" must contain only letters a-z, or be exactly "<unbound>".':
    'Label "{label}" darf nur Buchstaben a-z enthalten oder muss genau "<unbound>" sein.',
  'Label "{label}" must be exactly one character longer than the previous label.':
    'Label "{label}" muss genau ein Zeichen länger als das vorherige sein.',
  'Label "{label}" is duplicated.': 'Label "{label}" kommt mehrfach vor.',
  'Missing "@{directive}" directive. Use "@{directive} <unbound>" if it should stay unbound.':
    'Direktive "@{directive}" fehlt. Verwende "@{directive} <unbound>", wenn sie ungebunden bleiben soll.',
  'Expected "* <regex-pattern> {".': 'Erwartet: "* <regex-pattern> {".',
  "Unexpected closing brace.": "Unerwartete schließende Klammer.",
  "Missing closing brace for this block.": "Schließende Klammer für diesen Block fehlt.",
  "Add at least one selector entry to this block.":
    "Mindestens einen Selektor zu diesem Block hinzufügen.",
  'Expected "<key> <css-selector>".': 'Erwartet: "<key> <css-selector>".',
  'Key must be letters only and at least as long as hints.minLabelLength, or exactly "<auto>".':
    'Label darf nur Buchstaben enthalten und muss mindestens hints.minLabelLength lang oder genau "<auto>" sein.',
  'Duplicate custom selector key "{key}" in the same block.':
    'Doppeltes Selektorlabel "{key}" im selben Block.',
  'Invalid CSS selector "{selector}".': 'Ungültiger CSS-Selektor "{selector}".',
  'line {line}: "{pair}" must be exactly 2 letters (a-z).':
    'Zeile {line}: "{pair}" muss genau 2 Buchstaben (a-z) enthalten.',
  'line {line}: "{pair}" is duplicated.': 'Zeile {line}: "{pair}" kommt mehrfach vor.',
  'line {line}: Expected format "bookmark name": "value".':
    'Zeile {line}: Erwartetes Format "bookmark name": "value".',
  "Missing whitespace separator between key sequence and action name.":
    "Leerzeichen zwischen Tastenfolge und Aktionsname fehlt.",
  "Missing key sequence before the action name.": "Tastenfolge vor dem Aktionsnamen fehlt.",
  "Missing action name after the key sequence.": "Aktionsname nach der Tastenfolge fehlt.",
  'Unknown action name. Received "{action}".': 'Unbekannter Aktionsname: "{action}".',
  'Sequence is already used by another action in the same mode. Mode "{mode}" already has a binding for "{sequence}".':
    'Diese Tastenfolge wird im selben Modus bereits verwendet. Modus "{mode}" hat bereits eine Belegung für "{sequence}".',
  'Every action must be declared at least once. Declare "{action}" or set it to "<unbound>".':
    'Jede Aktion muss mindestens einmal deklariert werden. Deklariere "{action}" oder setze sie auf "<unbound>".'
} as const;