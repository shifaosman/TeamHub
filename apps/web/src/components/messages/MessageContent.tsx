/** Renders message content with @mentions highlighted (any @word is shown as a mention) */
export function MessageContent({ content }: { content: string; mentions?: string[] }) {
  if (!content) return null;
  const parts: { text: string; isMention: boolean }[] = [];
  const regex = /@(\w+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: content.slice(lastIndex, match.index), isMention: false });
    }
    parts.push({ text: match[0], isMention: true });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push({ text: content.slice(lastIndex), isMention: false });
  }
  if (parts.length === 0) return <span className="whitespace-pre-wrap break-words">{content}</span>;
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((p, i) =>
        p.isMention ? (
          <span key={i} className="font-medium text-primary bg-primary/10 rounded px-0.5">
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </span>
  );
}
