// Languages that have their own guides (written natively, not translated). English guides live at /guides/, others at /<code>/guides/.
export const guideLangs = ['en', 'ja'];

// Interface strings for the guide pages. Kept here (not in src/i18n) because only these languages have guides.
export const guideLabels = {
  en: { nav: 'Guides', home: 'Home', hubTitle: 'Guides', popular: 'Popular guides', toc: 'On this page', faqEyebrow: 'FAQ', faq: 'Frequently asked questions', moreEyebrow: 'More guides', more: 'Related guides', tryNow: 'Try it now', open: 'Open', backToTool: '← Open the online clipboard' },
  ja: { nav: 'ガイド', home: 'ホーム', hubTitle: 'ガイド', popular: '人気のガイド', toc: 'このページの内容', faqEyebrow: 'FAQ', faq: 'よくある質問', moreEyebrow: '関連ガイド', more: '関連するガイド', tryNow: '今すぐ使う', open: '開く', backToTool: '← オンラインクリップボードを開く' },
};
