import { rows } from '../../lib/langdata';
import { toCsv } from '../../lib/tokenstats.js';

export function GET() {
  return new Response(toCsv(rows), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
}
