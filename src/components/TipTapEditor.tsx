import { useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading2, Heading3, Heading4, List, ListOrdered, Quote,
  Image as ImageIcon, Youtube as YoutubeIcon, Highlighter,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo, Minus,
  Box, GraduationCap, Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import "@/components/TipTapStyles.css";

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const TipTapEditor = ({ content, onChange, placeholder }: TipTapEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: "tiptap-image" },
      }),
      Youtube.configure({
        inline: false,
        width: 640,
        height: 360,
        HTMLAttributes: { class: "tiptap-youtube" },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder: placeholder || "Commencez à écrire..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor-content prose prose-lg max-w-none focus:outline-none min-h-[400px] p-6",
      },
    },
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `article/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error("Erreur upload : " + error.message);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from("blog-images").getPublicUrl(path);
    return publicUrl;
  };

  const handleImageUpload = useCallback(async () => {
    fileInputRef.current?.click();
  }, []);

  const onFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editor) return;
    for (const file of Array.from(files)) {
      const url = await uploadImage(file);
      if (url) {
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      }
    }
    e.target.value = "";
  }, [editor]);

  const handleYoutubeEmbed = useCallback(() => {
    if (!editor) return;
    const url = prompt("URL de la vidéo YouTube :");
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  }, [editor]);

  const insertEncadre = useCallback((type: "conseil" | "encadre") => {
    if (!editor) return;
    const label = type === "conseil" ? "Le conseil du prof" : "Encadré";
    const emoji = type === "conseil" ? "🎓" : "📋";
    const html = `<div class="encadre-block encadre-${type}" data-type="${type}">
      <div class="encadre-header"><span>${emoji} ${label}</span></div>
      <div class="encadre-body">
        <h4>Titre de l'encadré</h4>
        <p>Contenu de l'encadré...</p>
      </div>
    </div><p></p>`;
    editor.chain().focus().insertContent(html).run();
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="sm"
      className="h-8 w-8 p-0"
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className="tiptap-wrapper border border-border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="tiptap-toolbar flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30 sticky top-0 z-10">
        {/* Text formatting */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Gras">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Italique">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="Souligné">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="Barré">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive("highlight")} title="Surligné">
          <Highlighter className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive("paragraph")} title="Paragraphe">
          <Type className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} title="Titre H2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} title="Titre H3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} isActive={editor.isActive("heading", { level: 4 })} title="Titre H4">
          <Heading4 className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Liste à puces">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="Liste numérotée">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="Citation">
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur">
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} title="Aligner à gauche">
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} title="Centrer">
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} title="Aligner à droite">
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Media */}
        <ToolbarButton onClick={handleImageUpload} title="Insérer une image">
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={handleYoutubeEmbed} title="Insérer une vidéo YouTube">
          <YoutubeIcon className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Special blocks */}
        <ToolbarButton onClick={() => insertEncadre("conseil")} title="Bloc Conseil du prof">
          <GraduationCap className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => insertEncadre("encadre")} title="Bloc Encadré">
          <Box className="w-4 h-4" />
        </ToolbarButton>

        <div className="flex-1" />

        {/* Undo/Redo */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Annuler">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Rétablir">
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFileSelected}
      />
    </div>
  );
};

export default TipTapEditor;
