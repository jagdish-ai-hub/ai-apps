// Builds real .docx (Word) files in the browser, with no server and no dependency beyond marked (for Markdown).
// A .docx is a ZIP of XML parts. We write the minimum Word, LibreOffice and Google Docs need: styles, numbering, hyperlinks.
import { zip } from './zip.js';
import { lex, decode, safeHref } from './md.js';

export const FONTS = {
  sans: { name: 'Calibri', label: 'Sans-serif' },
  serif: { name: 'Times New Roman', label: 'Serif' },
  mono: { name: 'Courier New', label: 'Monospace' },
};
export const PAGES = { a4: [11906, 16838], letter: [12240, 15840] };
export const MARGINS = { narrow: 720, normal: 1440, wide: 1800 }; // twips: 0.5", 1", 1.25"

export const DEFAULTS = { font: 'sans', size: 12, page: 'a4', margin: 'normal' };
const norm = (o = {}) => {
  const font = FONTS[o.font] ? o.font : DEFAULTS.font;
  const size = Math.min(24, Math.max(8, Number(o.size) || DEFAULTS.size));
  const page = PAGES[o.page] ? o.page : DEFAULTS.page;
  const margin = MARGINS[o.margin] ? o.margin : DEFAULTS.margin;
  return { font, size, page, margin };
};

/** Escape for XML text and attributes, dropping characters XML 1.0 forbids (they would make Word report a corrupt file). */
export const xml = (s) =>
  String(s)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------- runs and paragraphs

function run(text, f = {}) {
  if (text === '') return '';
  const pr = [];
  if (f.link) pr.push('<w:rStyle w:val="Hyperlink"/>');
  if (f.code) pr.push('<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>');
  if (f.bold) pr.push('<w:b/>');
  if (f.italic) pr.push('<w:i/>');
  if (f.strike) pr.push('<w:strike/>');
  if (f.code) pr.push('<w:sz w:val="' + Math.round(f.base * 0.9 * 2) + '"/>', '<w:shd w:val="clear" w:color="auto" w:fill="EDEDED"/>');
  const rpr = pr.length ? `<w:rPr>${pr.join('')}</w:rPr>` : '';
  // Tabs and line breaks become Word's own elements, everything else is literal text.
  const parts = String(text).split(/(\t|\r?\n)/);
  const body = parts.map((p) => (p === '\t' ? '<w:tab/>' : /^\r?\n$/.test(p) ? '<w:br/>' : p ? `<w:t xml:space="preserve">${xml(p)}</w:t>` : '')).join('');
  return `<w:r>${rpr}${body}</w:r>`;
}

const para = (runs, ppr = '') => `<w:p>${ppr ? `<w:pPr>${ppr}</w:pPr>` : ''}${runs}</w:p>`;

// ---------------------------------------------------------------- Markdown tokens -> WordprocessingML

function makeCtx(base) {
  return { base, links: [], lists: [] };
}

function inlineRuns(tokens, ctx, f = {}) {
  return (tokens || []).map((t) => {
    const ff = { ...f, base: ctx.base };
    switch (t.type) {
      case 'strong': return inlineRuns(t.tokens, ctx, { ...f, bold: true });
      case 'em': return inlineRuns(t.tokens, ctx, { ...f, italic: true });
      case 'del': return inlineRuns(t.tokens, ctx, { ...f, strike: true });
      case 'codespan': return run(decode(t.text), { ...ff, code: true });
      case 'br': return '<w:r><w:br/></w:r>';
      case 'image': return run(`[image: ${decode(t.text || '')}]`, ff);
      case 'link': {
        const href = safeHref(t.href);
        if (!href) return inlineRuns(t.tokens, ctx, f);
        ctx.links.push(href);
        return `<w:hyperlink r:id="rIdL${ctx.links.length}" w:history="1">${inlineRuns(t.tokens, ctx, { ...f, link: true })}</w:hyperlink>`;
      }
      case 'escape': return run(t.text, ff);
      case 'html': return run(t.text ?? t.raw, ff);
      case 'text': return t.tokens ? inlineRuns(t.tokens, ctx, f) : run(decode(t.text), ff);
      default: return run(decode(t.text ?? t.raw ?? ''), ff);
    }
  }).join('');
}

