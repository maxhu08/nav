export const ja = {
  Export: "エクスポート",
  "download config": "設定をダウンロード",
  "copy to clipboard": "クリップボードにコピー",
  or: "または",
  "upload config": "設定をアップロード",
  "Could not read file.": "ファイルを読み取れませんでした。",
  "Could not export config.": "設定をエクスポートできませんでした。",
  "Paste here...": "ここに貼り付け...",
  "options ヽ(・ω・*)": "設定 ヽ(・ω・*)",
  options: "設定",
  "options.language": "言語",
  "options language": "設定の言語",
  "toggle options section": "設定セクションを展開／折りたたみ",
  rules: "ルール",
  "rules.urls.mode": "URL ルールのモード",
  "Controls which URL rules list is enforced at runtime.":
    "実行時に適用する URL ルールのリストを選択します。",
  blacklist: "ブロックリスト",
  whitelist: "許可リスト",
  "rules.urls.blacklist": "URL ブロックリスト",
  See: "参照：",
  "for syntax and examples, and": "で構文と使用例を、",
  "for valid action names.": "で有効なアクション名を確認してください。",
  "rules.urls.whitelist": "URL 許可リスト",
  "rules.forceNormalMode": "通常モードを強制",
  "Keeps nav in normal mode on page load by rejecting automatic focus into editable fields until you manually focus one.":
    "ページ読み込み時に入力欄への自動フォーカスを防ぎ、手動でフォーカスするまで nav を通常モードに保ちます。",
  hotkeys: "ショートカット",
  "hotkeys.mappings": "キー割り当て",
  hints: "ヒント",
  "hints.showCapitalizedLetters": "大文字で表示",
  "Changes how hint labels are displayed. The required key presses stay lowercase.":
    "ヒントラベルの表示方法を変更します。入力するキーは小文字のままです。",
  "hints.improveThumbnailMarkers": "サムネイルのマーカーを強調",
  "Makes hint markers much easier to see on thumbnail-like media targets by centering them and rendering a larger badge.":
    "サムネイルなどのメディア上でマーカーを中央に大きく表示し、見やすくします。",
  "hints.activationIndicator.enabled": "アクティブ化インジケーターを有効化",
  "Shows a temporary activation ring after you open or focus something through hints.":
    "ヒントで要素を開くかフォーカスした後、一時的にリングを表示します。",
  "hints.activationIndicator.color": "インジケーターの色",
  "hints.charset": "ヒントの文字セット",
  "Controls which letters are used to generate hint labels. Letters earlier in the charset are prioritized first.":
    "ヒントラベルの生成に使用する文字を設定します。先に指定した文字が優先されます。",
  "This applies to generated (non-reserved) hint labels. Reserved directive labels can still be typed even if they use letters outside this charset.":
    "自動生成される予約済み以外のラベルに適用されます。予約済みのディレクティブラベルは文字セット外の文字でも入力できます。",
  "Use letters only, with no spaces and no duplicates. Any repeated character, whitespace, or non-letter is treated as an error.":
    "空白や重複を含めず、英字のみを使用してください。重複文字、空白、英字以外はエラーになります。",
  "hints.minLabelLength": "ラベルの最小文字数",
  "Sets the minimum number of characters generated hint labels must use.":
    "生成されるヒントラベルの最小文字数を設定します。",
  "hints.avoidAdjacentPairs": "連続する文字の組み合わせを除外",
  "Lists consecutive character pairs to avoid inside generated hint labels. It is recommended to put hard-to-press character pairs here.":
    "生成するラベルから除外する連続文字の組み合わせです。入力しにくい組み合わせを指定してください。",
  "Separate pairs with spaces or newlines. Entries must be exactly two letters, and `#` starts a comment anywhere on the line.":
    "組み合わせを空白または改行で区切ってください。各項目は英字 2 文字にします。`#` 以降はコメントです。",
  "hints.directives": "ヒントのディレクティブ",
  "Sets preferred hint directives for special elements.":
    "特別な要素に優先するヒントのディレクティブを設定します。",
  "for valid directive names.": "で有効なディレクティブ名を確認してください。",
  "Matching directive hints show their directive icon next to the hint label.":
    "一致するディレクティブのアイコンをヒントラベルの横に表示します。",
  "Each directive must be on its own line, with exactly one space after `@element` and between labels.":
    "ディレクティブは 1 行に 1 つ指定し、`@element` の後とラベルの間には空白を 1 つだけ入れてください。",
  "hints.advanced.customSelectors": "カスタムセレクター",
  "Adds site-specific selector overrides for hint generation.":
    "ヒント生成にサイト固有のセレクターを追加します。",
  "for syntax and examples.": "で構文と使用例を確認してください。",
  "Use `* <regex-pattern> {` to start a site block, then one selector per line as `<key> <css-selector>`, and close the block with `}`.":
    "`* <regex-pattern> {` でサイトのブロックを開始し、各行に `<key> <css-selector>` を指定して `}` で閉じてください。",
  "`<key>` must be letters only and at least as long as `hints.minLabelLength`, or exactly `<auto>` to generate a label automatically.":
    "`<key>` は英字のみで `hints.minLabelLength` 以上の長さにするか、`<auto>` を指定してラベルを自動生成します。",
  "hints.styling": "ヒントのスタイル",
  "Use the built-in hint marker look, or switch to editable CSS for full control.":
    "標準のヒント表示を使用するか、CSS を編集して自由に設定します。",
  default: "標準",
  custom: "カスタム",
  "hints.customCSS": "ヒントのカスタム CSS",
  bar: "バー",
  "bar.color": "バーの色",
  "bar.tabsColor": "タブ検索バーの色",
  "bar tabs color": "タブ検索バーの色",
  "Sets the outline color of the tab search bar.": "タブ検索バーの枠線の色を設定します。",
  "Sets the outline color of the bar prompt UI.": "入力バーの枠線の色を設定します。",
  "bar.searchEngineURL": "検索エンジンの URL",
  "Used when bar input is treated as a search instead of a URL.":
    "バーの入力が URL ではなく検索として扱われる場合に使用します。",
  "Use `{}` to represent the search query.": "検索語を表すには `{}` を使用します。",
  "Example: `https://www.google.com/search?q={}`.": "例：`https://www.google.com/search?q={}`。",
  "bar.search.suggestions": "検索候補",
  "Shows live query suggestions as you type.": "入力中に検索候補を表示します。",
  "Suggestions are sourced from DuckDuckGo's public autocomplete suggestions API and are not based on your personal search history. Requests are sent directly from your browser to DuckDuckGo and do not include cookies, accounts, extension identifiers, or other personal data.":
    "候補は DuckDuckGo の公開自動補完 API から取得し、個人の検索履歴は使用しません。リクエストはブラウザーから直接 DuckDuckGo に送信され、Cookie、アカウント、拡張機能の識別子などの個人情報は含みません。",
  "bar.search.history": "検索履歴",
  "Shows matches from your local browser history for past searches and visited links.":
    "ブラウザーのローカル履歴から一致する検索や訪問済みリンクを表示します。",
  "History lookups stay on-device and are not sent to us or any third party.":
    "履歴の検索は端末内で行い、開発者や第三者には送信しません。",
  "bar.search.bookmarks": "ブックマーク検索",
  "bar.search.tabs": "開いているタブを検索",
  "bar search tabs": "バーでタブを検索",
  "Shows matching open tabs in the bar. Selecting a tab switches to it instead of opening a duplicate. Tab lookups stay on-device.":
    "一致する開いているタブをバーに表示します。選択すると重複して開かず、そのタブに切り替えます。タブの検索は端末内で行われます。",
  "Shows matches from a configurable bookmark list that you manage locally.":
    "ローカルで管理するブックマークリストから一致する項目を表示します。",
  "bar.search.bookmarks.storage": "ブックマークリスト",
  'Use one bookmark per line in the format `"bookmark name": "value"`.':
    '`"bookmark name": "value"` の形式で 1 行に 1 つのブックマークを指定してください。',
  "import bookmarks": "ブックマークをインポート",
  "export all": "すべてエクスポート",
  "import all (replace)": "すべてインポート（置換）",
  find: "ページ内検索",
  "find.color": "ページ内検索の色",
  "Sets the outline color for the find bar and the next/prev widget.":
    "検索バーと次へ・前への操作パネルの枠線の色を設定します。",
  save: "保存",
  "save & export": "保存してエクスポート",
  "import & save": "インポートして保存",
  danger: "注意が必要な操作",
  "reset to default": "初期設定に戻す",
  "Made with ❤️ by Max Hu et al.": "Max Hu ほかが ❤️ を込めて制作。",
  "Join the": "参加する：",
  "nav logo": "nav のロゴ",
  "toggle rules section": "ルールの表示を切り替え",
  "rules urls mode blacklist": "URL ブロックリストモード",
  "rules urls mode whitelist": "URL 許可リストモード",
  "rules urls blacklist": "URL ブロックリスト",
  "rules urls whitelist": "URL 許可リスト",
  "rules force normal mode": "通常モードを強制",
  "toggle hotkeys section": "ショートカットの表示を切り替え",
  "hotkeys mappings": "キー割り当て",
  "toggle hints section": "ヒントの表示を切り替え",
  "hints show capitalized letters": "ヒントを大文字で表示",
  "hints improve thumbnail markers": "サムネイルのマーカーを強調",
  "hints show activation indicator": "アクティブ化インジケーターを表示",
  "hints show activation indicator color": "インジケーターの色",
  "hints charset": "ヒントの文字セット",
  "hints min label length": "ヒントの最小文字数",
  "hints avoid adjacent pairs": "連続する文字の組み合わせを除外",
  "hints directives": "ヒントのディレクティブ",
  "hints advanced custom selectors": "ヒントのカスタムセレクター",
  "hints styling default": "ヒントの標準スタイル",
  "hints styling custom": "ヒントのカスタムスタイル",
  "hints custom css": "ヒントのカスタム CSS",
  "toggle bar section": "バーの表示を切り替え",
  "bar color": "バーの色",
  "bar search engine url": "バーの検索エンジン URL",
  "bar search suggestions": "バーの検索候補",
  "bar search history": "バーの検索履歴",
  "bar search bookmarks": "バーのブックマーク検索",
  "bar search bookmarks storage": "バーのブックマークリスト",
  "toggle find section": "ページ内検索の表示を切り替え",
  "find color": "ページ内検索の色",
  "save options": "設定を保存",
  "save and export options": "設定を保存してエクスポート",
  "import and save options": "設定をインポートして保存",
  "reset options to default": "設定を初期値に戻す",
  "Include site": "サイトを含める",
  "Exclude site": "サイトを除外",
  "This will be added to {path}.": "{path} に追加されます。",
  add: "追加",
  cancel: "キャンセル",
  ok: "OK",
  confirm: "確認",
  reset: "リセット",
  "Save (Ctrl+S)": "保存（ctrl+s）",
  "Save & export (Ctrl+E)": "保存してエクスポート（ctrl+e）",
  "Import & save (Ctrl+I)": "インポートして保存（ctrl+i）",
  "Choose color for {field}": "{field} の色を選択",
  "Contains one or more invalid entries.": "無効な項目が含まれています。",
  "Contains errors.": "エラーがあります。",
  "No errors detected.": "エラーはありません。",
  "{path} has unresolved errors; aborting save.":
    "{path} に未解決のエラーがあるため保存を中止しました。",
  "Changes saved.": "変更を保存しました。",
  "Input your save. This will overwrite your current config.":
    "インポートする保存データを入力（現在の設定は上書きされます）。",
  "Input was empty, nothing imported.": "入力が空のため何もインポートしませんでした。",
  "Invalid save format, expected NAV_SAVE_FORMAT_v#.#.#_.":
    "保存形式が正しくありません。NAV_SAVE_FORMAT_v#.#.#_ を使用してください。",
  "Incorrect save format.": "無効な保存形式です。",
  "Invalid config data.": "無効な設定データです。",
  "Config saved & copied to clipboard.": "設定を保存し、クリップボードにコピーしました。",
  "Could not save config to clipboard.": "設定をクリップボードにコピーできませんでした。",
  "Do you want to reset your options to default? This cannot be undone.":
    "設定を初期値に戻しますか？この操作は取り消せません。",
  "Options reset to default.": "設定を初期値に戻しました。",
  "You selected no, options did not reset.": "キャンセルしました。設定は変更していません。",
  "Incorrect format, expected NAV_BOOKMARKS_FORMAT_v#.#.#_ or MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_.":
    "保存形式が正しくありません。NAV_BOOKMARKS_FORMAT_v#.#.#_ または MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_ を使用してください。",
  "1 bookmark imported.": "ブックマークを 1 件インポートしました。",
  "{count} bookmarks imported.": "ブックマークを {count} 件インポートしました。",
  "1 bookmark copied to clipboard.": "ブックマークを 1 件クリップボードにコピーしました。",
  "{count} bookmarks copied to clipboard.":
    "ブックマークを {count} 件クリップボードにコピーしました。",
  "Could not copy bookmarks to clipboard.":
    "ブックマークをクリップボードにコピーできませんでした。",
  "Input your bookmarks to import.": "インポートするブックマークを入力してください。",
  "Input your bookmarks to import. This will overwrite your current bookmarks.":
    "ブックマークを入力してください。現在のブックマークを上書きします。",
  'Accepts NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} and MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...]. MTAB folders are flattened.':
    'NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} と MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...] に対応しています。MTAB のフォルダーは平坦なリストに変換されます。',
  Notifications: "通知",
  action: "操作",
  "line {line}: {message}": "{line} 行目：{message}",
  'Invalid action "{action}".': "無効なアクション「{action}」です。",
  "Expected at least one action name.": "アクション名を少なくとも 1 つ指定してください。",
  'Invalid rule prefix "{prefix}".': "無効なルール接頭辞「{prefix}」です。",
  "Regex pattern cannot be empty.": "正規表現は空にできません。",
  'Invalid regex pattern "{pattern}".': "無効な正規表現「{pattern}」です。",
  'Operator "{prefix}" must follow a "*" pattern line.':
    "演算子「{prefix}」は「*」のパターン行の直後に指定してください。",
  "position {position}: Spaces are not allowed in hints.charset.":
    "{position} 文字目：hints.charset に空白は使用できません。",
  'position {position}: "{char}" is not a letter a-z.':
    "{position} 文字目：「{char}」は a-z の英字ではありません。",
  'position {position}: "{char}" is duplicated.': "{position} 文字目：「{char}」が重複しています。",
  "hints.charset must contain at least 2 unique letters.":
    "hints.charset には異なる英字を 2 文字以上指定してください。",
  "Remove leading or trailing spaces.": "先頭または末尾の空白を削除してください。",
  'Expected format "@element label1 label2 label3" with single spaces.':
    "「@element label1 label2 label3」の形式で空白を 1 つずつ入れてください。",
  'Unknown directive "@{directive}". See docs#directive-names for valid directives.':
    "不明なディレクティブ「@{directive}」です。有効な名前は docs#directive-names を参照してください。",
  'Duplicate "@{directive}" directive.': "ディレクティブ「@{directive}」が重複しています。",
  'Label "{label}" must contain only letters a-z, or be exactly "<unbound>".':
    "ラベル「{label}」は a-z の英字のみ、または「<unbound>」にしてください。",
  'Label "{label}" must be exactly one character longer than the previous label.':
    "ラベル「{label}」は前のラベルより正確に 1 文字長くしてください。",
  'Label "{label}" is duplicated.': "ラベル「{label}」が重複しています。",
  'Missing "@{directive}" directive. Use "@{directive} <unbound>" if it should stay unbound.':
    "ディレクティブ「@{directive}」がありません。未割り当てにする場合は「@{directive} <unbound>」を指定してください。",
  'Expected "* <regex-pattern> {".': "「* <regex-pattern> {」を指定してください。",
  "Unexpected closing brace.": "予期しない閉じ波括弧です。",
  "Missing closing brace for this block.": "このブロックの閉じ波括弧がありません。",
  "Add at least one selector entry to this block.":
    "このブロックにセレクターを 1 つ以上追加してください。",
  'Expected "<key> <css-selector>".': "「<key> <css-selector>」を指定してください。",
  'Key must be letters only and at least as long as hints.minLabelLength, or exactly "<auto>".':
    "キーは英字のみで hints.minLabelLength 以上の長さ、または「<auto>」にしてください。",
  'Duplicate custom selector key "{key}" in the same block.':
    "同じブロック内でカスタムセレクターのキー「{key}」が重複しています。",
  'Invalid CSS selector "{selector}".': "無効な CSS セレクター「{selector}」です。",
  'line {line}: "{pair}" must be exactly 2 letters (a-z).':
    "{line} 行目：「{pair}」は英字 2 文字（a-z）にしてください。",
  'line {line}: "{pair}" is duplicated.': "{line} 行目：「{pair}」が重複しています。",
  'line {line}: Expected format "bookmark name": "value".':
    "{line} 行目：「bookmark name」:「value」の形式を使用してください。",
  "Missing whitespace separator between key sequence and action name.":
    "キー列とアクション名の間に空白がありません。",
  "Missing key sequence before the action name.": "アクション名の前にキー列がありません。",
  "Missing action name after the key sequence.": "キー列の後にアクション名がありません。",
  'Unknown action name. Received "{action}".': "不明なアクション名「{action}」です。",
  'Sequence is already used by another action in the same mode. Mode "{mode}" already has a binding for "{sequence}".':
    "同じモードで別のアクションがこのキー列を使用しています。モード「{mode}」には「{sequence}」の割り当てが既にあります。",
  'Every action must be declared at least once. Declare "{action}" or set it to "<unbound>".':
    "すべてのアクションを 1 回以上宣言してください。「{action}」を宣言するか「<unbound>」に設定してください。"
} as const;