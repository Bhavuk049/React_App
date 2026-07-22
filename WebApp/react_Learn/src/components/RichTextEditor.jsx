import { useEffect, useRef } from "react";

const TEXT_TOOLS = [
  { command: "bold", label: "B", title: "Bold", className: "font-bold" },
  { command: "italic", label: "I", title: "Italic", className: "italic" },
  { command: "underline", label: "U", title: "Underline", className: "underline" },
  { command: "insertUnorderedList", label: "•", title: "Bullet list", className: "" },
  { command: "insertOrderedList", label: "1.", title: "Numbered list", className: "" },
];

// contentEditable is treated as uncontrolled — we only push `value` into the DOM once
// (on mount, or when `resetKey` changes), then read `innerHTML` back out via onChange.
// Keeping React in charge of innerHTML on every keystroke would fight the caret position.
export function RichTextEditor({ value, onChange, resetKey }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  function runCommand(command) {
    ref.current?.focus();
    document.execCommand(command);
    onChange(ref.current?.innerHTML ?? "");
  }

  function addLink() {
    const url = window.prompt("Link URL (https://...)");
    if (!url) return;
    ref.current?.focus();
    document.execCommand("createLink", false, url);
    onChange(ref.current?.innerHTML ?? "");
  }

  return (
    <div className="rounded-md border border-neutral-300 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400">
      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-50 p-1.5">
        {TEXT_TOOLS.map((tool) => (
          <button
            key={tool.command}
            type="button"
            title={tool.title}
            aria-label={tool.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand(tool.command)}
            className={`flex h-7 w-7 items-center justify-center rounded text-sm text-neutral-700 hover:bg-neutral-200 ${tool.className}`}
          >
            {tool.label}
          </button>
        ))}
        <button
          type="button"
          title="Add link"
          aria-label="Add link"
          onMouseDown={(e) => e.preventDefault()}
          onClick={addLink}
          className="flex h-7 w-7 items-center justify-center rounded text-sm text-neutral-700 hover:bg-neutral-200"
        >
          🔗
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="min-h-[240px] px-3 py-2 text-sm text-neutral-900 focus:outline-none [&_a]:text-rose-600 [&_a]:underline [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-2 [&_ul]:list-disc"
      />
    </div>
  );
}
