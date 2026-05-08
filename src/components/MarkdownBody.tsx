import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

const H2_VAR = { fontVariationSettings: '"opsz" 48, "wdth" 95, "wght" 640' }
const H3_VAR = { fontVariationSettings: '"opsz" 36, "wdth" 95, "wght" 600' }

const components: Components = {
  h2: ({ children, ...props }) => (
    <h2
      {...props}
      className="mt-10 mb-4 font-[family-name:var(--display)] text-[clamp(1.4rem,2vw,1.75rem)] leading-[1.15] tracking-[-0.03em] text-[var(--gb-ink)]"
      style={H2_VAR}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      {...props}
      className="mt-8 mb-3 font-[family-name:var(--display)] text-xl text-[var(--gb-ink)]"
      style={H3_VAR}
    >
      {children}
    </h3>
  ),
}

export function MarkdownBody({ children }: { children: string }) {
  return (
    <div
      className={[
        'mx-auto max-w-[64ch] text-left font-sans text-[1.05rem] leading-[1.75] text-[var(--gb-ink-soft)]',
        '[&_p]:mb-[18px]',
        '[&_ul]:mb-[18px] [&_ul]:pl-[22px] [&_ol]:mb-[18px] [&_ol]:pl-[22px]',
        '[&_li]:mb-[6px]',
        '[&_a]:text-[var(--gb-warm)] [&_a]:underline [&_a]:underline-offset-[3px]',
        '[&_code]:rounded-[2px] [&_code]:bg-black/[0.04] [&_code]:px-[6px] [&_code]:py-px [&_code]:font-mono [&_code]:text-[0.9em]',
        '[&_pre]:mb-[18px] [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-[var(--gb-rule)] [&_pre]:bg-black/[0.04] [&_pre]:p-4 [&_pre]:font-mono',
        '[&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:border [&_img]:border-[var(--gb-rule)]',
      ].join(' ')}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
