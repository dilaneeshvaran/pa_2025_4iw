import puppeteer from 'puppeteer'

export const PDF_THEME = {
  orange: '#D96F00',
  orangeSoft: '#fff3e6',
  orangeBorder: '#ffddb3',
  green: '#00804A',
  greenSoft: '#e6f5ee',
  greenBorder: '#b3e0cc',
  ink: '#111827',
  body: '#374151',
  muted: '#6b7280',
  faint: '#9ca3af',
  border: '#E5E3DC',
  hairline: '#f3f4f6',
  surface: '#ffffff',
  canvas: '#ffffff',
  zebra: '#fafaf9',
  headRow: '#f9fafb',
  danger: '#dc2626',
  dangerSoft: '#fef2f2',
  dangerBorder: '#fecaca',
} as const

export type PdfTone = 'orange' | 'green' | 'neutral' | 'danger'

const TONES: Record<PdfTone, { fg: string; bg: string; border: string }> = {
  orange: {
    fg: PDF_THEME.orange,
    bg: PDF_THEME.orangeSoft,
    border: PDF_THEME.orangeBorder,
  },
  green: {
    fg: PDF_THEME.green,
    bg: PDF_THEME.greenSoft,
    border: PDF_THEME.greenBorder,
  },
  neutral: { fg: PDF_THEME.muted, bg: '#f3f4f6', border: '#e5e7eb' },
  danger: {
    fg: PDF_THEME.danger,
    bg: PDF_THEME.dangerSoft,
    border: PDF_THEME.dangerBorder,
  },
}

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function formatPdfDate(value?: Date | string | null): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatPdfDateTime(value?: Date | string | null): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatPdfAmount(
  value?: number | null,
  currency = 'FCFA',
): string {
  const amount = Number(value ?? 0)
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

export interface PdfMetaItem {
  label: string
  value: string
}

export interface PdfDocumentOptions {
  title: string
  documentLabel: string
  headline: string
  subline?: string
  meta?: PdfMetaItem[]
  bodyHtml: string
  footerNote?: string
}

export function buildPdfHtml(options: PdfDocumentOptions): string {
  const metaHtml = options.meta?.length
    ? `<div class="doc-meta">${options.meta
        .map(
          (item) => `<div class="doc-meta-item">
            <span class="doc-meta-label">${escapeHtml(item.label)}</span>
            <span class="doc-meta-value">${escapeHtml(item.value)}</span>
          </div>`,
        )
        .join('')}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(options.title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: ${PDF_THEME.body};
    background: ${PDF_THEME.canvas};
    font-size: 11px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body { padding: 0 16mm; }

  .brand-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
  }
  .logo {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.4px;
    line-height: 1.1;
  }
  .logo .a { color: ${PDF_THEME.orange}; }
  .logo .b { color: ${PDF_THEME.green}; }
  .tagline {
    margin-top: 2px;
    font-size: 8px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: ${PDF_THEME.faint};
    font-weight: 600;
  }
  .doc-label {
    text-align: right;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: ${PDF_THEME.orange};
  }
  .doc-label small {
    display: block;
    margin-top: 3px;
    font-size: 8px;
    font-weight: 500;
    letter-spacing: 0.4px;
    text-transform: none;
    color: ${PDF_THEME.faint};
  }
  .accent-rule {
    display: flex;
    height: 3px;
    margin: 12px 0 20px;
    border-radius: 2px;
    overflow: hidden;
  }
  .accent-rule i { display: block; height: 3px; }
  .accent-rule i:first-child { width: 55%; background: ${PDF_THEME.orange}; }
  .accent-rule i:last-child { width: 45%; background: ${PDF_THEME.green}; }

  h1.headline {
    font-size: 19px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: ${PDF_THEME.ink};
  }
  .subline {
    margin-top: 4px;
    font-size: 11px;
    color: ${PDF_THEME.muted};
  }

  .doc-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 28px;
    margin-top: 16px;
    padding: 14px 18px;
    background: ${PDF_THEME.headRow};
    border: 1px solid ${PDF_THEME.border};
    border-radius: 12px;
  }
  .doc-meta-item { min-width: 120px; }
  .doc-meta-label {
    display: block;
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 1.1px;
    text-transform: uppercase;
    color: ${PDF_THEME.faint};
  }
  .doc-meta-value {
    display: block;
    margin-top: 2px;
    font-size: 11px;
    font-weight: 600;
    color: ${PDF_THEME.ink};
  }

  .section {
    margin-top: 20px;
    padding: 18px;
    background: ${PDF_THEME.surface};
    border: 1px solid ${PDF_THEME.border};
    border-radius: 14px;
  }
  /* long sections may split across pages, but never right after the title
     and never through a table row or a compact block */
  .section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
    break-after: avoid;
  }
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    color: ${PDF_THEME.ink};
  }
  .section-title .bar {
    display: inline-block;
    width: 3px;
    height: 13px;
    border-radius: 2px;
  }
  .section-subtitle { font-size: 9.5px; color: ${PDF_THEME.faint}; }

  .stat-grid {
    display: grid;
    gap: 10px;
    break-inside: avoid;
  }
  .stat {
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid;
  }
  .stat-label {
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.9px;
    text-transform: uppercase;
  }
  .stat-value {
    margin-top: 4px;
    font-size: 17px;
    font-weight: 700;
    color: ${PDF_THEME.ink};
    letter-spacing: -0.3px;
  }
  /* amounts need a smaller size to stay on one line inside a tile */
  .stat-value.sm { font-size: 13px; letter-spacing: -0.1px; }
  .stat-hint { margin-top: 1px; font-size: 8.5px; color: ${PDF_THEME.faint}; }

  .kv { display: flex; flex-wrap: wrap; gap: 10px 20px; break-inside: avoid; }
  .kv-item { flex: 1 1 168px; min-width: 168px; }
  .kv-label {
    display: block;
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: ${PDF_THEME.faint};
  }
  .kv-value {
    display: block;
    margin-top: 1px;
    font-size: 11px;
    color: ${PDF_THEME.ink};
    word-break: break-word;
  }

  table.data {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid ${PDF_THEME.hairline};
    border-radius: 10px;
    overflow: hidden;
  }
  table.data thead { display: table-header-group; }
  table.data tbody tr { break-inside: avoid; }
  table.data thead th {
    background: ${PDF_THEME.headRow};
    padding: 8px 10px;
    text-align: left;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.9px;
    text-transform: uppercase;
    color: ${PDF_THEME.muted};
    border-bottom: 1px solid ${PDF_THEME.border};
  }
  table.data tbody td {
    padding: 8px 10px;
    font-size: 10px;
    color: ${PDF_THEME.body};
    border-bottom: 1px solid ${PDF_THEME.hairline};
    vertical-align: top;
  }
  table.data tbody tr:nth-child(even) td { background: ${PDF_THEME.zebra}; }
  table.data tbody tr:last-child td { border-bottom: none; }
  table.data .num { text-align: right; font-variant-numeric: tabular-nums; }
  table.data .strong { font-weight: 600; color: ${PDF_THEME.ink}; }

  .badge {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 999px;
    border: 1px solid;
    font-size: 8.5px;
    font-weight: 600;
    white-space: nowrap;
  }
  .empty {
    padding: 16px;
    text-align: center;
    font-size: 10px;
    color: ${PDF_THEME.faint};
    background: ${PDF_THEME.headRow};
    border: 1px dashed ${PDF_THEME.border};
    border-radius: 10px;
  }
  .note {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px solid ${PDF_THEME.hairline};
    font-size: 8.5px;
    line-height: 1.6;
    color: ${PDF_THEME.faint};
    text-align: center;
  }
  .prose { font-size: 10px; color: ${PDF_THEME.body}; white-space: pre-wrap; }
  .prose + .prose { margin-top: 8px; }
  /* repeated entries inside a section (one per consultation, ...) */
  .record { break-inside: avoid; }
  .record + .record {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid ${PDF_THEME.hairline};
  }
  .record-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
  }
  .record-head strong { font-size: 11px; color: ${PDF_THEME.ink}; }
  .record-head span { font-size: 9.5px; color: ${PDF_THEME.muted}; }
  .record-vitals { margin-bottom: 6px; }
  .chip-list { display: flex; flex-wrap: wrap; gap: 5px; }
  .chart { width: 100%; }
</style>
</head>
<body>
  <div class="brand-row">
    <div>
      <div class="logo"><span class="a">Medi</span><span class="b">côte</span></div>
      <div class="tagline">Plateforme de santé numérique</div>
    </div>
    <div class="doc-label">
      ${escapeHtml(options.documentLabel)}
      <small>Généré le ${formatPdfDateTime(new Date())}</small>
    </div>
  </div>
  <div class="accent-rule"><i></i><i></i></div>

  <h1 class="headline">${escapeHtml(options.headline)}</h1>
  ${options.subline ? `<p class="subline">${escapeHtml(options.subline)}</p>` : ''}
  ${metaHtml}

  ${options.bodyHtml}

  ${
    options.footerNote
      ? `<p class="note">${escapeHtml(options.footerNote)}</p>`
      : ''
  }
</body>
</html>`
}

export function pdfSection(options: {
  title: string
  subtitle?: string
  bodyHtml: string
  tone?: PdfTone
}): string {
  const tone = TONES[options.tone ?? 'orange']
  return `<section class="section">
    <div class="section-head">
      <h2 class="section-title"><span class="bar" style="background:${tone.fg}"></span>${escapeHtml(options.title)}</h2>
      ${options.subtitle ? `<span class="section-subtitle">${escapeHtml(options.subtitle)}</span>` : ''}
    </div>
    ${options.bodyHtml}
  </section>`
}

export function pdfStatGrid(
  items: Array<{
    label: string
    value: string
    hint?: string
    tone?: PdfTone
    smallValue?: boolean
  }>,
  options: { columns?: number } = {},
): string {
  if (!items.length) return pdfEmpty('Aucun indicateur disponible')
  const columns = Math.max(1, options.columns ?? Math.min(items.length, 4))
  return `<div class="stat-grid" style="grid-template-columns:repeat(${columns},1fr)">${items
    .map((item) => {
      const tone = TONES[item.tone ?? 'orange']
      return `<div class="stat" style="background:${tone.bg};border-color:${tone.border}">
        <div class="stat-label" style="color:${tone.fg}">${escapeHtml(item.label)}</div>
        <div class="stat-value${item.smallValue ? ' sm' : ''}">${escapeHtml(item.value)}</div>
        ${item.hint ? `<div class="stat-hint">${escapeHtml(item.hint)}</div>` : ''}
      </div>`
    })
    .join('')}</div>`
}

export function pdfRecord(options: {
  title: string
  aside?: string
  chipsHtml?: string
  bodyHtml: string
}): string {
  return `<div class="record">
    <div class="record-head">
      <strong>${escapeHtml(options.title)}</strong>
      ${options.aside ? `<span>${escapeHtml(options.aside)}</span>` : ''}
    </div>
    ${options.chipsHtml ? `<div class="record-vitals">${options.chipsHtml}</div>` : ''}
    ${options.bodyHtml}
  </div>`
}

export function pdfKeyValues(items: PdfMetaItem[]): string {
  if (!items.length) return pdfEmpty('Aucune information renseignée')
  return `<div class="kv">${items
    .map(
      (item) => `<div class="kv-item">
        <span class="kv-label">${escapeHtml(item.label)}</span>
        <span class="kv-value">${escapeHtml(item.value || '—')}</span>
      </div>`,
    )
    .join('')}</div>`
}

export interface PdfTableColumn {
  header: string
  numeric?: boolean
  strong?: boolean
  width?: string
}

export function pdfTable(options: {
  columns: PdfTableColumn[]
  rows: string[][]
  emptyText?: string
  rawCells?: boolean
}): string {
  if (!options.rows.length) {
    return pdfEmpty(options.emptyText ?? 'Aucune donnée')
  }
  const head = options.columns
    .map(
      (col) =>
        `<th${col.numeric ? ' class="num"' : ''}${col.width ? ` style="width:${col.width}"` : ''}>${escapeHtml(col.header)}</th>`,
    )
    .join('')

  const body = options.rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell, i) => {
            const col = options.columns[i]
            const classes = [
              col?.numeric ? 'num' : '',
              col?.strong ? 'strong' : '',
            ]
              .filter(Boolean)
              .join(' ')
            const content = options.rawCells ? cell : escapeHtml(cell)
            return `<td${classes ? ` class="${classes}"` : ''}>${content || '—'}</td>`
          })
          .join('')}</tr>`,
    )
    .join('')

  return `<table class="data"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

