import { cn } from "@/lib/utils";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Fragment, useMemo } from "react";

type Token =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string; display: boolean };

const PATTERN = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$([^$\n]+?)\$/g;

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of input.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ kind: "text", value: input.slice(last, index) });
    const display = match[1] != null || match[2] != null;
    const value = match[1] ?? match[2] ?? match[3] ?? match[4] ?? "";
    tokens.push({ kind: "math", value: value.trim(), display });
    last = index + match[0].length;
  }
  if (last < input.length) tokens.push({ kind: "text", value: input.slice(last) });
  return tokens;
}

function renderMath(value: string, display: boolean): string | null {
  try {
    return katex.renderToString(value, {
      displayMode: display,
      throwOnError: false,
      strict: false,
      output: "html",
    });
  } catch {
    return null;
  }
}

/** Renders plain text mixed with LaTeX math ($...$, $$...$$, \(...\), \[...\]) plus **bold** segments. */
export function MathText({ children, className }: { children?: string | null | undefined; className?: string }) {
  const tokens = useMemo(() => tokenize(children ?? ""), [children]);

  return (
    <span className={cn("[&_.katex]:text-[1.05em]", className)}>
      {tokens.map((token, i) => {
        if (token.kind === "math") {
          const html = renderMath(token.value, token.display);
          if (html == null) return <code key={i}>{token.value}</code>;
          return (
            <span
              key={i}
              className={token.display ? "my-2 block overflow-x-auto" : "inline-block align-middle"}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        return <Fragment key={i}>{renderInlineText(token.value)}</Fragment>;
      })}
    </span>
  );
}

function renderInlineText(value: string) {
  const parts = value.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <b key={i}>{part.slice(2, -2)}</b>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** Block variant that preserves line breaks in step-by-step solutions. */
export function MathBlock({ children, className }: { children?: string | null | undefined; className?: string }) {
  const lines = (children ?? "").split("\n");
  return (
    <div className={cn("space-y-1", className)}>
      {lines.map((line, i) =>
        line.trim() === "" ? <div key={i} className="h-2" /> : <MathText key={i} className="block">{line}</MathText>,
      )}
    </div>
  );
}
