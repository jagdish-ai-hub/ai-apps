// Languages that have their own guides and landing page (written natively, not translated).
// English guides live at /guides/, others at /<code>/guides/. Add a language here, in src/lib/guides.ts (glob) and src/guides/<code>/.
export const guideLangs = ['en', 'ja', 'ko', 'de', 'es', 'pt'];

// Interface strings for guide pages, guide hubs and landing pages. Kept here (not in src/i18n) because only these languages have them.
export const guideLabels = {
  en: {
    nav: 'Guides', home: 'Home', hubTitle: 'Guides', popular: 'Popular guides', toc: 'On this page', faqEyebrow: 'FAQ', faq: 'Frequently asked questions',
    moreEyebrow: 'More guides', more: 'Related guides', tryNow: 'Try it now', open: 'Open', backToTool: '← Open the online clipboard', howTo: 'How to use it',
    hubH1: 'Copy and share text between devices', hubIntro: 'Step-by-step guides for everyday jobs: getting text from a phone to a PC, sharing a Wi-Fi password, moving notes for school, passing code to a teammate, and doing all of it safely on devices that are not yours.',
    hubMetaTitle: 'Guides: Copy and Share Text Between Devices | WebClipboard', hubMetaDesc: 'Practical guides for moving text, notes, links and code between phones, computers and TVs: students, developers, Wi-Fi passwords, public computers and more.',
    landingCrumb: 'iPhone to Windows clipboard',
  },
  ja: {
    nav: 'ガイド', home: 'ホーム', hubTitle: 'ガイド', popular: '人気のガイド', toc: 'このページの内容', faqEyebrow: 'FAQ', faq: 'よくある質問',
    moreEyebrow: '関連ガイド', more: '関連するガイド', tryNow: '今すぐ使う', open: '開く', backToTool: '← オンラインクリップボードを開く', howTo: '使い方',
    hubH1: '端末のあいだでテキストをコピー・共有する', hubIntro: 'スマホからパソコンへ文字を送る、iPhoneとWindowsでコピペする、Wi-Fiのパスワードを伝える。毎日のちょっとした困りごとを、手順つきで解説します。',
    hubMetaTitle: 'ガイド：端末間でテキストをコピー・共有する方法｜WebClipboard', hubMetaDesc: 'スマホからパソコンへの文字の送り方、iPhoneとWindowsのコピペ、Wi-Fiパスワードの共有など、日常で役立つ手順をやさしく解説します。',
    landingCrumb: 'iPhoneからWindowsへコピペ',
  },
  ko: {
    nav: '가이드', home: '홈', hubTitle: '가이드', popular: '인기 가이드', toc: '이 페이지의 내용', faqEyebrow: 'FAQ', faq: '자주 묻는 질문',
    moreEyebrow: '관련 가이드', more: '관련 가이드', tryNow: '지금 사용해 보기', open: '열기', backToTool: '← 온라인 클립보드 열기', howTo: '사용 방법',
    hubH1: '기기 간에 텍스트 복사하고 공유하기', hubIntro: '휴대폰에서 PC로 텍스트 보내기, 아이폰과 윈도우 간 복사·붙여넣기, 와이파이 비밀번호 공유까지. 일상에서 자주 겪는 일을 단계별로 안내합니다.',
    hubMetaTitle: '가이드: 기기 간 텍스트 복사·공유 방법 | WebClipboard', hubMetaDesc: '휴대폰에서 PC로 텍스트 보내기, 아이폰과 윈도우 간 복사·붙여넣기, 와이파이 비밀번호 공유 등 일상에 유용한 방법을 쉽게 설명합니다.',
    landingCrumb: '아이폰에서 윈도우로 클립보드',
  },
  de: {
    nav: 'Ratgeber', home: 'Startseite', hubTitle: 'Ratgeber', popular: 'Beliebte Ratgeber', toc: 'Auf dieser Seite', faqEyebrow: 'FAQ', faq: 'Häufige Fragen',
    moreEyebrow: 'Weitere Ratgeber', more: 'Verwandte Ratgeber', tryNow: 'Jetzt ausprobieren', open: 'Öffnen', backToTool: '← Zur Online-Zwischenablage', howTo: 'So geht’s',
    hubH1: 'Text zwischen Geräten kopieren und teilen', hubIntro: 'Schritt-für-Schritt-Anleitungen für den Alltag: Text vom Handy auf den PC schicken, zwischen iPhone und Windows kopieren, ein WLAN-Passwort weitergeben und das alles sicher auch auf fremden Geräten.',
    hubMetaTitle: 'Ratgeber: Text zwischen Geräten kopieren und teilen | WebClipboard', hubMetaDesc: 'Praktische Anleitungen: Text vom Handy auf den PC senden, zwischen iPhone und Windows kopieren, WLAN-Passwort teilen und mehr, ohne App und ohne Konto.',
    landingCrumb: 'iPhone-Zwischenablage für Windows',
  },
  es: {
    nav: 'Guías', home: 'Inicio', hubTitle: 'Guías', popular: 'Guías populares', toc: 'En esta página', faqEyebrow: 'FAQ', faq: 'Preguntas frecuentes',
    moreEyebrow: 'Más guías', more: 'Guías relacionadas', tryNow: 'Pruébalo ahora', open: 'Abrir', backToTool: '← Abrir el portapapeles online', howTo: 'Cómo usarlo',
    hubH1: 'Copia y comparte texto entre dispositivos', hubIntro: 'Guías paso a paso para el día a día: pasar texto del móvil al PC, copiar y pegar entre iPhone y Windows, compartir la contraseña del wifi y hacerlo todo con seguridad en equipos ajenos.',
    hubMetaTitle: 'Guías: copiar y compartir texto entre dispositivos | WebClipboard', hubMetaDesc: 'Guías prácticas para pasar texto del móvil al PC, copiar y pegar entre iPhone y Windows, compartir la contraseña del wifi y más, sin apps ni cuentas.',
    landingCrumb: 'Portapapeles de iPhone a Windows',
  },
  pt: {
    nav: 'Guias', home: 'Início', hubTitle: 'Guias', popular: 'Guias populares', toc: 'Nesta página', faqEyebrow: 'FAQ', faq: 'Perguntas frequentes',
    moreEyebrow: 'Mais guias', more: 'Guias relacionados', tryNow: 'Experimente agora', open: 'Abrir', backToTool: '← Abrir a área de transferência online', howTo: 'Como usar',
    hubH1: 'Copie e compartilhe texto entre dispositivos', hubIntro: 'Guias passo a passo para o dia a dia: enviar texto do celular para o PC, copiar e colar entre iPhone e Windows, compartilhar a senha do Wi-Fi e fazer tudo isso com segurança em aparelhos de outras pessoas.',
    hubMetaTitle: 'Guias: copiar e compartilhar texto entre dispositivos | WebClipboard', hubMetaDesc: 'Guias práticos para enviar texto do celular para o PC, copiar e colar entre iPhone e Windows, compartilhar a senha do Wi-Fi e mais, sem app e sem conta.',
    landingCrumb: 'Área de transferência do iPhone para o Windows',
  },
};
