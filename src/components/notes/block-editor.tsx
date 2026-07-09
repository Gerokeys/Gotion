"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { BlockType } from "@/lib/types";
import {
  createBlock,
  deleteBlock,
  moveBlockParent,
  toggleBlockChecked,
  toggleBlockCollapsed,
  updateBlockContent,
  updateBlockType,
} from "@/lib/actions/blocks";

export type ClientBlock = {
  id: string;
  type: string;
  content: string;
  checked: boolean;
  collapsed: boolean;
  parentId: string | null;
  position: number;
};

// `clientKey` is the stable local identity (React key, focus target, ref map
// key, and what `parentId` points to) — it never changes. `id` starts out
// equal to it and gets swapped for the real server id once a newly-created
// block's createBlock() call resolves. This lets Enter/Tab/etc. update the UI
// and move focus instantly, without waiting on a network round trip, while
// still being able to route any mutation that lands on a not-yet-persisted
// block to the right row once it exists.
type EditorBlock = ClientBlock & { clientKey: string };

type FocusRequest = { key: string; caret: "start" | "end" | number } | null;

const CONTINUES_TYPE: BlockType[] = ["bullet", "todo"];

function markdownShortcut(raw: string): { type: BlockType; content: string } | null {
  if (/^#{1}\s$/.test(raw)) return { type: "h1", content: "" };
  if (/^#{2}\s$/.test(raw)) return { type: "h2", content: "" };
  if (/^#{3}\s$/.test(raw)) return { type: "h3", content: "" };
  if (/^[-*]\s$/.test(raw)) return { type: "bullet", content: "" };
  if (/^\[\s?\]\s$/.test(raw)) return { type: "todo", content: "" };
  if (/^>\s$/.test(raw)) return { type: "toggle", content: "" };
  return null;
}

export function BlockEditor({
  pageId,
  initialBlocks,
}: {
  pageId: string;
  initialBlocks: ClientBlock[];
}) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(() =>
    initialBlocks.map((b) => ({ ...b, clientKey: b.id }))
  );
  const [focusRequest, setFocusRequest] = useState<FocusRequest>(null);
  const elRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // clientKey -> real server id, once a pending creation resolves.
  const resolvedIds = useRef<Map<string, string>>(new Map());
  // clientKey -> in-flight creation promise, while still pending.
  const pendingCreations = useRef<Map<string, Promise<string>>>(new Map());

  async function resolveId(clientKey: string): Promise<string> {
    const resolved = resolvedIds.current.get(clientKey);
    if (resolved) return resolved;
    const pending = pendingCreations.current.get(clientKey);
    if (pending) return pending;
    return clientKey; // never went through the temp-block path — already real
  }

  useEffect(() => {
    if (!focusRequest) return;
    const el = elRefs.current.get(focusRequest.key);
    if (!el) return;
    el.focus();
    const pos =
      focusRequest.caret === "start"
        ? 0
        : focusRequest.caret === "end"
          ? el.value.length
          : focusRequest.caret;
    el.setSelectionRange(pos, pos);
    setFocusRequest(null);
  }, [focusRequest, blocks]);

  const byParent = useMemo(() => {
    const map = new Map<string | null, EditorBlock[]>();
    for (const b of [...blocks].sort((a, b) => a.position - b.position)) {
      const list = map.get(b.parentId) ?? [];
      list.push(b);
      map.set(b.parentId, list);
    }
    return map;
  }, [blocks]);

  const collapsedKeys = useMemo(
    () =>
      new Set(blocks.filter((b) => b.type === "toggle" && b.collapsed).map((b) => b.clientKey)),
    [blocks]
  );

  function isHidden(block: EditorBlock): boolean {
    let cur = block;
    while (cur.parentId) {
      const parent = blocks.find((b) => b.clientKey === cur.parentId);
      if (!parent) break;
      if (collapsedKeys.has(parent.clientKey)) return true;
      cur = parent;
    }
    return false;
  }

  function scheduleContentSync(key: string, content: string) {
    const timers = debounceTimers.current;
    const existing = timers.get(key);
    if (existing) clearTimeout(existing);
    timers.set(
      key,
      setTimeout(async () => {
        timers.delete(key);
        const realId = await resolveId(key);
        updateBlockContent(realId, pageId, content);
      }, 400)
    );
  }

  function updateLocal(key: string, patch: Partial<EditorBlock>) {
    setBlocks((prev) => prev.map((b) => (b.clientKey === key ? { ...b, ...patch } : b)));
  }

  function siblingsOf(block: EditorBlock): EditorBlock[] {
    return byParent.get(block.parentId) ?? [];
  }

  function insertAfter(current: EditorBlock, type: BlockType, content: string) {
    const siblings = siblingsOf(current);
    const idx = siblings.findIndex((b) => b.clientKey === current.clientKey);
    const next = siblings[idx + 1];
    const position = next ? (current.position + next.position) / 2 : current.position + 1;

    const tempKey = `temp-${crypto.randomUUID()}`;
    const newBlock: EditorBlock = {
      id: tempKey,
      clientKey: tempKey,
      type,
      content,
      checked: false,
      collapsed: false,
      parentId: current.parentId,
      position,
    };
    setBlocks((prev) => [...prev, newBlock]);
    setFocusRequest({ key: tempKey, caret: "start" });

    const promise = (async () => {
      const parentRealId = current.parentId ? await resolveId(current.parentId) : null;
      const created = await createBlock(pageId, current.position, type, content, parentRealId);
      resolvedIds.current.set(tempKey, created.id);
      pendingCreations.current.delete(tempKey);
      setBlocks((prev) => prev.map((b) => (b.clientKey === tempKey ? { ...b, id: created.id } : b)));
      return created.id;
    })();
    pendingCreations.current.set(tempKey, promise);
  }

  function removeBlock(block: EditorBlock, focusTarget: FocusRequest) {
    setBlocks((prev) => prev.filter((b) => b.clientKey !== block.clientKey));
    if (focusTarget) setFocusRequest(focusTarget);
    void (async () => {
      const realId = await resolveId(block.clientKey);
      await deleteBlock(realId, pageId);
    })();
  }

  function handleEnter(block: EditorBlock, el: HTMLTextAreaElement) {
    const caret = el.selectionStart;
    const before = block.content.slice(0, caret);
    const after = block.content.slice(caret);
    updateLocal(block.clientKey, { content: before });
    scheduleContentSync(block.clientKey, before);
    const nextType: BlockType = CONTINUES_TYPE.includes(block.type as BlockType)
      ? (block.type as BlockType)
      : "text";
    insertAfter(block, nextType, after);
  }

  function handleBackspace(block: EditorBlock) {
    const siblings = siblingsOf(block);
    const idx = siblings.findIndex((b) => b.clientKey === block.clientKey);
    const prevSibling = idx > 0 ? siblings[idx - 1] : null;

    if (block.content === "") {
      if (blocks.length === 1) return; // never delete the last block
      if (prevSibling) {
        removeBlock(block, { key: prevSibling.clientKey, caret: "end" });
      } else if (block.parentId) {
        const parent = blocks.find((b) => b.clientKey === block.parentId);
        removeBlock(block, parent ? { key: parent.clientKey, caret: "end" } : null);
      } else {
        removeBlock(block, null);
      }
      return;
    }

    if (prevSibling) {
      const joinAt = prevSibling.content.length;
      const merged = prevSibling.content + block.content;
      updateLocal(prevSibling.clientKey, { content: merged });
      scheduleContentSync(prevSibling.clientKey, merged);
      removeBlock(block, { key: prevSibling.clientKey, caret: joinAt });
    }
  }

  function handleIndent(block: EditorBlock) {
    const siblings = siblingsOf(block);
    const idx = siblings.findIndex((b) => b.clientKey === block.clientKey);
    if (idx <= 0) return; // no preceding sibling to nest under
    const newParent = siblings[idx - 1];
    const newParentChildren = byParent.get(newParent.clientKey) ?? [];
    const lastChild = newParentChildren[newParentChildren.length - 1];
    const position = lastChild ? lastChild.position + 1 : 0;
    updateLocal(block.clientKey, { parentId: newParent.clientKey, position });
    void (async () => {
      const [realId, realParentId] = await Promise.all([
        resolveId(block.clientKey),
        resolveId(newParent.clientKey),
      ]);
      await moveBlockParent(realId, pageId, realParentId, position);
    })();
  }

  function handleOutdent(block: EditorBlock) {
    if (!block.parentId) return;
    const parent = blocks.find((b) => b.clientKey === block.parentId);
    if (!parent) return;
    const grandSiblings = byParent.get(parent.parentId) ?? [];
    const parentIdx = grandSiblings.findIndex((b) => b.clientKey === parent.clientKey);
    const after = grandSiblings[parentIdx + 1];
    const position = after ? (parent.position + after.position) / 2 : parent.position + 1;
    const newParentKey = parent.parentId;
    updateLocal(block.clientKey, { parentId: newParentKey, position });
    void (async () => {
      const realId = await resolveId(block.clientKey);
      const realParentId = newParentKey ? await resolveId(newParentKey) : null;
      await moveBlockParent(realId, pageId, realParentId, position);
    })();
  }

  function handleArrowVertical(block: EditorBlock, dir: "up" | "down", el: HTMLTextAreaElement) {
    const ordered = [...blocks].sort((a, b) => a.position - b.position);
    const visible = ordered.filter((b) => !isHidden(b));
    const idx = visible.findIndex((b) => b.clientKey === block.clientKey);
    if (dir === "up" && el.selectionStart === 0 && idx > 0) {
      setFocusRequest({ key: visible[idx - 1].clientKey, caret: "end" });
    } else if (dir === "down" && el.selectionStart === block.content.length && idx < visible.length - 1) {
      setFocusRequest({ key: visible[idx + 1].clientKey, caret: "start" });
    }
  }

  function toggleCollapsed(block: EditorBlock) {
    const next = !block.collapsed;
    updateLocal(block.clientKey, { collapsed: next });
    void (async () => {
      const realId = await resolveId(block.clientKey);
      await toggleBlockCollapsed(realId, pageId, next);
    })();
  }

  function handleContentChange(block: EditorBlock, raw: string) {
    const shortcut = markdownShortcut(raw);
    if (shortcut) {
      updateLocal(block.clientKey, { type: shortcut.type, content: shortcut.content });
      scheduleContentSync(block.clientKey, shortcut.content);
      void (async () => {
        const realId = await resolveId(block.clientKey);
        await updateBlockType(realId, pageId, shortcut.type);
      })();
      return;
    }
    updateLocal(block.clientKey, { content: raw });
    scheduleContentSync(block.clientKey, raw);
  }

  function handleToggleChecked(block: EditorBlock) {
    const next = !block.checked;
    updateLocal(block.clientKey, { checked: next });
    void (async () => {
      const realId = await resolveId(block.clientKey);
      await toggleBlockChecked(realId, pageId, next);
    })();
  }

  const roots = byParent.get(null) ?? [];

  return (
    <div className="flex flex-col">
      {roots.map((block) => (
        <BlockNode
          key={block.clientKey}
          block={block}
          depth={0}
          byParent={byParent}
          isHidden={isHidden}
          elRefs={elRefs}
          onContentChange={handleContentChange}
          onEnter={handleEnter}
          onBackspace={handleBackspace}
          onIndent={handleIndent}
          onOutdent={handleOutdent}
          onArrow={handleArrowVertical}
          onToggleChecked={handleToggleChecked}
          onToggleCollapsed={toggleCollapsed}
        />
      ))}
    </div>
  );
}

function BlockNode({
  block,
  depth,
  byParent,
  isHidden,
  elRefs,
  onContentChange,
  onEnter,
  onBackspace,
  onIndent,
  onOutdent,
  onArrow,
  onToggleChecked,
  onToggleCollapsed,
}: {
  block: EditorBlock;
  depth: number;
  byParent: Map<string | null, EditorBlock[]>;
  isHidden: (b: EditorBlock) => boolean;
  elRefs: React.RefObject<Map<string, HTMLTextAreaElement>>;
  onContentChange: (block: EditorBlock, raw: string) => void;
  onEnter: (block: EditorBlock, el: HTMLTextAreaElement) => void;
  onBackspace: (block: EditorBlock) => void;
  onIndent: (block: EditorBlock) => void;
  onOutdent: (block: EditorBlock) => void;
  onArrow: (block: EditorBlock, dir: "up" | "down", el: HTMLTextAreaElement) => void;
  onToggleChecked: (block: EditorBlock) => void;
  onToggleCollapsed: (block: EditorBlock) => void;
}) {
  if (isHidden(block)) return null;

  const children = byParent.get(block.clientKey) ?? [];

  return (
    <div>
      <BlockRow
        block={block}
        depth={depth}
        hasChildren={children.length > 0}
        elRefs={elRefs}
        onContentChange={onContentChange}
        onEnter={onEnter}
        onBackspace={onBackspace}
        onIndent={onIndent}
        onOutdent={onOutdent}
        onArrow={onArrow}
        onToggleChecked={onToggleChecked}
        onToggleCollapsed={onToggleCollapsed}
      />
      {children.map((child) => (
        <BlockNode
          key={child.clientKey}
          block={child}
          depth={depth + 1}
          byParent={byParent}
          isHidden={isHidden}
          elRefs={elRefs}
          onContentChange={onContentChange}
          onEnter={onEnter}
          onBackspace={onBackspace}
          onIndent={onIndent}
          onOutdent={onOutdent}
          onArrow={onArrow}
          onToggleChecked={onToggleChecked}
          onToggleCollapsed={onToggleCollapsed}
        />
      ))}
    </div>
  );
}

const TYPE_STYLES: Record<string, string> = {
  text: "text-base font-normal",
  h1: "text-2xl font-bold pt-4",
  h2: "text-xl font-semibold pt-3",
  h3: "text-lg font-semibold pt-2",
  bullet: "text-base font-normal",
  todo: "text-base font-normal",
  toggle: "text-base font-medium",
};

const PLACEHOLDER: Record<string, string> = {
  text: "Type '/' for headings, '-' for bullets, '[] ' for a to-do…",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  bullet: "List item",
  todo: "To-do",
  toggle: "Toggle",
};

function BlockRow({
  block,
  depth,
  hasChildren,
  elRefs,
  onContentChange,
  onEnter,
  onBackspace,
  onIndent,
  onOutdent,
  onArrow,
  onToggleChecked,
  onToggleCollapsed,
}: {
  block: EditorBlock;
  depth: number;
  hasChildren: boolean;
  elRefs: React.RefObject<Map<string, HTMLTextAreaElement>>;
  onContentChange: (block: EditorBlock, raw: string) => void;
  onEnter: (block: EditorBlock, el: HTMLTextAreaElement) => void;
  onBackspace: (block: EditorBlock) => void;
  onIndent: (block: EditorBlock) => void;
  onOutdent: (block: EditorBlock) => void;
  onArrow: (block: EditorBlock, dir: "up" | "down", el: HTMLTextAreaElement) => void;
  onToggleChecked: (block: EditorBlock) => void;
  onToggleCollapsed: (block: EditorBlock) => void;
}) {
  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  return (
    <div className="group flex items-start gap-1.5 py-0.5" style={{ paddingLeft: depth * 24 }}>
      <div className="flex w-5 shrink-0 items-center justify-center pt-1.5">
        {block.type === "toggle" ? (
          <button
            onClick={() => onToggleCollapsed(block)}
            className="rounded p-0.5 text-muted-foreground hover:bg-accent"
          >
            <svg
              viewBox="0 0 24 24"
              className={cn("size-3.5 transition-transform", !block.collapsed && "rotate-90")}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : block.type === "bullet" ? (
          <span className="text-muted-foreground">•</span>
        ) : block.type === "todo" ? (
          <input
            type="checkbox"
            checked={block.checked}
            onChange={() => onToggleChecked(block)}
            className="size-4 rounded border-input accent-primary"
          />
        ) : null}
      </div>

      <textarea
        ref={(el) => {
          if (el) {
            elRefs.current.set(block.clientKey, el);
            autoResize(el);
          } else {
            elRefs.current.delete(block.clientKey);
          }
        }}
        rows={1}
        value={block.content}
        placeholder={hasChildren ? undefined : PLACEHOLDER[block.type]}
        onChange={(e) => {
          onContentChange(block, e.target.value);
          autoResize(e.target);
        }}
        onKeyDown={(e) => {
          const el = e.currentTarget;
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onEnter(block, el);
          } else if (e.key === "Backspace" && el.selectionStart === 0 && el.selectionEnd === 0) {
            e.preventDefault();
            onBackspace(block);
          } else if (e.key === "Tab" && !e.shiftKey) {
            e.preventDefault();
            onIndent(block);
          } else if (e.key === "Tab" && e.shiftKey) {
            e.preventDefault();
            onOutdent(block);
          } else if (e.key === "ArrowUp") {
            onArrow(block, "up", el);
          } else if (e.key === "ArrowDown") {
            onArrow(block, "down", el);
          }
        }}
        className={cn(
          "min-w-0 flex-1 resize-none overflow-hidden bg-transparent leading-relaxed outline-none placeholder:text-muted-foreground/40",
          TYPE_STYLES[block.type],
          block.type === "todo" && block.checked && "text-muted-foreground line-through"
        )}
      />
    </div>
  );
}
