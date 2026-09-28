import React from 'react'

function parseInlineMarkdown(text: string, isUser: boolean): React.ReactNode[] {
  // Split by **bold**, `code`, and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong
          key={idx}
          className={isUser ? 'font-bold text-white' : 'font-semibold text-slate-900'}
        >
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className={
            isUser
              ? 'px-1.5 py-0.5 rounded bg-emerald-800/80 text-emerald-100 font-mono text-[11px]'
              : 'px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-mono text-[11px] font-semibold border border-emerald-200/70'
          }
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className={isUser ? 'italic text-emerald-100' : 'italic text-emerald-700 font-medium'}>
          {part.slice(1, -1)}
        </em>
      )
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>
  })
}

export function renderFormattedMessage(content: string, isUser = false): React.ReactNode {
  if (!content) return null
  const lines = content.split('\n')

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((rawLine, i) => {
        const line = rawLine.trim()
        if (!line) {
          return <div key={i} className="h-1" />
        }

        // Heading (### or ##)
        if (/^#{1,4}\s+/.test(line)) {
          const headingText = line.replace(/^#{1,4}\s+/, '')
          return (
            <div
              key={i}
              className={`font-bold text-[12.5px] pt-1 ${isUser ? 'text-white' : 'text-emerald-900'}`}
            >
              {parseInlineMarkdown(headingText, isUser)}
            </div>
          )
        }

        // Bullet point (•, -, *)
        if (/^(?:[•\-*]|\d+\.)\s+/.test(line)) {
          const bulletMatch = line.match(/^([•\-*]|\d+\.)\s+(.*)$/)
          const marker = bulletMatch ? bulletMatch[1] : '•'
          const body = bulletMatch ? bulletMatch[2] : line
          return (
            <div key={i} className="flex items-start space-x-2 pl-0.5">
              <span
                className={`shrink-0 mt-0.5 font-bold ${
                  isUser ? 'text-emerald-200' : 'text-emerald-600'
                }`}
              >
                {marker === '-' || marker === '*' ? '•' : marker}
              </span>
              <span className="flex-1">{parseInlineMarkdown(body, isUser)}</span>
            </div>
          )
        }

        // Horizontal divider (---)
        if (/^-{3,}$/.test(line)) {
          return <hr key={i} className="border-slate-200/80 my-1.5" />
        }

        return <p key={i}>{parseInlineMarkdown(line, isUser)}</p>
      })}
    </div>
  )
}
