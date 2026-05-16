import React from 'react';

/**
 * Lightweight Markdown-ish renderer for Help articles.
 * Supports: ## H2, - bullets, > callouts, `inline code`, **bold**, blank-line paragraphs.
 * No external deps, no HTML injection (text rendered as React children).
 */
export function HelpMarkdown({ source }: { source: string }) {
  const lines = source.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const renderInline = (text: string): React.ReactNode => {
    // Split by **bold** and `code` while preserving order
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let p = 0;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      const token = m[0];
      if (token.startsWith('**')) {
        parts.push(<strong key={`b${p++}`} className="font-semibold text-foreground">{token.slice(2, -2)}</strong>);
      } else {
        parts.push(<code key={`c${p++}`} className="px-1 py-0.5 rounded bg-muted text-[0.85em] font-mono">{token.slice(1, -1)}</code>);
      }
      last = m.index + token.length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={key++} className="text-lg font-semibold text-foreground mt-6 mb-2">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      blocks.push(
        <div key={key++} className="border-l-2 border-primary/60 bg-primary/5 px-3 py-2 my-3 rounded-sm text-sm text-foreground">
          {renderInline(line.slice(2))}
        </div>
      );
      i++;
      continue;
    }

    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc pl-5 space-y-1 my-2 text-sm text-muted-foreground">
          {items.map((it, idx) => <li key={idx}>{renderInline(it)}</li>)}
        </ul>
      );
      continue;
    }

    // paragraph
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith('## ') && !lines[i].startsWith('- ') && !lines[i].startsWith('> ')) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="text-sm text-muted-foreground leading-relaxed my-2">
        {renderInline(para.join(' '))}
      </p>
    );
  }

  return <div>{blocks}</div>;
}