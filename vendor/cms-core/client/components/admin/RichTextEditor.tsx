/**
 * TipTap Rich Text Editor
 * Provides a rich text editor with formatting toolbar
 */

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  const handleBold = () => editor.chain().focus().toggleBold().run();
  const handleItalic = () => editor.chain().focus().toggleItalic().run();
  const handleH2 = () => editor.chain().focus().toggleHeading({ level: 2 }).run();
  const handleH3 = () => editor.chain().focus().toggleHeading({ level: 3 }).run();
  const handleBulletList = () =>
    editor.chain().focus().toggleBulletList().run();
  const handleOrderedList = () =>
    editor.chain().focus().toggleOrderedList().run();

  const handleLinkClick = () => {
    const url = editor.getAttributes("link").href;
    if (url) {
      setLinkUrl(url);
      setShowLinkInput(true);
    } else {
      setLinkUrl("");
      setShowLinkInput(true);
    }
  };

  const handleApplyLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  };

  const handleUnlink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const handleUndo = () => editor.chain().focus().undo().run();
  const handleRedo = () => editor.chain().focus().redo().run();

  const isLinkActive = editor.isActive("link");
  const isBoldActive = editor.isActive("bold");
  const isItalicActive = editor.isActive("italic");
  const isH2Active = editor.isActive("heading", { level: 2 });
  const isH3Active = editor.isActive("heading", { level: 3 });
  const isBulletListActive = editor.isActive("bulletList");
  const isOrderedListActive = editor.isActive("orderedList");

  return (
    <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-3 border-b border-gray-200 bg-gray-50">
        <ToolbarButton
          icon={Bold}
          onClick={handleBold}
          active={isBoldActive}
          title="Bold"
        />
        <ToolbarButton
          icon={Italic}
          onClick={handleItalic}
          active={isItalicActive}
          title="Italic"
        />

        <div className="w-px bg-gray-300 mx-1" />

        <ToolbarButton
          icon={Heading2}
          onClick={handleH2}
          active={isH2Active}
          title="Heading 2"
        />
        <ToolbarButton
          icon={Heading3}
          onClick={handleH3}
          active={isH3Active}
          title="Heading 3"
        />

        <div className="w-px bg-gray-300 mx-1" />

        <ToolbarButton
          icon={List}
          onClick={handleBulletList}
          active={isBulletListActive}
          title="Bullet List"
        />
        <ToolbarButton
          icon={ListOrdered}
          onClick={handleOrderedList}
          active={isOrderedListActive}
          title="Ordered List"
        />

        <div className="w-px bg-gray-300 mx-1" />

        <ToolbarButton
          icon={LinkIcon}
          onClick={handleLinkClick}
          active={isLinkActive}
          title="Add Link"
        />
        {isLinkActive && (
          <ToolbarButton
            icon={Unlink}
            onClick={handleUnlink}
            title="Remove Link"
          />
        )}

        <div className="w-px bg-gray-300 mx-1" />

        <ToolbarButton
          icon={Undo2}
          onClick={handleUndo}
          title="Undo"
        />
        <ToolbarButton
          icon={Redo2}
          onClick={handleRedo}
          title="Redo"
        />
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className="p-3 border-b border-gray-200 bg-blue-50 flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleApplyLink();
              }
            }}
            autoFocus
          />
          <Button size="sm" onClick={handleApplyLink}>
            Apply
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} className="ProseMirror" />
    </div>
  );
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className: string }>;
  onClick: () => void;
  active?: boolean;
  title: string;
}

function ToolbarButton({ icon: Icon, onClick, active, title }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-2 rounded hover:bg-gray-200 transition-colors flex items-center justify-center",
        active && "bg-gray-300 text-gray-900"
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
