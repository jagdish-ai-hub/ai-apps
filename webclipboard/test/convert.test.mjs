import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crc32, zip } from '../src/lib/zip.js';
import { textToDocx, markdownToDocx, xml } from '../src/lib/docx.js';
import { markdownToHtml, markdownToPlain, decode, safeHref } from '../src/lib/md.js';

const py = spawnSync('python3', ['--version']).status === 0;

test('crc32 matches the known check value', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('zip: starts with a local header and ends with an end-of-central-directory record', () => {
  const z = zip([{ name: 'a.txt', data: 'hello' }, { name: 'dir/b.txt', data: 'world' }]);
  assert.equal(new DataView(z.buffer).getUint32(0, true), 0x04034b50);
  assert.equal(new DataView(z.buffer).getUint32(z.length - 22, true), 0x06054b50);
});

test('xml(): escapes markup and drops characters that are illegal in XML 1.0', () => {
  assert.equal(xml('a<b>&"c"\u0001\u000b￾'), 'a&lt;b&gt;&amp;&quot;c&quot;');
});

test('markdownToHtml: escapes raw HTML, drops unsafe links, shows images as text', () => {
  const html = markdownToHtml('# Hi <script>alert(1)</script>\n\n[x](javascript:alert(1)) [ok](https://example.com/?a=1&b=2) ![alt](http://evil/x.png)\n\n<img src=x onerror=alert(1)>');
  assert.ok(!/<script|<img|onerror=|javascript:/i.test(html.replace(/&lt;[^]*?&gt;/g, '')), html);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('href="https://example.com/?a=1&amp;b=2"'));
  assert.ok(html.includes('[image: alt]'));
});

test('markdownToHtml: structure (headings, nested lists, tasks, tables, code, quotes)', () => {
  const html = markdownToHtml('# T\n\n- a\n  - b\n- [x] done\n\n1. one\n2. two\n\n| h1 | h2 |\n|---|:-:|\n| 1 | 2 |\n\n> q\n\n```\ncode <b>\n```\n');
  for (const frag of ['<h1>T</h1>', '<ul><li>a<ul><li>b</li></ul></li>', 'type="checkbox" disabled checked', '<ol>', '<th style="text-align:center">h2</th>', '<blockquote>', '<pre><code>code &lt;b&gt;']) assert.ok(html.includes(frag), frag);
});

test('markdownToPlain: removes syntax, keeps text', () => {
  const t = markdownToPlain('# Title\n\nSome **bold** and `code` with [a link](https://x.y).\n\n- one\n- [x] done\n\n1. first');
  assert.ok(t.startsWith('Title'));
  assert.ok(t.includes('Some bold and code with a link.'));
  assert.ok(t.includes('• one') && t.includes('• ☑ done') && t.includes('1. first'));
  assert.ok(!/[*#`\[\]]/.test(t));
});

test('decode and safeHref', () => {
  assert.equal(decode('&amp; &lt; &#39; &#x41; &nbsp;'), '& < \' A  ');
  assert.equal(safeHref('JavaScript:alert(1)'), null);
  assert.equal(safeHref('data:text/html,x'), null);
  assert.equal(safeHref('mailto:a@b.c'), 'mailto:a@b.c');
});

const MD = `# Title & <b>

Some *italic*, **bold**, ~~strike~~, \`code\`, a [link](https://example.com/a?b=1&c=2) and 日本語。

- one
  - nested
- [x] done

1. first
2. second

> quote

\`\`\`
const a = 1;
\`\`\`

| a | b |
|---|:-:|
| 1 | 2 |

---
`;

test('docx files are valid zips whose XML parts all parse, and python-docx can read them', { skip: !py && 'python3 not available' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'docx-'));
  const files = {
    'md.docx': markdownToDocx(MD, { font: 'serif', size: 11, page: 'letter', margin: 'wide' }),
    'txt.docx': textToDocx('Line one\n\n\tTabbed  line\nこんにちは \u0001 & <x>', {}),
    'empty.docx': textToDocx('', {}),
  };
  for (const [n, b] of Object.entries(files)) writeFileSync(join(dir, n), b);
  const script = `
import sys, zipfile, xml.dom.minidom, json
out = {}
for n in ['md.docx','txt.docx','empty.docx']:
    z = zipfile.ZipFile(sys.argv[1] + '/' + n)
    assert z.testzip() is None, n
    for name in z.namelist(): xml.dom.minidom.parseString(z.read(name))
    entry = {'parts': z.namelist()}
    try:
        import docx
        d = docx.Document(sys.argv[1] + '/' + n)
        entry['paras'] = [[p.style.name, p.text] for p in d.paragraphs]
        entry['tables'] = len(d.tables)
        s = d.sections[0]
        entry['page'] = [s.page_width, s.page_height, s.left_margin]
    except ImportError:
        entry['paras'] = None
    out[n] = entry
print(json.dumps(out, ensure_ascii=False))`;
  const res = JSON.parse(execFileSync('python3', ['-c', script, dir]).toString());
  for (const e of Object.values(res)) for (const part of ['[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'word/styles.xml', 'word/numbering.xml', 'word/_rels/document.xml.rels']) assert.ok(e.parts.includes(part), part);
  const md = res['md.docx'];
  if (md.paras) {
    const styles = md.paras.map((p) => p[0]);
    assert.equal(md.paras[0][0], 'Heading 1');
    assert.equal(md.paras[0][1], 'Title & <b>');
    assert.ok(styles.filter((s) => s === 'List Paragraph').length >= 5, 'list items');
    assert.ok(styles.includes('Code'));
    assert.equal(md.tables, 1);
    assert.deepEqual(md.page, [7772400, 10058400, 1143000], 'US Letter with wide (1.25 in) margins');
    assert.ok(md.paras.some((p) => p[1].includes('日本語')));
    assert.ok(md.paras.some((p) => p[1] === 'Some italic, bold, strike, code, a link and 日本語。'));
    const tx = res['txt.docx'].paras.map((p) => p[1]);
    assert.deepEqual(tx, ['Line one', '', '\tTabbed  line', 'こんにちは  & <x>']);
    assert.equal(res['empty.docx'].paras.length, 1);
  }
});
