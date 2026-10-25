export const fr = {
  Export: "Exporter",
  "download config": "télécharger la configuration",
  "copy to clipboard": "copier dans le presse-papiers",
  or: "ou",
  "upload config": "importer une configuration",
  "Could not read file.": "Impossible de lire le fichier.",
  "Could not export config.": "Impossible d’exporter la configuration.",
  "Paste here...": "Collez ici...",
  "options ヽ(・ω・*)": "options ヽ(・ω・*)",
  options: "options",
  "options.language": "langue",
  "options language": "langue des options",
  "toggle options section": "afficher/masquer la section Paramètres",
  rules: "règles",
  "rules.urls.mode": "mode des règles URL",
  "Controls which URL rules list is enforced at runtime.":
    "Détermine quelle liste de règles URL est appliquée à l’exécution.",
  blacklist: "liste de blocage",
  whitelist: "liste d’autorisation",
  "rules.urls.blacklist": "URL bloquées",
  See: "Consultez",
  "for syntax and examples, and": "pour la syntaxe et des exemples, et",
  "for valid action names.": "pour les noms d’actions valides.",
  "rules.urls.whitelist": "URL autorisées",
  "rules.forceNormalMode": "forcer le mode normal",
  "Keeps nav in normal mode on page load by rejecting automatic focus into editable fields until you manually focus one.":
    "Maintient nav en mode normal au chargement en empêchant la sélection automatique des champs modifiables jusqu’à leur sélection manuelle.",
  hotkeys: "raccourcis",
  "hotkeys.mappings": "raccourcis clavier",
  hints: "repères",
  "hints.showCapitalizedLetters": "afficher en majuscules",
  "Changes how hint labels are displayed. The required key presses stay lowercase.":
    "Modifie l’affichage des repères. Les touches à saisir restent en minuscules.",
  "hints.improveThumbnailMarkers": "améliorer les repères des miniatures",
  "Makes hint markers much easier to see on thumbnail-like media targets by centering them and rendering a larger badge.":
    "Centre et agrandit les repères sur les miniatures et les médias pour les rendre plus visibles.",
  "hints.activationIndicator.enabled": "activer l’indicateur d’activation",
  "Shows a temporary activation ring after you open or focus something through hints.":
    "Affiche un anneau temporaire après l’ouverture ou la sélection d’un élément avec un repère.",
  "hints.activationIndicator.color": "couleur de l’indicateur d’activation",
  "hints.charset": "caractères des repères",
  "Controls which letters are used to generate hint labels. Letters earlier in the charset are prioritized first.":
    "Définit les lettres utilisées pour générer les repères. Les premières lettres sont prioritaires.",
  "This applies to generated (non-reserved) hint labels. Reserved directive labels can still be typed even if they use letters outside this charset.":
    "Concerne les repères générés non réservés. Les repères de directives réservés restent utilisables même avec d’autres lettres.",
  "Use letters only, with no spaces and no duplicates. Any repeated character, whitespace, or non-letter is treated as an error.":
    "Utilisez uniquement des lettres, sans espaces ni doublons. Les caractères répétés, les espaces et les autres caractères sont des erreurs.",
  "hints.minLabelLength": "longueur minimale des repères",
  "Sets the minimum number of characters generated hint labels must use.":
    "Définit le nombre minimal de caractères des repères générés.",
  "hints.avoidAdjacentPairs": "éviter les paires adjacentes",
  "Lists consecutive character pairs to avoid inside generated hint labels. It is recommended to put hard-to-press character pairs here.":
    "Paires de caractères consécutifs à éviter dans les repères générés. Ajoutez les combinaisons difficiles à saisir.",
  "Separate pairs with spaces or newlines. Entries must be exactly two letters, and `#` starts a comment anywhere on the line.":
    "Séparez les paires par des espaces ou des retours à la ligne. Chaque entrée doit comporter deux lettres ; `#` commence un commentaire partout dans la ligne.",
  "hints.directives": "directives des repères",
  "Sets preferred hint directives for special elements.":
    "Définit les directives de repères préférées pour les éléments spéciaux.",
  "for valid directive names.": "pour les noms de directives valides.",
  "Matching directive hints show their directive icon next to the hint label.":
    "Les repères correspondant à une directive affichent son icône à côté du libellé.",
  "Each directive must be on its own line, with exactly one space after `@element` and between labels.":
    "Chaque directive doit occuper une ligne, avec un seul espace après `@element` et entre les libellés.",
  "hints.advanced.customSelectors": "sélecteurs personnalisés",
  "Adds site-specific selector overrides for hint generation.":
    "Ajoute des sélecteurs propres à chaque site pour générer les repères.",
  "for syntax and examples.": "pour la syntaxe et des exemples.",
  "Use `* <regex-pattern> {` to start a site block, then one selector per line as `<key> <css-selector>`, and close the block with `}`.":
    "Commencez un bloc de site par `* <regex-pattern> {`, ajoutez un sélecteur par ligne sous la forme `<key> <css-selector>` et terminez par `}`.",
  "`<key>` must be letters only and at least as long as `hints.minLabelLength`, or exactly `<auto>` to generate a label automatically.":
    "`<key>` doit contenir uniquement des lettres et respecter `hints.minLabelLength`, ou être `<auto>` pour générer un repère automatiquement.",
  "hints.styling": "style des repères",
  "Use the built-in hint marker look, or switch to editable CSS for full control.":
    "Utilisez le style intégré ou modifiez le CSS pour un contrôle complet.",
  default: "par défaut",
  custom: "personnalisé",
  "hints.customCSS": "CSS personnalisé des repères",
  bar: "barre",
  "bar.color": "couleur de la barre",
  "Sets the outline color of the bar prompt UI.":
    "Définit la couleur du contour de la barre de saisie.",
  "bar.searchEngineURL": "URL du moteur de recherche",
  "Used when bar input is treated as a search instead of a URL.":
    "Utilisée quand la saisie est interprétée comme une recherche plutôt qu’une URL.",
  "Use `{}` to represent the search query.": "Utilisez `{}` pour représenter la recherche.",
  "Example: `https://www.google.com/search?q={}`.":
    "Exemple : `https://www.google.com/search?q={}`.",
  "bar.search.suggestions": "suggestions de recherche",
  "Shows live query suggestions as you type.":
    "Affiche des suggestions de recherche pendant la saisie.",
  "Suggestions are sourced from DuckDuckGo's public autocomplete suggestions API and are not based on your personal search history. Requests are sent directly from your browser to DuckDuckGo and do not include cookies, accounts, extension identifiers, or other personal data.":
    "Les suggestions proviennent de l’API publique de saisie automatique de DuckDuckGo et non de votre historique personnel. Les requêtes sont envoyées directement du navigateur à DuckDuckGo, sans cookies, comptes, identifiants d’extension ni autres données personnelles.",
  "bar.search.history": "historique de recherche",
  "Shows matches from your local browser history for past searches and visited links.":
    "Affiche les recherches et liens visités correspondants dans l’historique local du navigateur.",
  "History lookups stay on-device and are not sent to us or any third party.":
    "Les recherches dans l’historique restent sur votre appareil et ne sont transmises ni à nous ni à des tiers.",
  "bar.search.bookmarks": "rechercher dans les favoris",
  "Shows matches from a configurable bookmark list that you manage locally.":
    "Affiche les résultats d’une liste de favoris configurable et gérée localement.",
  "bar.search.bookmarks.storage": "liste des favoris",
  'Use one bookmark per line in the format `"bookmark name": "value"`.':
    'Saisissez un favori par ligne au format `"bookmark name": "value"`.',
  "import bookmarks": "importer des favoris",
  "export all": "tout exporter",
  "import all (replace)": "tout importer (remplacer)",
  find: "recherche",
  "find.color": "couleur de recherche",
  "Sets the outline color for the find bar and the next/prev widget.":
    "Définit la couleur du contour de la barre de recherche et des commandes suivant/précédent.",
  save: "enregistrer",
  "save & export": "enregistrer et exporter",
  "import & save": "importer et enregistrer",
  danger: "zone de danger",
  "reset to default": "rétablir les valeurs par défaut",
  "Made with ❤️ by Max Hu et al.": "Créé avec ❤️ par Max Hu et d’autres.",
  "Join the": "Rejoignez le",
  "nav logo": "logo de nav",
  "toggle rules section": "déplier ou replier les règles",
  "rules urls mode blacklist": "mode des URL bloquées",
  "rules urls mode whitelist": "mode des URL autorisées",
  "rules urls blacklist": "URL bloquées",
  "rules urls whitelist": "URL autorisées",
  "rules force normal mode": "forcer le mode normal",
  "toggle hotkeys section": "déplier ou replier les raccourcis",
  "hotkeys mappings": "raccourcis clavier",
  "toggle hints section": "déplier ou replier les repères",
  "hints show capitalized letters": "afficher les repères en majuscules",
  "hints improve thumbnail markers": "améliorer les repères des miniatures",
  "hints show activation indicator": "afficher l’indicateur d’activation",
  "hints show activation indicator color": "couleur de l’indicateur d’activation",
  "hints charset": "caractères des repères",
  "hints min label length": "longueur minimale des repères",
  "hints avoid adjacent pairs": "éviter les paires adjacentes",
  "hints directives": "directives des repères",
  "hints advanced custom selectors": "sélecteurs personnalisés des repères",
  "hints styling default": "style par défaut des repères",
  "hints styling custom": "style personnalisé des repères",
  "hints custom css": "CSS personnalisé des repères",
  "toggle bar section": "déplier ou replier la barre",
  "bar color": "couleur de la barre",
  "bar search engine url": "URL du moteur de recherche de la barre",
  "bar search suggestions": "suggestions de recherche de la barre",
  "bar search history": "historique de recherche de la barre",
  "bar search bookmarks": "recherche de favoris dans la barre",
  "bar search bookmarks storage": "liste des favoris de la barre",
  "toggle find section": "déplier ou replier la recherche",
  "find color": "couleur de recherche",
  "save options": "enregistrer les options",
  "save and export options": "enregistrer et exporter les options",
  "import and save options": "importer et enregistrer les options",
  "reset options to default": "rétablir les options par défaut",
  "Include site": "Inclure le site",
  "Exclude site": "Exclure le site",
  "This will be added to {path}.": "Sera ajouté à {path}.",
  add: "ajouter",
  cancel: "annuler",
  ok: "OK",
  confirm: "confirmer",
  reset: "réinitialiser",
  "Save (Ctrl+S)": "Enregistrer (ctrl+s)",
  "Save & export (Ctrl+E)": "Enregistrer et exporter (ctrl+e)",
  "Import & save (Ctrl+I)": "Importer et enregistrer (ctrl+i)",
  "Choose color for {field}": "Choisir la couleur de {field}",
  "Contains one or more invalid entries.": "Contient une ou plusieurs entrées non valides.",
  "Contains errors.": "Contient des erreurs.",
  "No errors detected.": "Aucune erreur détectée.",
  "{path} has unresolved errors; aborting save.":
    "{path} contient des erreurs non résolues, enregistrement annulé.",
  "Changes saved.": "Modifications enregistrées.",
  "Input your save. This will overwrite your current config.":
    "Collez votre sauvegarde. Ceci écrasera votre configuration actuelle.",
  "Input was empty, nothing imported.": "La saisie était vide, rien n’a été importé.",
  "Incorrect save format, expected NAV_SAVE_FORMAT_v#.#.#_.":
    "Format incorrect, attendu : NAV_SAVE_FORMAT_v#.#.#_.",
  "Invalid save format.": "Format de sauvegarde non valide.",
  "Invalid config data.": "Données de configuration non valides.",
  "Config saved & copied to clipboard.":
    "Configuration enregistrée et copiée dans le presse-papiers.",
  "Could not save config to clipboard.":
    "Impossible de copier la configuration dans le presse-papiers.",
  "Do you want to reset your options to default? This cannot be undone.":
    "Rétablir les options par défaut ? Cette action est irréversible.",
  "Options reset to default.": "Options réinitialisées.",
  "You selected no, options did not reset.": "Annulé, les options n’ont pas été réinitialisées.",
  "Incorrect save format, expected NAV_BOOKMARKS_FORMAT_v#.#.#_ or MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_.":
    "Format incorrect, attendu : NAV_BOOKMARKS_FORMAT_v#.#.#_ ou MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_.",
  "1 bookmark imported.": "1 favori importé.",
  "{count} bookmarks imported.": "{count} favoris importés.",
  "1 bookmark copied to clipboard.": "1 favori copié dans le presse-papiers.",
  "{count} bookmarks copied to clipboard.": "{count} favoris copiés dans le presse-papiers.",
  "Could not copy bookmarks to clipboard.":
    "Impossible de copier les favoris dans le presse-papiers.",
  "Input your bookmarks to import.": "Saisissez les favoris à importer.",
  "Input your bookmarks to import. This will overwrite your current bookmarks.":
    "Saisissez les favoris. Cela remplacera vos favoris actuels.",
  'Accepts NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} and MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...]. MTAB folders are flattened.':
    'Accepte NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} et MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...]. Les dossiers MTAB sont convertis en liste simple.',
  Notifications: "Notifications",
  action: "action",
  "line {line}: {message}": "ligne {line} : {message}",
  'Invalid action "{action}".': "Action non valide « {action} ».",
  "Expected at least one action name.": "Au moins un nom d’action est requis.",
  'Invalid rule prefix "{prefix}".': "Préfixe de règle non valide « {prefix} ».",
  "Regex pattern cannot be empty.": "L’expression régulière ne peut pas être vide.",
  'Invalid regex pattern "{pattern}".': "Expression régulière non valide « {pattern} ».",
  'Operator "{prefix}" must follow a "*" pattern line.':
    "L’opérateur « {prefix} » doit suivre une ligne de motif « * ».",
  "position {position}: Spaces are not allowed in hints.charset.":
    "position {position} : Les espaces sont interdits dans hints.charset.",
  'position {position}: "{char}" is not a letter a-z.':
    "position {position} : « {char} » n’est pas une lettre a-z.",
  'position {position}: "{char}" is duplicated.': "position {position} : « {char} » est répété.",
  "hints.charset must contain at least 2 unique letters.":
    "hints.charset doit contenir au moins 2 lettres distinctes.",
  "Remove leading or trailing spaces.": "Supprimez les espaces au début ou à la fin.",
  'Expected format "@element label1 label2 label3" with single spaces.':
    "Format attendu : « @element label1 label2 label3 » avec des espaces simples.",
  'Unknown directive "@{directive}". See docs#directive-names for valid directives.':
    "Directive inconnue « @{directive} ». Consultez docs#directive-names pour les directives valides.",
  'Duplicate "@{directive}" directive.': "Directive « @{directive} » en double.",
  'Label "{label}" must contain only letters a-z, or be exactly "<unbound>".':
    "Le libellé « {label} » doit contenir uniquement des lettres a-z ou être exactement « <unbound> ».",
  'Label "{label}" must be exactly one character longer than the previous label.':
    "Le libellé « {label} » doit comporter exactement un caractère de plus que le précédent.",
  'Label "{label}" is duplicated.': "Le libellé « {label} » est répété.",
  'Missing "@{directive}" directive. Use "@{directive} <unbound>" if it should stay unbound.':
    "Directive « @{directive} » manquante. Utilisez « @{directive} <unbound> » pour la laisser sans raccourci.",
  'Expected "* <regex-pattern> {".': "Attendu : « * <regex-pattern> { ».",
  "Unexpected closing brace.": "Accolade fermante inattendue.",
  "Missing closing brace for this block.": "Accolade fermante manquante pour ce bloc.",
  "Add at least one selector entry to this block.": "Ajoutez au moins un sélecteur à ce bloc.",
  'Expected "<key> <css-selector>".': "Attendu : « <key> <css-selector> ».",
  'Key must be letters only and at least as long as hints.minLabelLength, or exactly "<auto>".':
    "La clé doit contenir uniquement des lettres, respecter hints.minLabelLength ou être exactement « <auto> ».",
  'Duplicate custom selector key "{key}" in the same block.':
    "Clé de sélecteur personnalisé « {key} » en double dans le même bloc.",
  'Invalid CSS selector "{selector}".': "Sélecteur CSS non valide « {selector} ».",
  'line {line}: "{pair}" must be exactly 2 letters (a-z).':
    "ligne {line} : « {pair} » doit comporter exactement 2 lettres (a-z).",
  'line {line}: "{pair}" is duplicated.': "ligne {line} : « {pair} » est répété.",
  'line {line}: Expected format "bookmark name": "value".':
    "ligne {line} : Format attendu « bookmark name »: « value ».",
  "Missing whitespace separator between key sequence and action name.":
    "Espace manquant entre la séquence de touches et le nom de l’action.",
  "Missing key sequence before the action name.":
    "Séquence de touches manquante avant le nom de l’action.",
  "Missing action name after the key sequence.":
    "Nom d’action manquant après la séquence de touches.",
  'Unknown action name. Received "{action}".': "Nom d’action inconnu : « {action} ».",
  'Sequence is already used by another action in the same mode. Mode "{mode}" already has a binding for "{sequence}".':
    "Cette séquence est déjà utilisée dans ce mode. Le mode « {mode} » possède déjà un raccourci pour « {sequence} ».",
  'Every action must be declared at least once. Declare "{action}" or set it to "<unbound>".':
    "Chaque action doit être déclarée au moins une fois. Déclarez « {action} » ou définissez-la sur « <unbound> »."
} as const;