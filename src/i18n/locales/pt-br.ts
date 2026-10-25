export const ptBR = {
  Export: "Exportar",
  "download config": "baixar configuração",
  "copy to clipboard": "copiar para a área de transferência",
  or: "ou",
  "upload config": "enviar configuração",
  "Could not read file.": "Não foi possível ler o arquivo.",
  "Could not export config.": "Não foi possível exportar a configuração.",
  "Paste here...": "Cole aqui...",
  "options ヽ(・ω・*)": "opções ヽ(・ω・*)",
  options: "opções",
  "options.language": "idioma",
  "options language": "idioma das opções",
  "toggle options section": "mostrar/ocultar seção de opções",
  rules: "regras",
  "rules.urls.mode": "modo das regras de URL",
  "Controls which URL rules list is enforced at runtime.":
    "Controla qual lista de regras de URL é aplicada durante a execução.",
  blacklist: "lista de bloqueio",
  whitelist: "lista de permissões",
  "rules.urls.blacklist": "URLs bloqueadas",
  See: "Veja",
  "for syntax and examples, and": "para sintaxe e exemplos, e",
  "for valid action names.": "para nomes de ações válidos.",
  "rules.urls.whitelist": "URLs permitidas",
  "rules.forceNormalMode": "forçar modo normal",
  "Keeps nav in normal mode on page load by rejecting automatic focus into editable fields until you manually focus one.":
    "Mantém o nav no modo normal ao carregar a página, impedindo o foco automático em campos editáveis até você selecionar um manualmente.",
  hotkeys: "atalhos",
  "hotkeys.mappings": "mapeamento de teclas",
  hints: "dicas",
  "hints.showCapitalizedLetters": "mostrar letras maiúsculas",
  "Changes how hint labels are displayed. The required key presses stay lowercase.":
    "Altera a aparência dos rótulos das dicas. As teclas necessárias continuam minúsculas.",
  "hints.improveThumbnailMarkers": "melhorar marcadores em miniaturas",
  "Makes hint markers much easier to see on thumbnail-like media targets by centering them and rendering a larger badge.":
    "Centraliza e amplia os marcadores em miniaturas e mídias para facilitar a visualização.",
  "hints.activationIndicator.enabled": "ativar indicador de ativação",
  "Shows a temporary activation ring after you open or focus something through hints.":
    "Mostra um anel temporário após abrir ou focar um elemento usando dicas.",
  "hints.activationIndicator.color": "cor do indicador de ativação",
  "hints.charset": "caracteres das dicas",
  "Controls which letters are used to generate hint labels. Letters earlier in the charset are prioritized first.":
    "Define as letras usadas para gerar rótulos das dicas. As primeiras letras têm prioridade.",
  "This applies to generated (non-reserved) hint labels. Reserved directive labels can still be typed even if they use letters outside this charset.":
    "Aplica-se aos rótulos gerados não reservados. Os rótulos de diretivas reservadas continuam disponíveis mesmo com outras letras.",
  "Use letters only, with no spaces and no duplicates. Any repeated character, whitespace, or non-letter is treated as an error.":
    "Use apenas letras, sem espaços nem repetições. Caracteres repetidos, espaços e caracteres que não sejam letras são erros.",
  "hints.minLabelLength": "comprimento mínimo dos rótulos",
  "Sets the minimum number of characters generated hint labels must use.":
    "Define o número mínimo de caracteres dos rótulos gerados.",
  "hints.avoidAdjacentPairs": "evitar pares adjacentes",
  "Lists consecutive character pairs to avoid inside generated hint labels. It is recommended to put hard-to-press character pairs here.":
    "Pares de caracteres consecutivos a evitar nos rótulos gerados. Inclua combinações difíceis de digitar.",
  "Separate pairs with spaces or newlines. Entries must be exactly two letters, and `#` starts a comment anywhere on the line.":
    "Separe os pares com espaços ou quebras de linha. Cada entrada deve ter duas letras; `#` inicia um comentário em qualquer posição da linha.",
  "hints.directives": "diretivas das dicas",
  "Sets preferred hint directives for special elements.":
    "Define as diretivas preferidas para elementos especiais.",
  "for valid directive names.": "para nomes de diretivas válidos.",
  "Matching directive hints show their directive icon next to the hint label.":
    "As dicas correspondentes a uma diretiva mostram seu ícone ao lado do rótulo.",
  "Each directive must be on its own line, with exactly one space after `@element` and between labels.":
    "Cada diretiva deve ocupar uma linha, com um único espaço após `@element` e entre os rótulos.",
  "hints.advanced.customSelectors": "seletores personalizados",
  "Adds site-specific selector overrides for hint generation.":
    "Adiciona seletores específicos por site à geração de dicas.",
  "for syntax and examples.": "para sintaxe e exemplos.",
  "Use `* <regex-pattern> {` to start a site block, then one selector per line as `<key> <css-selector>`, and close the block with `}`.":
    "Inicie um bloco de site com `* <regex-pattern> {`, adicione um seletor por linha como `<key> <css-selector>` e feche com `}`.",
  "`<key>` must be letters only and at least as long as `hints.minLabelLength`, or exactly `<auto>` to generate a label automatically.":
    "`<key>` deve conter apenas letras e ter pelo menos o tamanho de `hints.minLabelLength`, ou ser `<auto>` para gerar um rótulo automaticamente.",
  "hints.styling": "estilo das dicas",
  "Use the built-in hint marker look, or switch to editable CSS for full control.":
    "Use o estilo integrado ou edite o CSS para ter controle total.",
  default: "padrão",
  custom: "personalizado",
  "hints.customCSS": "CSS personalizado das dicas",
  bar: "barra",
  "bar.color": "cor da barra",
  "Sets the outline color of the bar prompt UI.": "Define a cor da borda da barra de entrada.",
  "bar.searchEngineURL": "URL do mecanismo de busca",
  "Used when bar input is treated as a search instead of a URL.":
    "Usada quando a entrada da barra é interpretada como pesquisa em vez de URL.",
  "Use `{}` to represent the search query.": "Use `{}` para representar a consulta de pesquisa.",
  "Example: `https://www.google.com/search?q={}`.":
    "Exemplo: `https://www.google.com/search?q={}`.",
  "bar.search.suggestions": "sugestões de pesquisa",
  "Shows live query suggestions as you type.": "Mostra sugestões de pesquisa enquanto você digita.",
  "Suggestions are sourced from DuckDuckGo's public autocomplete suggestions API and are not based on your personal search history. Requests are sent directly from your browser to DuckDuckGo and do not include cookies, accounts, extension identifiers, or other personal data.":
    "As sugestões vêm da API pública de preenchimento automático do DuckDuckGo, não do seu histórico pessoal. As solicitações são enviadas diretamente do navegador ao DuckDuckGo sem cookies, contas, identificadores da extensão ou outros dados pessoais.",
  "bar.search.history": "histórico de pesquisa",
  "Shows matches from your local browser history for past searches and visited links.":
    "Mostra pesquisas e links visitados correspondentes no histórico local do navegador.",
  "History lookups stay on-device and are not sent to us or any third party.":
    "As consultas ao histórico ficam no dispositivo e não são enviadas a nós nem a terceiros.",
  "bar.search.bookmarks": "pesquisar favoritos",
  "bar.search.tabs": "pesquisar abas abertas",
  "bar search tabs": "pesquisar abas na barra",
  "Shows matching open tabs in the bar. Selecting a tab switches to it instead of opening a duplicate. Tab lookups stay on-device.":
    "Mostra abas abertas correspondentes na barra. Selecionar uma aba alterna para ela em vez de abrir uma cópia. A pesquisa fica no dispositivo.",
  "Shows matches from a configurable bookmark list that you manage locally.":
    "Mostra resultados de uma lista configurável de favoritos gerenciada localmente.",
  "bar.search.bookmarks.storage": "lista de favoritos",
  'Use one bookmark per line in the format `"bookmark name": "value"`.':
    'Use um favorito por linha no formato `"bookmark name": "value"`.',
  "import bookmarks": "importar favoritos",
  "export all": "exportar todos",
  "import all (replace)": "importar todos (substituir)",
  find: "localizar",
  "find.color": "cor da localização",
  "Sets the outline color for the find bar and the next/prev widget.":
    "Define a cor da borda da barra de localização e dos controles próximo/anterior.",
  save: "salvar",
  "save & export": "salvar e exportar",
  "import & save": "importar e salvar",
  danger: "zona de perigo",
  "reset to default": "restaurar padrão",
  "Made with ❤️ by Max Hu et al.": "Feito com ❤️ por Max Hu e outros.",
  "Join the": "Entre no",
  "nav logo": "logotipo do nav",
  "toggle rules section": "expandir ou recolher regras",
  "rules urls mode blacklist": "modo de URLs bloqueadas",
  "rules urls mode whitelist": "modo de URLs permitidas",
  "rules urls blacklist": "URLs bloqueadas",
  "rules urls whitelist": "URLs permitidas",
  "rules force normal mode": "forçar modo normal",
  "toggle hotkeys section": "expandir ou recolher atalhos",
  "hotkeys mappings": "mapeamento de teclas",
  "toggle hints section": "expandir ou recolher dicas",
  "hints show capitalized letters": "mostrar dicas em maiúsculas",
  "hints improve thumbnail markers": "melhorar marcadores em miniaturas",
  "hints show activation indicator": "mostrar indicador de ativação",
  "hints show activation indicator color": "cor do indicador de ativação",
  "hints charset": "caracteres das dicas",
  "hints min label length": "comprimento mínimo dos rótulos",
  "hints avoid adjacent pairs": "evitar pares adjacentes",
  "hints directives": "diretivas das dicas",
  "hints advanced custom selectors": "seletores personalizados das dicas",
  "hints styling default": "estilo padrão das dicas",
  "hints styling custom": "estilo personalizado das dicas",
  "hints custom css": "CSS personalizado das dicas",
  "toggle bar section": "expandir ou recolher barra",
  "bar color": "cor da barra",
  "bar search engine url": "URL do mecanismo de busca da barra",
  "bar search suggestions": "sugestões de pesquisa da barra",
  "bar search history": "histórico de pesquisa da barra",
  "bar search bookmarks": "pesquisar favoritos na barra",
  "bar search bookmarks storage": "lista de favoritos da barra",
  "toggle find section": "expandir ou recolher localização",
  "find color": "cor da localização",
  "save options": "salvar opções",
  "save and export options": "salvar e exportar opções",
  "import and save options": "importar e salvar opções",
  "reset options to default": "restaurar opções padrão",
  "Include site": "Incluir site",
  "Exclude site": "Excluir site",
  "This will be added to {path}.": "Será adicionado a {path}.",
  add: "adicionar",
  cancel: "cancelar",
  ok: "OK",
  confirm: "confirmar",
  reset: "restaurar",
  "Save (Ctrl+S)": "Salvar (ctrl+s)",
  "Save & export (Ctrl+E)": "Salvar e exportar (ctrl+e)",
  "Import & save (Ctrl+I)": "Importar e salvar (ctrl+i)",
  "Choose color for {field}": "Escolher cor para {field}",
  "Contains one or more invalid entries.": "Contém uma ou mais entradas inválidas.",
  "Contains errors.": "Contém erros.",
  "No errors detected.": "Nenhum erro detectado.",
  "{path} has unresolved errors; aborting save.":
    "{path} contém erros não resolvidos; salvamento cancelado.",
  "Changes saved.": "Alterações salvas.",
  "Input your save. This will overwrite your current config.":
    "Cole seu backup. Isto vai sobrescrever sua configuração atual.",
  "Input was empty, nothing imported.": "A entrada estava vazia; nada foi importado.",
  "Invalid save format, expected NAV_SAVE_FORMAT_v#.#.#_.":
    "Formato incorreto; esperado NAV_SAVE_FORMAT_v#.#.#_.",
  "Incorrect save format.": "Formato de salvamento inválido.",
  "Invalid config data.": "Dados de configuração inválidos.",
  "Config saved & copied to clipboard.":
    "Configuração salva e copiada para a área de transferência.",
  "Could not save config to clipboard.":
    "Não foi possível copiar a configuração para a área de transferência.",
  "Do you want to reset your options to default? This cannot be undone.":
    "Restaurar as opções padrão? Isso não pode ser desfeito.",
  "Options reset to default.": "Opções padrão restauradas.",
  "You selected no, options did not reset.": "Cancelado; as opções não foram restauradas.",
  "Incorrect format, expected NAV_BOOKMARKS_FORMAT_v#.#.#_ or MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_.":
    "Formato incorreto; esperado NAV_BOOKMARKS_FORMAT_v#.#.#_ ou MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_.",
  "1 bookmark imported.": "1 favorito importado.",
  "{count} bookmarks imported.": "{count} favoritos importados.",
  "1 bookmark copied to clipboard.": "1 favorito copiado para a área de transferência.",
  "{count} bookmarks copied to clipboard.":
    "{count} favoritos copiados para a área de transferência.",
  "Could not copy bookmarks to clipboard.":
    "Não foi possível copiar os favoritos para a área de transferência.",
  "Input your bookmarks to import.": "Insira os favoritos para importar.",
  "Input your bookmarks to import. This will overwrite your current bookmarks.":
    "Insira os favoritos. Isso substituirá seus favoritos atuais.",
  'Accepts NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} and MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...]. MTAB folders are flattened.':
    'Aceita NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} e MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...]. As pastas do MTAB são convertidas em uma lista simples.',
  Notifications: "Notificações",
  action: "ação",
  "line {line}: {message}": "linha {line}: {message}",
  'Invalid action "{action}".': 'Ação inválida "{action}".',
  "Expected at least one action name.": "É necessário pelo menos um nome de ação.",
  'Invalid rule prefix "{prefix}".': 'Prefixo de regra inválido "{prefix}".',
  "Regex pattern cannot be empty.": "O padrão de expressão regular não pode estar vazio.",
  'Invalid regex pattern "{pattern}".': 'Padrão de expressão regular inválido "{pattern}".',
  'Operator "{prefix}" must follow a "*" pattern line.':
    'O operador "{prefix}" deve vir após uma linha de padrão "*".',
  "position {position}: Spaces are not allowed in hints.charset.":
    "posição {position}: Espaços não são permitidos em hints.charset.",
  'position {position}: "{char}" is not a letter a-z.':
    'posição {position}: "{char}" não é uma letra a-z.',
  'position {position}: "{char}" is duplicated.': 'posição {position}: "{char}" está duplicado.',
  "hints.charset must contain at least 2 unique letters.":
    "hints.charset deve conter pelo menos 2 letras diferentes.",
  "Remove leading or trailing spaces.": "Remova os espaços no início ou no fim.",
  'Expected format "@element label1 label2 label3" with single spaces.':
    'Formato esperado "@element label1 label2 label3" com espaços simples.',
  'Unknown directive "@{directive}". See docs#directive-names for valid directives.':
    'Diretiva desconhecida "@{directive}". Veja docs#directive-names para diretivas válidas.',
  'Duplicate "@{directive}" directive.': 'Diretiva "@{directive}" duplicada.',
  'Label "{label}" must contain only letters a-z, or be exactly "<unbound>".':
    'O rótulo "{label}" deve conter apenas letras a-z ou ser exatamente "<unbound>".',
  'Label "{label}" must be exactly one character longer than the previous label.':
    'O rótulo "{label}" deve ter exatamente um caractere a mais que o anterior.',
  'Label "{label}" is duplicated.': 'O rótulo "{label}" está duplicado.',
  'Missing "@{directive}" directive. Use "@{directive} <unbound>" if it should stay unbound.':
    'Diretiva "@{directive}" ausente. Use "@{directive} <unbound>" para deixá-la sem associação.',
  'Expected "* <regex-pattern> {".': 'Esperado "* <regex-pattern> {".',
  "Unexpected closing brace.": "Chave de fechamento inesperada.",
  "Missing closing brace for this block.": "Falta a chave de fechamento deste bloco.",
  "Add at least one selector entry to this block.": "Adicione pelo menos um seletor a este bloco.",
  'Expected "<key> <css-selector>".': 'Esperado "<key> <css-selector>".',
  'Key must be letters only and at least as long as hints.minLabelLength, or exactly "<auto>".':
    'A chave deve conter apenas letras, ter pelo menos o tamanho de hints.minLabelLength ou ser exatamente "<auto>".',
  'Duplicate custom selector key "{key}" in the same block.':
    'Chave de seletor personalizado "{key}" duplicada no mesmo bloco.',
  'Invalid CSS selector "{selector}".': 'Seletor CSS inválido "{selector}".',
  'line {line}: "{pair}" must be exactly 2 letters (a-z).':
    'linha {line}: "{pair}" deve ter exatamente 2 letras (a-z).',
  'line {line}: "{pair}" is duplicated.': 'linha {line}: "{pair}" está duplicado.',
  'line {line}: Expected format "bookmark name": "value".':
    'linha {line}: Formato esperado "bookmark name": "value".',
  "Missing whitespace separator between key sequence and action name.":
    "Falta um espaço entre a sequência de teclas e o nome da ação.",
  "Missing key sequence before the action name.":
    "Falta a sequência de teclas antes do nome da ação.",
  "Missing action name after the key sequence.": "Falta o nome da ação após a sequência de teclas.",
  'Unknown action name. Received "{action}".': 'Nome de ação desconhecido: "{action}".',
  'Sequence is already used by another action in the same mode. Mode "{mode}" already has a binding for "{sequence}".':
    'A sequência já é usada por outra ação no mesmo modo. O modo "{mode}" já possui uma associação para "{sequence}".',
  'Every action must be declared at least once. Declare "{action}" or set it to "<unbound>".':
    'Cada ação deve ser declarada pelo menos uma vez. Declare "{action}" ou defina como "<unbound>".'
} as const;