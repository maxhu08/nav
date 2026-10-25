export const it = {
  Export: "Esporta",
  "download config": "scarica configurazione",
  "copy to clipboard": "copia negli appunti",
  or: "oppure",
  "upload config": "carica configurazione",
  "Could not read file.": "Impossibile leggere il file.",
  "Could not export config.": "Impossibile esportare la configurazione.",
  "Paste here...": "Incolla qui...",
  "options ヽ(・ω・*)": "opzioni ヽ(・ω・*)",
  options: "opzioni",
  "options.language": "lingua",
  "options language": "lingua delle opzioni",
  "toggle options section": "mostra o nascondi la sezione opzioni",
  rules: "regole",
  "rules.urls.mode": "modalità regole URL",
  "Controls which URL rules list is enforced at runtime.":
    "Determina quale elenco di regole URL viene applicato durante l’esecuzione.",
  blacklist: "elenco di blocco",
  whitelist: "elenco di autorizzazione",
  "rules.urls.blacklist": "URL bloccati",
  See: "Vedi",
  "for syntax and examples, and": "per sintassi ed esempi, e",
  "for valid action names.": "per i nomi delle azioni validi.",
  "rules.urls.whitelist": "URL consentiti",
  "rules.forceNormalMode": "forza modalità normale",
  "Keeps nav in normal mode on page load by rejecting automatic focus into editable fields until you manually focus one.":
    "Mantiene nav in modalità normale al caricamento, impedendo il focus automatico sui campi modificabili finché non ne selezioni uno manualmente.",
  hotkeys: "scorciatoie",
  "hotkeys.mappings": "associazioni dei tasti",
  hints: "etichette",
  "hints.showCapitalizedLetters": "mostra lettere maiuscole",
  "Changes how hint labels are displayed. The required key presses stay lowercase.":
    "Modifica l’aspetto delle etichette. I tasti da premere restano minuscoli.",
  "hints.improveThumbnailMarkers": "migliora indicatori sulle miniature",
  "Makes hint markers much easier to see on thumbnail-like media targets by centering them and rendering a larger badge.":
    "Centra e ingrandisce le etichette su miniature e contenuti multimediali per renderle più visibili.",
  "hints.activationIndicator.enabled": "abilita indicatore di attivazione",
  "Shows a temporary activation ring after you open or focus something through hints.":
    "Mostra un anello temporaneo dopo aver aperto o selezionato un elemento tramite etichette.",
  "hints.activationIndicator.color": "colore indicatore di attivazione",
  "hints.charset": "caratteri delle etichette",
  "Controls which letters are used to generate hint labels. Letters earlier in the charset are prioritized first.":
    "Definisce le lettere usate per generare le etichette. Le prime lettere hanno la precedenza.",
  "This applies to generated (non-reserved) hint labels. Reserved directive labels can still be typed even if they use letters outside this charset.":
    "Si applica alle etichette generate non riservate. Le etichette delle direttive riservate restano utilizzabili anche con altre lettere.",
  "Use letters only, with no spaces and no duplicates. Any repeated character, whitespace, or non-letter is treated as an error.":
    "Usa solo lettere, senza spazi o duplicati. Caratteri ripetuti, spazi e caratteri non alfabetici sono errori.",
  "hints.minLabelLength": "lunghezza minima delle etichette",
  "Sets the minimum number of characters generated hint labels must use.":
    "Imposta il numero minimo di caratteri delle etichette generate.",
  "hints.avoidAdjacentPairs": "evita coppie adiacenti",
  "Lists consecutive character pairs to avoid inside generated hint labels. It is recommended to put hard-to-press character pairs here.":
    "Coppie di caratteri consecutivi da evitare nelle etichette generate. Inserisci combinazioni difficili da digitare.",
  "Separate pairs with spaces or newlines. Entries must be exactly two letters, and `#` starts a comment anywhere on the line.":
    "Separa le coppie con spazi o nuove righe. Ogni voce deve avere due lettere; `#` inizia un commento in qualsiasi punto della riga.",
  "hints.directives": "direttive delle etichette",
  "Sets preferred hint directives for special elements.":
    "Imposta le direttive preferite per gli elementi speciali.",
  "for valid directive names.": "per i nomi delle direttive validi.",
  "Matching directive hints show their directive icon next to the hint label.":
    "Le etichette corrispondenti a una direttiva mostrano la relativa icona accanto al testo.",
  "Each directive must be on its own line, with exactly one space after `@element` and between labels.":
    "Ogni direttiva deve occupare una riga, con un solo spazio dopo `@element` e tra le etichette.",
  "hints.advanced.customSelectors": "selettori personalizzati",
  "Adds site-specific selector overrides for hint generation.":
    "Aggiunge selettori specifici per sito alla generazione delle etichette.",
  "for syntax and examples.": "per sintassi ed esempi.",
  "Use `* <regex-pattern> {` to start a site block, then one selector per line as `<key> <css-selector>`, and close the block with `}`.":
    "Inizia un blocco di sito con `* <regex-pattern> {`, inserisci un selettore per riga come `<key> <css-selector>` e chiudi con `}`.",
  "`<key>` must be letters only and at least as long as `hints.minLabelLength`, or exactly `<auto>` to generate a label automatically.":
    "`<key>` deve contenere solo lettere e rispettare `hints.minLabelLength`, oppure essere `<auto>` per generare automaticamente un’etichetta.",
  "hints.styling": "stile delle etichette",
  "Use the built-in hint marker look, or switch to editable CSS for full control.":
    "Usa lo stile integrato o modifica il CSS per un controllo completo.",
  default: "predefinito",
  custom: "personalizzato",
  "hints.customCSS": "CSS personalizzato delle etichette",
  bar: "barra",
  "bar.color": "colore della barra",
  "bar.width": "larghezza della barra",
  "bar.textSize": "dimensione del testo della barra",
  "find.width": "larghezza della barra di ricerca",
  "find.textSize": "dimensione del testo della barra di ricerca",
  "bar width": "larghezza della barra",
  "bar text size": "dimensione del testo della barra",
  "find width": "larghezza della barra di ricerca",
  "find text size": "dimensione del testo della barra di ricerca",
  "bar.tabsColor": "colore della barra di ricerca delle schede",
  "bar tabs color": "colore della barra di ricerca delle schede",
  "Sets the outline color of the tab search bar.":
    "Imposta il colore del bordo della barra di ricerca delle schede.",
  "Sets the outline color of the bar prompt UI.":
    "Imposta il colore del bordo della barra di inserimento.",
  "bar.searchEngineURL": "URL del motore di ricerca",
  "Used when bar input is treated as a search instead of a URL.":
    "Usato quando il testo nella barra viene interpretato come ricerca anziché come URL.",
  "Use `{}` to represent the search query.": "Usa `{}` per rappresentare la ricerca.",
  "Example: `https://www.google.com/search?q={}`.":
    "Esempio: `https://www.google.com/search?q={}`.",
  "bar.search.suggestions": "suggerimenti di ricerca",
  "Shows live query suggestions as you type.":
    "Mostra suggerimenti di ricerca durante la digitazione.",
  "Suggestions are sourced from DuckDuckGo's public autocomplete suggestions API and are not based on your personal search history. Requests are sent directly from your browser to DuckDuckGo and do not include cookies, accounts, extension identifiers, or other personal data.":
    "I suggerimenti provengono dall’API pubblica di completamento automatico di DuckDuckGo e non dalla cronologia personale. Le richieste sono inviate direttamente dal browser a DuckDuckGo senza cookie, account, identificativi dell’estensione o altri dati personali.",
  "bar.search.history": "cronologia di ricerca",
  "Shows matches from your local browser history for past searches and visited links.":
    "Mostra ricerche e collegamenti visitati corrispondenti nella cronologia locale del browser.",
  "History lookups stay on-device and are not sent to us or any third party.":
    "Le ricerche nella cronologia restano sul dispositivo e non sono inviate a noi o a terzi.",
  "bar.search.bookmarks": "cerca nei segnalibri",
  "bar.search.tabs": "cerca schede aperte",
  "bar search tabs": "cerca schede nella barra",
  "Shows matching open tabs in the bar. Selecting a tab switches to it instead of opening a duplicate. Tab lookups stay on-device.":
    "Mostra nella barra le schede aperte corrispondenti. Selezionare una scheda passa a quella esistente invece di aprirne un duplicato. La ricerca resta sul dispositivo.",
  "Shows matches from a configurable bookmark list that you manage locally.":
    "Mostra risultati da un elenco di segnalibri configurabile e gestito localmente.",
  "bar.search.bookmarks.storage": "elenco dei segnalibri",
  'Use one bookmark per line in the format `"bookmark name": "value"`.':
    'Inserisci un segnalibro per riga nel formato `"bookmark name": "value"`.',
  "import bookmarks": "importa segnalibri",
  "export all": "esporta tutti",
  "import all (replace)": "importa tutti (sostituisci)",
  find: "trova",
  "find.color": "colore della ricerca",
  "Sets the outline color for the find bar and the next/prev widget.":
    "Imposta il colore del bordo della barra di ricerca e dei controlli successivo/precedente.",
  save: "salva",
  "save & export": "salva ed esporta",
  "import & save": "importa e salva",
  danger: "zona di pericolo",
  "reset to default": "ripristina predefiniti",
  "Made with ❤️ by Max Hu et al.": "Creato con ❤️ da Max Hu e altri.",
  "Join the": "Unisciti a",
  "nav logo": "logo di nav",
  "toggle rules section": "espandi o comprimi le regole",
  "rules urls mode blacklist": "modalità URL bloccati",
  "rules urls mode whitelist": "modalità URL consentiti",
  "rules urls blacklist": "URL bloccati",
  "rules urls whitelist": "URL consentiti",
  "rules force normal mode": "forza modalità normale",
  "toggle hotkeys section": "espandi o comprimi le scorciatoie",
  "hotkeys mappings": "associazioni dei tasti",
  "toggle hints section": "espandi o comprimi le etichette",
  "hints show capitalized letters": "mostra etichette maiuscole",
  "hints improve thumbnail markers": "migliora indicatori sulle miniature",
  "hints show activation indicator": "mostra indicatore di attivazione",
  "hints show activation indicator color": "colore indicatore di attivazione",
  "hints charset": "caratteri delle etichette",
  "hints min label length": "lunghezza minima delle etichette",
  "hints avoid adjacent pairs": "evita coppie adiacenti",
  "hints directives": "direttive delle etichette",
  "hints advanced custom selectors": "selettori personalizzati delle etichette",
  "hints styling default": "stile predefinito delle etichette",
  "hints styling custom": "stile personalizzato delle etichette",
  "hints custom css": "CSS personalizzato delle etichette",
  "toggle bar section": "espandi o comprimi la barra",
  "bar color": "colore della barra",
  "bar search engine url": "URL del motore di ricerca della barra",
  "bar search suggestions": "suggerimenti di ricerca della barra",
  "bar search history": "cronologia di ricerca della barra",
  "bar search bookmarks": "ricerca segnalibri nella barra",
  "bar search bookmarks storage": "elenco segnalibri della barra",
  "toggle find section": "espandi o comprimi la ricerca",
  "find color": "colore della ricerca",
  "save options": "salva opzioni",
  "save and export options": "salva ed esporta opzioni",
  "import and save options": "importa e salva opzioni",
  "reset options to default": "ripristina opzioni predefinite",
  "Include site": "Includi sito",
  "Exclude site": "Escludi sito",
  "This will be added to {path}.": "Verrà aggiunto a {path}.",
  add: "aggiungi",
  cancel: "annulla",
  ok: "OK",
  confirm: "conferma",
  reset: "ripristina",
  "Save (Ctrl+S)": "Salva (ctrl+s)",
  "Save & export (Ctrl+E)": "Salva ed esporta (ctrl+e)",
  "Import & save (Ctrl+I)": "Importa e salva (ctrl+i)",
  "Choose color for {field}": "Scegli colore per {field}",
  "Contains one or more invalid entries.": "Contiene una o più voci non valide.",
  "Contains errors.": "Contiene errori.",
  "No errors detected.": "Nessun errore rilevato.",
  "{path} has unresolved errors; aborting save.":
    "{path} contiene errori irrisolti, salvataggio annullato.",
  "Changes saved.": "Modifiche salvate.",
  "Input your save. This will overwrite your current config.":
    "Incolla il tuo salvataggio. Questo sovrascriverà la configurazione attuale.",
  "Input was empty, nothing imported.": "Input vuoto, nessun dato importato.",
  "Invalid save format, expected NAV_SAVE_FORMAT_v#.#.#_.":
    "Formato errato, previsto NAV_SAVE_FORMAT_v#.#.#_.",
  "Incorrect save format.": "Formato di salvataggio non valido.",
  "Invalid config data.": "Dati di configurazione non validi.",
  "Config saved & copied to clipboard.": "Configurazione salvata e copiata negli appunti.",
  "Could not save config to clipboard.": "Impossibile copiare la configurazione negli appunti.",
  "Do you want to reset your options to default? This cannot be undone.":
    "Ripristinare le opzioni predefinite? Questa operazione è irreversibile.",
  "Options reset to default.": "Opzioni predefinite ripristinate.",
  "You selected no, options did not reset.": "Annullato, le opzioni non sono state ripristinate.",
  "Incorrect format, expected NAV_BOOKMARKS_FORMAT_v#.#.#_ or MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_.":
    "Formato errato, previsto NAV_BOOKMARKS_FORMAT_v#.#.#_ o MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_.",
  "1 bookmark imported.": "1 segnalibro importato.",
  "{count} bookmarks imported.": "{count} segnalibri importati.",
  "1 bookmark copied to clipboard.": "1 segnalibro copiato negli appunti.",
  "{count} bookmarks copied to clipboard.": "{count} segnalibri copiati negli appunti.",
  "Could not copy bookmarks to clipboard.": "Impossibile copiare i segnalibri negli appunti.",
  "Input your bookmarks to import.": "Inserisci i segnalibri da importare.",
  "Input your bookmarks to import. This will overwrite your current bookmarks.":
    "Inserisci i segnalibri. Questa operazione sovrascriverà quelli attuali.",
  'Accepts NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} and MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...]. MTAB folders are flattened.':
    'Accetta NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} e MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...]. Le cartelle MTAB vengono convertite in un elenco semplice.',
  Notifications: "Notifiche",
  action: "azione",
  "line {line}: {message}": "riga {line}: {message}",
  'Invalid action "{action}".': 'Azione non valida "{action}".',
  "Expected at least one action name.": "È richiesto almeno un nome di azione.",
  'Invalid rule prefix "{prefix}".': 'Prefisso di regola non valido "{prefix}".',
  "Regex pattern cannot be empty.": "L’espressione regolare non può essere vuota.",
  'Invalid regex pattern "{pattern}".': 'Espressione regolare non valida "{pattern}".',
  'Operator "{prefix}" must follow a "*" pattern line.':
    'L’operatore "{prefix}" deve seguire una riga di modello "*".',
  "position {position}: Spaces are not allowed in hints.charset.":
    "posizione {position}: Non sono ammessi spazi in hints.charset.",
  'position {position}: "{char}" is not a letter a-z.':
    'posizione {position}: "{char}" non è una lettera a-z.',
  'position {position}: "{char}" is duplicated.': 'posizione {position}: "{char}" è duplicato.',
  "hints.charset must contain at least 2 unique letters.":
    "hints.charset deve contenere almeno 2 lettere diverse.",
  "Remove leading or trailing spaces.": "Rimuovi gli spazi iniziali o finali.",
  'Expected format "@element label1 label2 label3" with single spaces.':
    'Formato previsto "@element label1 label2 label3" con spazi singoli.',
  'Unknown directive "@{directive}". See docs#directive-names for valid directives.':
    'Direttiva sconosciuta "@{directive}". Vedi docs#directive-names per le direttive valide.',
  'Duplicate "@{directive}" directive.': 'Direttiva "@{directive}" duplicata.',
  'Label "{label}" must contain only letters a-z, or be exactly "<unbound>".':
    'L’etichetta "{label}" deve contenere solo lettere a-z o essere esattamente "<unbound>".',
  'Label "{label}" must be exactly one character longer than the previous label.':
    'L’etichetta "{label}" deve avere esattamente un carattere in più della precedente.',
  'Label "{label}" is duplicated.': 'L’etichetta "{label}" è duplicata.',
  'Missing "@{directive}" directive. Use "@{directive} <unbound>" if it should stay unbound.':
    'Direttiva "@{directive}" mancante. Usa "@{directive} <unbound>" per lasciarla senza associazione.',
  'Expected "* <regex-pattern> {".': 'Previsto "* <regex-pattern> {".',
  "Unexpected closing brace.": "Parentesi graffa di chiusura inattesa.",
  "Missing closing brace for this block.": "Manca la parentesi graffa di chiusura del blocco.",
  "Add at least one selector entry to this block.": "Aggiungi almeno un selettore a questo blocco.",
  'Expected "<key> <css-selector>".': 'Previsto "<key> <css-selector>".',
  'Key must be letters only and at least as long as hints.minLabelLength, or exactly "<auto>".':
    'La chiave deve contenere solo lettere, rispettare hints.minLabelLength o essere esattamente "<auto>".',
  'Duplicate custom selector key "{key}" in the same block.':
    'Chiave di selettore personalizzato "{key}" duplicata nello stesso blocco.',
  'Invalid CSS selector "{selector}".': 'Selettore CSS non valido "{selector}".',
  'line {line}: "{pair}" must be exactly 2 letters (a-z).':
    'riga {line}: "{pair}" deve contenere esattamente 2 lettere (a-z).',
  'line {line}: "{pair}" is duplicated.': 'riga {line}: "{pair}" è duplicato.',
  'line {line}: Expected format "bookmark name": "value".':
    'riga {line}: Formato previsto "bookmark name": "value".',
  "Missing whitespace separator between key sequence and action name.":
    "Manca uno spazio tra la sequenza di tasti e il nome dell’azione.",
  "Missing key sequence before the action name.":
    "Manca la sequenza di tasti prima del nome dell’azione.",
  "Missing action name after the key sequence.":
    "Manca il nome dell’azione dopo la sequenza di tasti.",
  'Unknown action name. Received "{action}".': 'Nome di azione sconosciuto: "{action}".',
  'Sequence is already used by another action in the same mode. Mode "{mode}" already has a binding for "{sequence}".':
    'La sequenza è già usata da un’altra azione nella stessa modalità. La modalità "{mode}" ha già un’associazione per "{sequence}".',
  'Every action must be declared at least once. Declare "{action}" or set it to "<unbound>".':
    'Ogni azione deve essere dichiarata almeno una volta. Dichiara "{action}" o impostala su "<unbound>".'
} as const;