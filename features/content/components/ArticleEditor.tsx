"use client";

import { TextSelection } from "@tiptap/pm/state";
import { type Editor, EditorContent, mergeAttributes, Node, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { FIELD_CLASS, Input } from "@/components/atoms/Field";
import { mediaUrl } from "@/lib/media";
import { uploadImage } from "@/lib/upload-image";
import { finishArticleImage, requestArticleImage } from "../actions";
import type { FeaturedRow } from "../featured";
import { findFeaturedCandidates } from "../featured-actions";

const ArticleImage = Node.create({
  name: "articleImage",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({
    storageKey: { default: null },
    width: { default: null },
    height: { default: null },
    alt: { default: "" },
    caption: { default: "" },
  }),
  renderHTML({ node }) {
    const { storageKey, width, alt, caption } = node.attrs;
    return [
      "figure",
      {},
      ["img", { src: mediaUrl(storageKey, width, 640), alt }],
      ...(caption ? [["figcaption", {}, caption]] : []),
    ];
  },
});

/** Stored by product id: the shop shows its current name and price. The label is only for this editor. */
const ProductBlock = Node.create({
  name: "productBlock",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ productId: { default: null }, label: { default: "" } }),
  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-product": node.attrs.productId }),
      `▣ ${node.attrs.label}`,
    ];
  },
});

/** Leaves the cursor on the next line. If the new block stayed selected, the next insert would replace it. */
function insertBlock(editor: Editor, node: { type: string; attrs: Record<string, unknown> }) {
  editor.chain().focus().insertContentAt(editor.state.selection.to, node).run();
  const { doc, selection, tr } = editor.state;
  editor.view.dispatch(tr.setSelection(TextSelection.near(doc.resolve(selection.to), 1)));
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      // Keeps the cursor in the text, so typing straight after a click goes there and not to this button.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-[2px] px-2.5 py-1.5 font-ui text-xs disabled:opacity-40 ${active ? "bg-[var(--accent-subtle)] text-[var(--accent-bright)]" : "text-[var(--text-secondary)] hover:text-[var(--text-display)]"}`}
    >
      {label}
    </button>
  );
}

function ImagePanel({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const t = useTranslations("editor");
  const input = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    start(async () => {
      const res = await uploadImage(file, {
        request: requestArticleImage,
        finish: (key) => finishArticleImage({ key }),
      });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      insertBlock(editor, { type: "articleImage", attrs: { ...res.data, alt, caption } });
      onClose();
    });
  }

  return (
    <div className="grid gap-3 border-b border-[var(--border-subtle)] p-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
      <Input label={t("imageAlt")} value={alt} onChange={(e) => setAlt(e.target.value)} />
      <Input label={t("imageCaption")} value={caption} onChange={(e) => setCaption(e.target.value)} />
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        aria-label={t("imageChoose")}
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <Button variant="primary" disabled={pending} onClick={() => input.current?.click()}>
        {pending ? "…" : t("imageChoose")}
      </Button>
      <Button onClick={onClose}>{t("close")}</Button>
      {error && <Caption tone="error">{error}</Caption>}
    </div>
  );
}

function ProductPanel({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const t = useTranslations("editor");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FeaturedRow[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    let current = true;
    const timer = setTimeout(() => {
      findFeaturedCandidates({ q: query }).then((res) => {
        if (current && res.ok) setResults(res.data);
      });
    }, 250);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="border-b border-[var(--border-subtle)] p-3">
      <div className="flex gap-2">
        <input
          type="search"
          aria-label={t("productSearch")}
          placeholder={t("productSearch")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={FIELD_CLASS}
        />
        <Button onClick={onClose}>{t("close")}</Button>
      </div>
      {results.length > 0 && (
        <ul className="mt-2 max-h-60 overflow-y-auto">
          {results.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => {
                  insertBlock(editor, {
                    type: "productBlock",
                    attrs: { productId: row.id, label: `${row.name} · ${row.category ?? ""}` },
                  });
                  onClose();
                }}
                className="block w-full px-2 py-1.5 text-left font-ui text-sm hover:bg-[var(--accent-subtle)]"
              >
                {row.name}{" "}
                <span className="text-xs text-[var(--text-muted)]">
                  {row.category} · {row.skus}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ArticleEditor({ initial, onChange }: { initial: unknown; onChange: (doc: unknown) => void }) {
  const t = useTranslations("editor");
  const [panel, setPanel] = useState<"image" | "product" | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true },
      }),
      ArticleImage,
      ProductBlock,
    ],
    content: (initial as object) ?? "",
    // Editor attributes have no prototype, which a server action refuses as data, so send plain JSON.
    onUpdate: ({ editor: current }) => onChange(JSON.parse(JSON.stringify(current.getJSON()))),
  });
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            quote: e.isActive("blockquote"),
            link: e.isActive("link"),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });
  if (!editor)
    return <div className="min-h-[360px] border border-[var(--border-strong)] bg-[var(--bg-well)]" />;

  function setLink() {
    if (!editor) return;
    const url = window.prompt(t("linkPrompt"), editor.getAttributes("link").href ?? "");
    if (url === null) return;
    if (!url.trim()) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  const chain = () => editor.chain().focus();
  return (
    <div className="border border-[var(--border-strong)] bg-[var(--bg-well)]">
      <div
        role="toolbar"
        aria-label={t("placeholder")}
        className="flex flex-wrap items-center gap-0.5 border-b border-[var(--border-subtle)] p-1.5"
      >
        <ToolButton label={t("bold")} active={state?.bold} onClick={() => chain().toggleBold().run()} />
        <ToolButton label={t("italic")} active={state?.italic} onClick={() => chain().toggleItalic().run()} />
        <ToolButton
          label={t("h2")}
          active={state?.h2}
          onClick={() => chain().toggleHeading({ level: 2 }).run()}
        />
        <ToolButton
          label={t("h3")}
          active={state?.h3}
          onClick={() => chain().toggleHeading({ level: 3 }).run()}
        />
        <ToolButton
          label={t("bullet")}
          active={state?.bullet}
          onClick={() => chain().toggleBulletList().run()}
        />
        <ToolButton
          label={t("ordered")}
          active={state?.ordered}
          onClick={() => chain().toggleOrderedList().run()}
        />
        <ToolButton
          label={t("quote")}
          active={state?.quote}
          onClick={() => chain().toggleBlockquote().run()}
        />
        <ToolButton label={t("link")} active={state?.link} onClick={setLink} />
        <ToolButton
          label={t("image")}
          active={panel === "image"}
          onClick={() => setPanel(panel === "image" ? null : "image")}
        />
        <ToolButton
          label={t("product")}
          active={panel === "product"}
          onClick={() => setPanel(panel === "product" ? null : "product")}
        />
        <ToolButton label={t("undo")} disabled={!state?.canUndo} onClick={() => chain().undo().run()} />
        <ToolButton label={t("redo")} disabled={!state?.canRedo} onClick={() => chain().redo().run()} />
      </div>
      {panel === "image" && <ImagePanel editor={editor} onClose={() => setPanel(null)} />}
      {panel === "product" && <ProductPanel editor={editor} onClose={() => setPanel(null)} />}
      <EditorContent editor={editor} className="hk-editor" />
    </div>
  );
}
