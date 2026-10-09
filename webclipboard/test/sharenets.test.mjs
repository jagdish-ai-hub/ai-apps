import { test } from 'node:test';
import assert from 'node:assert/strict';
import { networks, orderFor, ORDER } from '../src/lib/sharenets.js';
import { FILLED, STROKED, iconSvg } from '../src/lib/shareicons.js';

const nets = networks({ email: 'Email', sms: 'SMS' });
const URL_ = 'https://webclipboard.online/es/?utm_source=share&utm_medium=whatsapp';
const TEXT = 'Free clipboard & more: 100% free';

test('every network offered in any language has an icon', () => {
  const ids = new Set(Object.values(ORDER).flat().concat(orderFor('en', true)));
  for (const id of ids) {
    assert.ok(nets[id], `unknown network ${id}`);
    assert.ok(iconSvg(id).startsWith('<svg'), `no icon for ${id}`);
  }
  assert.ok(iconSvg('more').startsWith('<svg') && iconSvg('copy').startsWith('<svg'));
  assert.equal(iconSvg('nope'), '');
});

test('icons are well formed and carry no scripts or external references', () => {
  for (const id of [...Object.keys(FILLED), ...Object.keys(STROKED)]) {
    const svg = iconSvg(id);
    assert.ok(svg.includes('viewBox="0 0 24 24"') && svg.includes('aria-hidden="true"'), id);
    assert.ok(!/<script|href=|xlink|on\w+=/.test(svg), `${id} must not contain scripts or links`);
    assert.ok((svg.match(/</g) || []).length === (svg.match(/>/g) || []).length, `${id} balanced tags`);
  }
  for (const [id, d] of Object.entries(FILLED)) assert.match(d, /^[Mm][\d.\-\s,a-zA-Z]+$/, `${id} path data looks like a path`);
});

test('share links encode the text and url safely', () => {
  const wa = nets.whatsapp.href(URL_, TEXT, 'T');
  assert.ok(wa.startsWith('https://wa.me/?text='));
  assert.equal(decodeURIComponent(wa.split('text=')[1]), `${TEXT} ${URL_}`);
  const tg = new URL(nets.telegram.href(URL_, TEXT, 'T'));
  assert.equal(tg.searchParams.get('url'), URL_);
  assert.equal(tg.searchParams.get('text'), TEXT);
  assert.equal(new URL(nets.reddit.href(URL_, TEXT, 'My title')).searchParams.get('title'), 'My title');
  const mail = nets.email.href(URL_, TEXT, 'Subject here');
  assert.ok(mail.startsWith('mailto:?subject=Subject%20here&body='));
  assert.ok(decodeURIComponent(mail).includes(URL_));
  assert.ok(nets.sms.href(URL_, TEXT, 'T').startsWith('sms:?&body='));
  for (const n of Object.values(nets)) assert.ok(!/\n/.test(n.href(URL_, TEXT, 'T').split('?')[0]), 'no raw newlines in the address part');
});

test('ordering follows the language and hides SMS on desktop', () => {
  assert.equal(orderFor('ja', false)[0], 'line');
  assert.equal(orderFor('ru', true)[1], 'vk');
  assert.deepEqual(orderFor('zh-cn', false), ['weibo', 'email']);
  assert.ok(!orderFor('en', false).includes('sms'));
  assert.ok(orderFor('en', true).includes('sms'));
  assert.equal(orderFor('xx', true)[0], 'whatsapp');
});