function blocks(tokens, ctx, o = {}) {
  const { quote = 0, list = null } = o;
  const qpr = quote ? `<w:pBdr><w:left w:val="single" w:sz="18" w:space="10" w:color="9CA3AF"/></w:pBdr><w:ind w:left="${360 + quote * 360}"/>` : '';
  return (tokens || []).map((t) => {
    switch (t.type) {
      case 'heading': return para(inlineRuns(t.tokens, ctx), `<w:pStyle w:val="Heading${Math.min(t.depth, 6)}"/>${qpr}`);
      case 'paragraph':
      case 'text': {
        const runs = t.tokens ? inlineRuns(t.tokens, ctx) : run(decode(t.text), { base: ctx.base });
        if (list) return para(runs, `<w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="${Math.min(list.level, 8)}"/><w:numId w:val="${list.numId}"/></w:numPr>`);
        return para(runs, qpr);
      }
      case 'code':
        return para(run(t.text.replace(/\n$/, ''), { base: ctx.base, code: false }), `<w:pStyle w:val="Code"/>${quote ? `<w:ind w:left="${360 + quote * 360}"/>` : ''}`);
      case 'blockquote': return blocks(t.tokens, ctx, { quote: quote + 1 });
      case 'hr': return para('', '<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="1" w:color="9CA3AF"/></w:pBdr><w:spacing w:before="120" w:after="120"/>');
      case 'list': return listXml(t, ctx, quote, list ? list.level + 1 : 0);
      case 'table': return tableXml(t, ctx);
      case 'html': return para(run((t.text ?? t.raw).trim(), { base: ctx.base }), qpr);
      case 'space': case 'def': return '';
      default: return t.text ? para(run(decode(t.text), { base: ctx.base }), qpr) : '';
    }
  }).join('');
}

function listXml(t, ctx, quote, level) {
  let numId = 1; // bullets share one definition; every ordered list gets its own so numbering restarts at 1
  if (t.ordered) {
    numId = 2 + ctx.lists.length;
    ctx.lists.push(Number(t.start) || 1);
  }
  return t.items.map((item) => {
    const mark = item.task ? run(item.checked ? '☑ ' : '☐ ', { base: ctx.base }) : '';
    let first = true;
    return (item.tokens || []).map((c) => {
      if (c.type === 'text' || c.type === 'paragraph') {
        const xmlp = blocks([c], ctx, { quote, list: { level, numId } });
        const out = first && mark ? xmlp.replace(/(<\/w:pPr>)/, '$1' + mark) : xmlp;
        first = false;
        return out;
      }
      if (c.type === 'list') return listXml(c, ctx, quote, level + 1);
      return blocks([c], ctx, { quote });
    }).join('');
  }).join('');
}

