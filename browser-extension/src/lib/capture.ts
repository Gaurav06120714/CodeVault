import type { CapturedSubmission, CaptureMessage, IngestResponse } from '../types';

// Send a captured submission to the background worker (which posts it to /api/ingest).
// Content scripts never hold the JWT — only the background does.
export function sendCapture(submission: CapturedSubmission): void {
  // Guard against a stale content script whose extension context was invalidated by a reload
  // (`chrome.runtime.sendMessage` then throws synchronously, not via the promise).
  try {
    if (!chrome.runtime?.id) return;
    const msg: CaptureMessage = { type: 'capture', submission };
    chrome.runtime
      .sendMessage(msg)
      .then((res: IngestResponse | undefined) => {
        if (res?.ok) console.info('[CodeVault] synced', submission.slug, res);
        else console.warn('[CodeVault] capture not sent:', res?.error);
      })
      .catch((e) => console.warn('[CodeVault] capture message failed', e));
  } catch {
    /* extension context invalidated — reload the page to re-inject a fresh script */
  }
}

export function text(el: Element | null | undefined): string {
  return (el?.textContent ?? '').trim();
}

// One-shot guard: don't re-capture the same accepted submission on a page repeatedly.
const seen = new Set<string>();
export function once(key: string): boolean {
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}

// Light HTML → Markdown for building question.md (GitHub also renders raw HTML, but this
// gives cleaner diffs). Shared across platform content scripts.
export function htmlToMarkdown(html: string): string {
  return html
    // Drop <style>/<script>/<head> blocks entirely (their inner text is CSS/JS, not content —
    // e.g. HackerRank ships MathJax <style> that otherwise leaks into the markdown).
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<\/?(strong|b)>/gi, '**')
    .replace(/<\/?(em|i)>/gi, '_')
    .replace(/<pre[^>]*>/gi, '\n```\n')
    .replace(/<\/pre>/gi, '\n```\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/(p|div|ul|ol|h[1-6]|section)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Read the Monaco editor's code if present (LeetCode/CodeChef use Monaco).
export function readMonaco(): string | null {
  const w = window as unknown as { monaco?: { editor?: { getModels?: () => Array<{ getValue(): string }> } } };
  const models = w.monaco?.editor?.getModels?.();
  if (models && models.length > 0) return models[0]!.getValue();
  return null;
}