export function pdfBadge(text: string, tone: PdfTone = 'neutral'): string {
  const t = TONES[tone]
  return `<span class="badge" style="color:${t.fg};background:${t.bg};border-color:${t.border}">${escapeHtml(text)}</span>`
}

export function pdfChips(values: string[], tone: PdfTone = 'neutral'): string {
  if (!values.length) return `<span class="kv-value">—</span>`
  return `<div class="chip-list">${values.map((v) => pdfBadge(v, tone)).join('')}</div>`
}

export function pdfEmpty(text: string): string {
  return `<div class="empty">${escapeHtml(text)}</div>`
}

export function pdfProse(
  paragraphs: Array<{ label?: string; text: string }>,
): string {
  const filled = paragraphs.filter((p) => p.text && p.text.trim().length > 0)
  if (!filled.length) return pdfEmpty('Aucun détail enregistré')
  return filled
    .map(
      (p) =>
        `<div class="prose">${
          p.label ? `<span class="kv-label">${escapeHtml(p.label)}</span>` : ''
        }${escapeHtml(p.text)}</div>`,
    )
    .join('')
}

export function pdfLineChart(
  points: Array<{ label: string; value: number }>,
  options: { height?: number; tone?: PdfTone } = {},
): string {
  if (!points.length) return pdfEmpty('Pas de données sur cette période')

  const tone = TONES[options.tone ?? 'orange']
  const width = 700
  const height = options.height ?? 220
  const padLeft = 34
  const padRight = 12
  const padTop = 12
  const padBottom = 30
  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom

  const maxValue = Math.max(...points.map((p) => p.value), 1)
  const step = Math.max(1, Math.ceil(maxValue / 4))
  const axisMax = step * 4

  const x = (i: number) =>
    points.length === 1
      ? padLeft + plotW / 2
      : padLeft + (i * plotW) / (points.length - 1)
  const y = (value: number) => padTop + plotH - (value / axisMax) * plotH

  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const value = step * i
    const gy = y(value)
    return `<line x1="${padLeft}" y1="${gy.toFixed(1)}" x2="${width - padRight}" y2="${gy.toFixed(1)}" stroke="${PDF_THEME.hairline}" stroke-width="1" />
      <text x="${padLeft - 6}" y="${(gy + 3).toFixed(1)}" text-anchor="end" font-size="8" fill="${PDF_THEME.faint}">${value}</text>`
  }).join('')

  const linePath = points
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`,
    )
    .join(' ')
  const areaPath = `${linePath} L${x(points.length - 1).toFixed(1)},${(padTop + plotH).toFixed(1)} L${x(0).toFixed(1)},${(padTop + plotH).toFixed(1)} Z`

  const dots = points
    .map(
      (p, i) =>
        `<circle cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="2.6" fill="#ffffff" stroke="${tone.fg}" stroke-width="1.6" />`,
    )
    .join('')

  const maxLabels = 8
  const stride = Math.ceil(points.length / maxLabels)
  const xLabels = points
    .map((p, i) => {
      if (i % stride !== 0 && i !== points.length - 1) return ''
      return `<text x="${x(i).toFixed(1)}" y="${height - 10}" text-anchor="middle" font-size="8" fill="${PDF_THEME.faint}">${escapeHtml(p.label)}</text>`
    })
    .join('')

  return `<svg class="chart" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img">
    <defs>
      <linearGradient id="pdfChartFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${tone.fg}" stop-opacity="0.22" />
        <stop offset="100%" stop-color="${tone.fg}" stop-opacity="0.02" />
      </linearGradient>
    </defs>
    ${gridLines}
    <path d="${areaPath}" fill="url(#pdfChartFill)" />
    <path d="${linePath}" fill="none" stroke="${tone.fg}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    ${dots}
    ${xLabels}
  </svg>`
}

export interface RenderPdfOptions {
  paginated?: boolean
  margin?: { top: string; right: string; bottom: string; left: string }
}

const FOOTER_TEMPLATE = `<div style="width:100%;padding:0 16mm;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:7.5px;color:${PDF_THEME.faint};display:flex;align-items:center;justify-content:space-between;">
  <span>MediCôte &mdash; Plateforme de santé numérique</span>
  <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
</div>`

export async function renderPdf(
  html: string,
  options: RenderPdfOptions = {},
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      ...(options.paginated
        ? {
            displayHeaderFooter: true,
            headerTemplate: '<span></span>',
            footerTemplate: FOOTER_TEMPLATE,
            margin: options.margin ?? {
              top: '12mm',
              right: '0',
              bottom: '16mm',
              left: '0',
            },
          }
        : options.margin
          ? { margin: options.margin }
          : {}),
    })
    return Buffer.from(buffer)
  } finally {
    await browser.close()
  }
}

export async function renderThemedPdf(
  options: PdfDocumentOptions,
): Promise<Buffer> {
  return renderPdf(buildPdfHtml(options), { paginated: true })
}
