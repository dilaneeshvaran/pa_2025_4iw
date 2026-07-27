const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);

const count = (text: string, pattern: RegExp): number =>
  (text.match(pattern) ?? []).length;

const closeDanglingEmphasis = (text: string): string => {
  let out = text;
  if (count(out, /`/g) % 2 === 1) out += "`";
  if (count(out, /\*\*/g) % 2 === 1) out += "**";
  if (count(out.replace(/\*\*/g, ""), /\*/g) % 2 === 1) out += "*";
  if (count(out, /(?:^|[\s(])_[^_\n]*$/g) === 1) out += "_";
  return out;
};

export const renderMedibotMarkdown = (raw: string): string => {
  const normalized = raw
    .replace(/\r\n/g, "\n")
    .replace(/^[ \t]*[-*][ \t]+/gm, "• ");

  return escapeHtml(closeDanglingEmphasis(normalized))
    .replace(/\[([^\]\n]+)\]\((?:[^)\n]*)\)/g, "$1")
    .replace(/^#{1,6}[ \t]*(.+)$/gm, "<strong>$1</strong>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/(^|[\s(])_([^_\n]+)_(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>")
    .replace(
      /`([^`\n]+)`/g,
      '<code class="rounded bg-black/5 px-1 py-0.5 text-[0.9em] dark:bg-white/10">$1</code>',
    );
};
