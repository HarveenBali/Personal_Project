'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  ariaLabel: string;
}

export function TipTapEditor({
  value,
  onChange,
  onBlur,
  ariaLabel,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    onBlur,
    editorProps: {
      attributes: {
        'aria-label': ariaLabel,
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  return (
    <div>
      <div role="toolbar" aria-label={`${ariaLabel} formatting`}>
        <button
          type="button"
          aria-label="Bold"
          aria-pressed={editor?.isActive('bold') ?? false}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          aria-label="Italic"
          aria-pressed={editor?.isActive('italic') ?? false}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          type="button"
          aria-label="Bullet list"
          aria-pressed={editor?.isActive('bulletList') ?? false}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          Bullet list
        </button>
        <button
          type="button"
          aria-label="Code"
          aria-pressed={editor?.isActive('code') ?? false}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          Code
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
