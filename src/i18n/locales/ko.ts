export const ko = {
  Export: "내보내기",
  "download config": "설정 다운로드",
  "copy to clipboard": "클립보드에 복사",
  or: "또는",
  "upload config": "설정 업로드",
  "Could not read file.": "파일을 읽을 수 없습니다.",
  "Could not export config.": "설정을 내보내지 못했습니다.",
  "Paste here...": "여기에 붙여넣기...",
  "options ヽ(・ω・*)": "설정 ヽ(・ω・*)",
  options: "설정",
  "options.language": "언어",
  "options language": "설정 언어",
  "toggle options section": "설정 섹션 펼치기/접기",
  rules: "규칙",
  "rules.urls.mode": "URL 규칙 모드",
  "Controls which URL rules list is enforced at runtime.":
    "실행 중 적용할 URL 규칙 목록을 선택합니다.",
  blacklist: "차단 목록",
  whitelist: "허용 목록",
  "rules.urls.blacklist": "URL 차단 목록",
  See: "참고:",
  "for syntax and examples, and": "에서 구문과 예제를,",
  "for valid action names.": "에서 유효한 동작 이름을 확인하세요.",
  "rules.urls.whitelist": "URL 허용 목록",
  "rules.forceNormalMode": "일반 모드 강제",
  "Keeps nav in normal mode on page load by rejecting automatic focus into editable fields until you manually focus one.":
    "페이지 로드 시 편집 가능한 필드의 자동 포커스를 막아 수동으로 필드를 선택할 때까지 nav를 일반 모드로 유지합니다.",
  hotkeys: "단축키",
  "hotkeys.mappings": "키 매핑",
  hints: "힌트",
  "hints.showCapitalizedLetters": "대문자로 표시",
  "Changes how hint labels are displayed. The required key presses stay lowercase.":
    "힌트 레이블의 표시 방식을 변경합니다. 입력할 키는 소문자로 유지됩니다.",
  "hints.improveThumbnailMarkers": "썸네일 마커 개선",
  "Makes hint markers much easier to see on thumbnail-like media targets by centering them and rendering a larger badge.":
    "썸네일과 같은 미디어의 힌트 마커를 가운데에 크게 표시하여 더 잘 보이게 합니다.",
  "hints.activationIndicator.enabled": "활성화 표시기 사용",
  "Shows a temporary activation ring after you open or focus something through hints.":
    "힌트로 요소를 열거나 포커스한 후 잠시 활성화 링을 표시합니다.",
  "hints.activationIndicator.color": "활성화 표시기 색상",
  "hints.charset": "힌트 문자 집합",
  "Controls which letters are used to generate hint labels. Letters earlier in the charset are prioritized first.":
    "힌트 레이블 생성에 사용할 문자를 설정합니다. 앞쪽 문자가 우선 사용됩니다.",
  "This applies to generated (non-reserved) hint labels. Reserved directive labels can still be typed even if they use letters outside this charset.":
    "예약되지 않은 자동 생성 레이블에 적용됩니다. 예약된 지시어 레이블은 문자 집합 밖의 문자를 포함해도 입력할 수 있습니다.",
  "Use letters only, with no spaces and no duplicates. Any repeated character, whitespace, or non-letter is treated as an error.":
    "공백이나 중복 없이 영문자만 사용하세요. 중복 문자, 공백, 영문자가 아닌 문자는 오류입니다.",
  "hints.minLabelLength": "최소 레이블 길이",
  "Sets the minimum number of characters generated hint labels must use.":
    "자동 생성 힌트 레이블의 최소 문자 수를 설정합니다.",
  "hints.avoidAdjacentPairs": "인접 문자 쌍 제외",
  "Lists consecutive character pairs to avoid inside generated hint labels. It is recommended to put hard-to-press character pairs here.":
    "생성된 레이블에서 제외할 연속 문자 쌍입니다. 연속해서 누르기 어려운 조합을 지정하세요.",
  "Separate pairs with spaces or newlines. Entries must be exactly two letters, and `#` starts a comment anywhere on the line.":
    "공백이나 줄바꿈으로 문자 쌍을 구분하세요. 각 항목은 두 글자여야 하며, 줄의 어느 위치에서든 `#` 뒤는 주석입니다.",
  "hints.directives": "힌트 지시어",
  "Sets preferred hint directives for special elements.":
    "특수 요소에 우선 적용할 힌트 지시어를 설정합니다.",
  "for valid directive names.": "에서 유효한 지시어 이름을 확인하세요.",
  "Matching directive hints show their directive icon next to the hint label.":
    "일치하는 지시어의 아이콘을 힌트 레이블 옆에 표시합니다.",
  "Each directive must be on its own line, with exactly one space after `@element` and between labels.":
    "지시어를 한 줄에 하나씩 작성하고 `@element` 뒤와 레이블 사이에 공백을 하나씩 넣으세요.",
  "hints.advanced.customSelectors": "사용자 지정 선택자",
  "Adds site-specific selector overrides for hint generation.":
    "힌트 생성에 사이트별 선택자 규칙을 추가합니다.",
  "for syntax and examples.": "에서 구문과 예제를 확인하세요.",
  "Use `* <regex-pattern> {` to start a site block, then one selector per line as `<key> <css-selector>`, and close the block with `}`.":
    "`* <regex-pattern> {`로 사이트 블록을 시작하고 줄마다 `<key> <css-selector>` 형식의 선택자를 추가한 뒤 `}`로 닫으세요.",
  "`<key>` must be letters only and at least as long as `hints.minLabelLength`, or exactly `<auto>` to generate a label automatically.":
    "`<key>`는 영문자로만 구성하고 `hints.minLabelLength` 이상이어야 합니다. `<auto>`를 사용하면 레이블을 자동 생성합니다.",
  "hints.styling": "힌트 스타일",
  "Use the built-in hint marker look, or switch to editable CSS for full control.":
    "기본 힌트 스타일을 사용하거나 CSS를 편집하여 직접 설정하세요.",
  default: "기본",
  custom: "사용자 지정",
  "hints.customCSS": "힌트 사용자 지정 CSS",
  bar: "입력창",
  "bar.color": "입력창 색상",
  "bar.width": "입력창 너비",
  "bar.textSize": "입력창 글꼴 크기",
  "find.width": "검색창 너비",
  "find.textSize": "검색창 글꼴 크기",
  "bar width": "입력창 너비",
  "bar text size": "입력창 글꼴 크기",
  "find width": "검색창 너비",
  "find text size": "검색창 글꼴 크기",
  "bar.tabsColor": "탭 검색창 색상",
  "bar tabs color": "탭 검색창 색상",
  "Sets the outline color of the tab search bar.": "탭 검색창의 테두리 색상을 설정합니다.",
  "Sets the outline color of the bar prompt UI.": "입력창의 테두리 색상을 설정합니다.",
  "bar.searchEngineURL": "검색 엔진 URL",
  "Used when bar input is treated as a search instead of a URL.":
    "입력이 URL이 아닌 검색으로 처리될 때 사용합니다.",
  "Use `{}` to represent the search query.": "검색어를 나타내려면 `{}`를 사용하세요.",
  "Example: `https://www.google.com/search?q={}`.": "예: `https://www.google.com/search?q={}`.",
  "bar.search.suggestions": "검색 제안",
  "Shows live query suggestions as you type.": "입력하는 동안 실시간 검색 제안을 표시합니다.",
  "Suggestions are sourced from DuckDuckGo's public autocomplete suggestions API and are not based on your personal search history. Requests are sent directly from your browser to DuckDuckGo and do not include cookies, accounts, extension identifiers, or other personal data.":
    "검색 제안은 개인 검색 기록이 아닌 DuckDuckGo의 공개 자동 완성 API에서 가져옵니다. 요청은 브라우저에서 DuckDuckGo로 직접 전송되며 쿠키, 계정, 확장 프로그램 식별자 등 개인정보를 포함하지 않습니다.",
  "bar.search.history": "검색 기록",
  "Shows matches from your local browser history for past searches and visited links.":
    "로컬 브라우저 기록에서 일치하는 검색과 방문 링크를 표시합니다.",
  "History lookups stay on-device and are not sent to us or any third party.":
    "기록 조회는 기기 내에서만 이루어지며 개발자나 제삼자에게 전송하지 않습니다.",
  "bar.search.bookmarks": "북마크 검색",
  "bar.search.tabs": "열린 탭 검색",
  "bar search tabs": "바에서 탭 검색",
  "Shows matching open tabs in the bar. Selecting a tab switches to it instead of opening a duplicate. Tab lookups stay on-device.":
    "일치하는 열린 탭을 바에 표시합니다. 탭을 선택하면 중복으로 열지 않고 해당 탭으로 전환합니다. 탭 검색은 기기 내에서만 이루어집니다.",
  "Shows matches from a configurable bookmark list that you manage locally.":
    "로컬에서 관리하는 사용자 지정 북마크 목록의 일치 항목을 표시합니다.",
  "bar.search.bookmarks.storage": "북마크 목록",
  'Use one bookmark per line in the format `"bookmark name": "value"`.':
    '`"bookmark name": "value"` 형식으로 한 줄에 북마크 하나씩 입력하세요.',
  "import bookmarks": "북마크 가져오기",
  "export all": "모두 내보내기",
  "import all (replace)": "모두 가져오기 (교체)",
  find: "페이지 내 찾기",
  "find.color": "찾기 색상",
  "Sets the outline color for the find bar and the next/prev widget.":
    "찾기 입력창과 다음/이전 위젯의 테두리 색상을 설정합니다.",
  save: "저장",
  "save & export": "저장 및 내보내기",
  "import & save": "가져오기 및 저장",
  danger: "주의가 필요한 작업",
  "reset to default": "기본값으로 초기화",
  "Made with ❤️ by Max Hu et al.": "Max Hu 외 제작진이 ❤️를 담아 만들었습니다.",
  "Join the": "참여하기:",
  "nav logo": "nav 로고",
  "toggle rules section": "규칙 섹션 펼치기 또는 접기",
  "rules urls mode blacklist": "URL 차단 목록 모드",
  "rules urls mode whitelist": "URL 허용 목록 모드",
  "rules urls blacklist": "URL 차단 목록",
  "rules urls whitelist": "URL 허용 목록",
  "rules force normal mode": "일반 모드 강제",
  "toggle hotkeys section": "단축키 섹션 펼치기 또는 접기",
  "hotkeys mappings": "키 매핑",
  "toggle hints section": "힌트 섹션 펼치기 또는 접기",
  "hints show capitalized letters": "힌트 대문자로 표시",
  "hints improve thumbnail markers": "썸네일 마커 개선",
  "hints show activation indicator": "활성화 표시기 표시",
  "hints show activation indicator color": "활성화 표시기 색상",
  "hints charset": "힌트 문자 집합",
  "hints min label length": "최소 힌트 레이블 길이",
  "hints avoid adjacent pairs": "인접 문자 쌍 제외",
  "hints directives": "힌트 지시어",
  "hints advanced custom selectors": "힌트 사용자 지정 선택자",
  "hints styling default": "기본 힌트 스타일",
  "hints styling custom": "사용자 지정 힌트 스타일",
  "hints custom css": "힌트 사용자 지정 CSS",
  "toggle bar section": "입력창 섹션 펼치기 또는 접기",
  "bar color": "입력창 색상",
  "bar search engine url": "입력창 검색 엔진 URL",
  "bar search suggestions": "입력창 검색 제안",
  "bar search history": "입력창 검색 기록",
  "bar search bookmarks": "입력창 북마크 검색",
  "bar search bookmarks storage": "입력창 북마크 목록",
  "toggle find section": "찾기 섹션 펼치기 또는 접기",
  "find color": "찾기 색상",
  "save options": "설정 저장",
  "save and export options": "설정 저장 및 내보내기",
  "import and save options": "설정 가져오기 및 저장",
  "reset options to default": "설정을 기본값으로 초기화",
  "Include site": "사이트 포함",
  "Exclude site": "사이트 제외",
  "This will be added to {path}.": "{path}에 추가됩니다.",
  add: "추가",
  cancel: "취소",
  ok: "확인",
  confirm: "확인",
  reset: "초기화",
  "Save (Ctrl+S)": "저장(ctrl+s)",
  "Save & export (Ctrl+E)": "저장 및 내보내기(ctrl+e)",
  "Import & save (Ctrl+I)": "가져오기 및 저장(ctrl+i)",
  "Choose color for {field}": "{field} 색상 선택",
  "Contains one or more invalid entries.": "잘못된 항목이 하나 이상 있습니다.",
  "Contains errors.": "오류가 있습니다.",
  "No errors detected.": "오류가 없습니다.",
  "{path} has unresolved errors; aborting save.":
    "{path}에 해결되지 않은 오류가 있어 저장을 중단합니다.",
  "Changes saved.": "변경 사항을 저장했습니다.",
  "Input your save. This will overwrite your current config.":
    "가져올 저장 데이터를 입력하세요(현재 설정을 덮어씁니다).",
  "Input was empty, nothing imported.": "입력이 비어 있어 가져오지 않았습니다.",
  "Invalid save format, expected NAV_SAVE_FORMAT_v#.#.#_.":
    "잘못된 저장 형식입니다. NAV_SAVE_FORMAT_v#.#.#_ 형식이 필요합니다.",
  "Incorrect save format.": "잘못된 저장 형식입니다.",
  "Invalid config data.": "잘못된 설정 데이터입니다.",
  "Config saved & copied to clipboard.": "설정을 저장하고 클립보드에 복사했습니다.",
  "Could not save config to clipboard.": "설정을 클립보드에 복사하지 못했습니다.",
  "Do you want to reset your options to default? This cannot be undone.":
    "설정을 기본값으로 초기화할까요? 이 작업은 되돌릴 수 없습니다.",
  "Options reset to default.": "설정을 기본값으로 초기화했습니다.",
  "You selected no, options did not reset.": "취소했습니다. 설정을 초기화하지 않았습니다.",
  "Incorrect format, expected NAV_BOOKMARKS_FORMAT_v#.#.#_ or MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_.":
    "잘못된 저장 형식입니다. NAV_BOOKMARKS_FORMAT_v#.#.#_ 또는 MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_ 형식이 필요합니다.",
  "1 bookmark imported.": "북마크 1개를 가져왔습니다.",
  "{count} bookmarks imported.": "북마크 {count}개를 가져왔습니다.",
  "1 bookmark copied to clipboard.": "북마크 1개를 클립보드에 복사했습니다.",
  "{count} bookmarks copied to clipboard.": "북마크 {count}개를 클립보드에 복사했습니다.",
  "Could not copy bookmarks to clipboard.": "북마크를 클립보드에 복사할 수 없습니다.",
  "Input your bookmarks to import.": "가져올 북마크를 입력하세요.",
  "Input your bookmarks to import. This will overwrite your current bookmarks.":
    "북마크를 입력하세요. 현재 북마크를 덮어씁니다.",
  'Accepts NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} and MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...]. MTAB folders are flattened.':
    'NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} 및 MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...] 형식을 지원합니다. MTAB 폴더는 단일 목록으로 변환됩니다.',
  Notifications: "알림",
  action: "동작",
  "line {line}: {message}": "{line}행: {message}",
  'Invalid action "{action}".': '잘못된 동작 "{action}"입니다.',
  "Expected at least one action name.": "동작 이름이 하나 이상 필요합니다.",
  'Invalid rule prefix "{prefix}".': '잘못된 규칙 접두사 "{prefix}"입니다.',
  "Regex pattern cannot be empty.": "정규식 패턴은 비워 둘 수 없습니다.",
  'Invalid regex pattern "{pattern}".': '잘못된 정규식 패턴 "{pattern}"입니다.',
  'Operator "{prefix}" must follow a "*" pattern line.':
    '연산자 "{prefix}"는 "*" 패턴 행 바로 뒤에 와야 합니다.',
  "position {position}: Spaces are not allowed in hints.charset.":
    "{position}번째 문자: hints.charset에는 공백을 사용할 수 없습니다.",
  'position {position}: "{char}" is not a letter a-z.':
    '{position}번째 문자: "{char}"는 a-z 영문자가 아닙니다.',
  'position {position}: "{char}" is duplicated.': '{position}번째 문자: "{char}"가 중복되었습니다.',
  "hints.charset must contain at least 2 unique letters.":
    "hints.charset에는 서로 다른 영문자가 2개 이상 있어야 합니다.",
  "Remove leading or trailing spaces.": "앞뒤 공백을 제거하세요.",
  'Expected format "@element label1 label2 label3" with single spaces.':
    '"@element label1 label2 label3" 형식으로 공백을 하나씩 사용하세요.',
  'Unknown directive "@{directive}". See docs#directive-names for valid directives.':
    '알 수 없는 지시어 "@{directive}"입니다. 유효한 지시어는 docs#directive-names를 참고하세요.',
  'Duplicate "@{directive}" directive.': '지시어 "@{directive}"가 중복되었습니다.',
  'Label "{label}" must contain only letters a-z, or be exactly "<unbound>".':
    '레이블 "{label}"은 a-z 영문자만 포함하거나 정확히 "<unbound>"여야 합니다.',
  'Label "{label}" must be exactly one character longer than the previous label.':
    '레이블 "{label}"은 이전 레이블보다 정확히 한 글자 더 길어야 합니다.',
  'Label "{label}" is duplicated.': '레이블 "{label}"이 중복되었습니다.',
  'Missing "@{directive}" directive. Use "@{directive} <unbound>" if it should stay unbound.':
    '지시어 "@{directive}"가 없습니다. 할당하지 않으려면 "@{directive} <unbound>"를 사용하세요.',
  'Expected "* <regex-pattern> {".': '"* <regex-pattern> {" 형식이 필요합니다.',
  "Unexpected closing brace.": "예기치 않은 닫는 중괄호입니다.",
  "Missing closing brace for this block.": "이 블록의 닫는 중괄호가 없습니다.",
  "Add at least one selector entry to this block.": "이 블록에 선택자를 하나 이상 추가하세요.",
  'Expected "<key> <css-selector>".': '"<key> <css-selector>" 형식이 필요합니다.',
  'Key must be letters only and at least as long as hints.minLabelLength, or exactly "<auto>".':
    '키는 영문자로만 구성하고 hints.minLabelLength 이상이거나 정확히 "<auto>"여야 합니다.',
  'Duplicate custom selector key "{key}" in the same block.':
    '같은 블록에서 사용자 지정 선택자 키 "{key}"가 중복되었습니다.',
  'Invalid CSS selector "{selector}".': '잘못된 CSS 선택자 "{selector}"입니다.',
  'line {line}: "{pair}" must be exactly 2 letters (a-z).':
    '{line}행: "{pair}"는 정확히 영문자 2개(a-z)여야 합니다.',
  'line {line}: "{pair}" is duplicated.': '{line}행: "{pair}"가 중복되었습니다.',
  'line {line}: Expected format "bookmark name": "value".':
    '{line}행: "bookmark name": "value" 형식이 필요합니다.',
  "Missing whitespace separator between key sequence and action name.":
    "키 시퀀스와 동작 이름 사이에 공백이 없습니다.",
  "Missing key sequence before the action name.": "동작 이름 앞에 키 시퀀스가 없습니다.",
  "Missing action name after the key sequence.": "키 시퀀스 뒤에 동작 이름이 없습니다.",
  'Unknown action name. Received "{action}".': '알 수 없는 동작 이름 "{action}"입니다.',
  'Sequence is already used by another action in the same mode. Mode "{mode}" already has a binding for "{sequence}".':
    '같은 모드의 다른 동작이 이 시퀀스를 사용 중입니다. "{mode}" 모드에 "{sequence}" 할당이 이미 있습니다.',
  'Every action must be declared at least once. Declare "{action}" or set it to "<unbound>".':
    '각 동작을 한 번 이상 선언해야 합니다. "{action}"을 선언하거나 "<unbound>"로 설정하세요.'
} as const;