function tableXml(t, ctx) {
  const cols = Math.max(1, t.header.length);
  const cell = (c, head) => {
    const jc = c.align && c.align !== 'left' ? `<w:jc w:val="${c.align}"/>` : '';
    const runs = inlineRuns(c.tokens, ctx, head ? { bold: true } : {});
    return `<w:tc><w:tcPr><w:tcW w:w="${Math.floor(5000 / cols)}" w:type="pct"/>${head ? '<w:shd w:val="clear" w:color="auto" w:fill="EDEDED"/>' : ''}</w:tcPr>${para(runs, `<w:spacing w:before="40" w:after="40"/>${jc}`)}</w:tc>`;
  };
  const row = (cells, head) => `<w:tr>${head ? '<w:trPr><w:tblHeader/></w:trPr>' : ''}${cells.map((c) => cell(c, head)).join('')}</w:tr>`;
  const grid = Array.from({ length: cols }, () => '<w:gridCol/>').join('');
  return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="pct"/></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${row(t.header, true)}${t.rows.map((r) => row(r, false)).join('')}</w:tbl>${para('')}`;
}

// ---------------------------------------------------------------- package parts

const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

function stylesXml(o) {
  const f = FONTS[o.font].name;
  const half = o.size * 2;
  const heading = (n, mult) => `<w:style w:type="paragraph" w:styleId="Heading${n}"><w:name w:val="heading ${n}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="${n === 1 ? 360 : 240}" w:after="120"/><w:outlineLvl w:val="${n - 1}"/></w:pPr><w:rPr><w:b/><w:sz w:val="${Math.round(half * mult)}"/></w:rPr></w:style>`;
  return `${HEAD}<w:styles ${NS}>
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${f}" w:hAnsi="${f}" w:cs="${f}"/><w:sz w:val="${half}"/><w:szCs w:val="${half}"/><w:lang w:val="en-US" w:eastAsia="ja-JP" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
${heading(1, 1.9)}${heading(2, 1.5)}${heading(3, 1.25)}${heading(4, 1.1)}${heading(5, 1)}${heading(6, 1)}
<w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/></w:style>
<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:basedOn w:val="DefaultParagraphFont"/><w:uiPriority w:val="99"/><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="34"/><w:qFormat/><w:pPr><w:spacing w:after="60"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F3F3F3"/><w:spacing w:before="60" w:after="160" w:line="260" w:lineRule="auto"/><w:ind w:left="144" w:right="144"/></w:pPr><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/><w:sz w:val="${Math.round(half * 0.9)}"/></w:rPr></w:style>
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/><w:uiPriority w:val="39"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="9CA3AF"/><w:left w:val="single" w:sz="4" w:space="0" w:color="9CA3AF"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="9CA3AF"/><w:right w:val="single" w:sz="4" w:space="0" w:color="9CA3AF"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="9CA3AF"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="9CA3AF"/></w:tblBorders></w:tblPr></w:style>
</w:styles>`;
}

function numberingXml(lists) {
  const lvl = (i, fmt, text) => `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="${text}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720 + i * 360}" w:hanging="360"/></w:pPr></w:lvl>`;
  const bullets = Array.from({ length: 9 }, (_, i) => lvl(i, 'bullet', ['•', '◦', '▪'][i % 3])).join('');
  const fmts = ['decimal', 'lowerLetter', 'lowerRoman'];
  const nums = Array.from({ length: 9 }, (_, i) => lvl(i, fmts[i % 3], `%${i + 1}.`)).join('');
  const instances = lists.map((start, i) => `<w:num w:numId="${i + 2}"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="${start}"/></w:lvlOverride></w:num>`).join('');
  return `${HEAD}<w:numbering ${NS}><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>${bullets}</w:abstractNum><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>${nums}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>${instances}</w:numbering>`;
}

function build(bodyXml, ctx, o) {
  const [w, h] = PAGES[o.page];
  const m = MARGINS[o.margin];
  const sect = `<w:sectPr><w:pgSz w:w="${w}" w:h="${h}"/><w:pgMar w:top="${m}" w:right="${m}" w:bottom="${m}" w:left="${m}" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>`;
  const document = `${HEAD}<w:document ${NS}><w:body>${bodyXml || para('')}${sect}</w:body></w:document>`;
  const rels = [
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>',
    ...ctx.links.map((href, i) => `<Relationship Id="rIdL${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${xml(href)}" TargetMode="External"/>`),
  ].join('');
  return zip([
    { name: '[Content_Types].xml', data: `${HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>` },
    { name: '_rels/.rels', data: `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
    { name: 'word/document.xml', data: document },
    { name: 'word/styles.xml', data: stylesXml(o) },
    { name: 'word/numbering.xml', data: numberingXml(ctx.lists) },
    { name: 'word/_rels/document.xml.rels', data: `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>` },
  ]);
}

// ---------------------------------------------------------------- public API

/** Plain text -> .docx. Every line becomes a paragraph; blank lines stay as empty paragraphs. */
export function textToDocx(text, options) {
  const o = norm(options);
  const ctx = makeCtx(o.size);
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  const body = lines.map((l) => para(run(l, { base: o.size }), '<w:spacing w:after="0"/>')).join('');
  return build(body, ctx, o);
}

/** Markdown -> .docx with headings, emphasis, lists, links, code, quotes and tables as real Word formatting. */
export function markdownToDocx(md, options) {
  const o = norm(options);
  const ctx = makeCtx(o.size);
  const body = blocks(lex(md), ctx);
  return build(body, ctx, o);
}
