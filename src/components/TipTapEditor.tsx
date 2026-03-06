import { useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import BaseImage from "@tiptap/extension-image";
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
  Box, GraduationCap, Type, Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import "@/components/TipTapStyles.css";

// Custom Image extension with layout, width, caption attributes
const CustomImage = BaseImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const w = el.style.width;
          return w ? parseInt(w) : null;
        },
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.width) return {};
          return { style: `width: ${attributes.width}%` };
        },
      },
      "data-layout": {
        default: "center",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-layout") || "center",
        renderHTML: (attributes: Record<string, any>) => ({
          "data-layout": attributes["data-layout"] || "center",
        }),
      },
      "data-caption": {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-caption") || "",
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes["data-caption"]) return {};
          return { "data-caption": attributes["data-caption"] };
        },
      },
    };
  },
});

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const LAYOUTS = [
  { value: "center", label: "Centré" },
  { value: "float-left", label: "← Flottant gauche" },
  { value: "float-right", label: "Flottant droit →" },
  { value: "full", label: "Pleine largeur" },
];

const TipTapEditor = ({ content, onChange, placeholder }: TipTapEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageDialog, setImageDialog] = useState<{
    pos: number;
    attrs: Record<string, any>;
  } | null>(null);
  const [imgAlt, setImgAlt] = useState("");
  const [imgCaption, setImgCaption] = useState("");
  const [imgWidth, setImgWidth] = useState(100);
  const [imgLayout, setImgLayout] = useState("center");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      CustomImage.configure({
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
      Placeholder.configure({
        placeholder: placeholder || "Commencez à écrire...",
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "tiptap-editor-content prose prose-lg max-w-none focus:outline-none min-h-[400px] p-6",
      },
      handleDoubleClickOn: (view, pos, node, nodePos) => {
        if (node.type.name === "image") {
          const a = node.attrs;
          setImgAlt(a.alt || "");
          setImgCaption(a["data-caption"] || "");
          setImgWidth(a.width || 100);
          setImgLayout(a["data-layout"] || "center");
          setImageDialog({ pos: nodePos, attrs: { ...a } });
          return true;
        }
        return false;
      },
    },
  });

  const saveImageAttrs = () => {
    if (!editor || !imageDialog) return;
    const node = editor.state.doc.nodeAt(imageDialog.pos);
    if (node?.type.name === "image") {
      editor.view.dispatch(
        editor.state.tr.setNodeMarkup(imageDialog.pos, undefined, {
          ...node.attrs,
          alt: imgAlt,
          "data-caption": imgCaption,
          width: imgWidth >= 100 ? null : imgWidth,
          "data-layout": imgLayout,
        })
      );
    }
    setImageDialog(null);
    toast.success("Image mise à jour");
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `article/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("blog-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) {
      toast.error("Erreur upload : " + error.message);
      return null;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("blog-images").getPublicUrl(path);
    return publicUrl;
  };

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !editor) return;
      for (const file of Array.from(files)) {
        const url = await uploadImage(file);
        if (url)
          editor
            .chain()
            .focus()
            .setImage({ src: url, alt: file.name })
            .run();
      }
      e.target.value = "";
    },
    [editor]
  );

  const handleYoutubeEmbed = useCallback(() => {
    if (!editor) return;
    const url = prompt("URL de la vidéo YouTube :");
    if (url) editor.commands.setYoutubeVideo({ src: url });
  }, [editor]);

  const insertEncadre = useCallback(
    (type: "conseil" | "encadre") => {
      if (!editor) return;
      const label = type === "conseil" ? "Le conseil du prof" : "Encadré";
      const emoji = type === "conseil" ? "🎓" : "📋";
      const html = `<div class="encadre-block encadre-${type}" data-type="${type}">
      <div class="encadre-header"><span>${emoji} ${label}</span></div>
      <div class="encadre-body">
        <h4>Titre de l'encadré</h4>
        <p>Contenu de l'encadré…</p>
      </div>
    </div><p></p>`;
      editor.chain().focus().insertContent(html).run();
    },
    [editor]
  );

  if (!editor) return null;

  const TB = ({
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
        <TB onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Gras">
          <Bold className="w-4 h-4" />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Italique">
          <Italic className="w-4 h-4" />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="Souligné">
          <UnderlineIcon className="w-4 h-4" />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="Barré">
          <Strikethrough className="w-4 h-4" />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive("highlight")} title="Surligné">
          <Highlighter className="w-4 h-4" />
        </TB>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <TB onClick={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive("paragraph")} title="Paragraphe">
          <Type className="w-4 h-4" />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} title="H2">
          <Heading2 className="w-4 h-4" />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} title="H3">
          <Heading3 className="w-4 h-4" />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} isActive={editor.isActive("heading", { level: 4 })} title="H4">
          <Heading4 className="w-4 h-4" />
        </TB>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <TB onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Liste à puces">
          <List className="w-4 h-4" />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="Liste numérotée">
          <ListOrdered className="w-4 h-4" />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="Citation">
          <Quote className="w-4 h-4" />
        </TB>
        <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur">
          <Minus className="w-4 h-4" />
        </TB>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <TB onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} title="Gauche">
          <AlignLeft className="w-4 h-4" />
        </TB>
        <TB onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} title="Centrer">
          <AlignCenter className="w-4 h-4" />
        </TB>
        <TB onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} title="Droite">
          <AlignRight className="w-4 h-4" />
        </TB>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <TB onClick={handleImageUpload} title="Image">
          <ImageIcon className="w-4 h-4" />
        </TB>
        <TB onClick={handleYoutubeEmbed} title="YouTube">
          <YoutubeIcon className="w-4 h-4" />
        </TB>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <TB onClick={() => insertEncadre("conseil")} title="Conseil du prof">
          <GraduationCap className="w-4 h-4" />
        </TB>
        <TB onClick={() => insertEncadre("encadre")} title="Encadré">
          <Box className="w-4 h-4" />
        </TB>

        <div className="flex-1" />

        <TB onClick={() => editor.chain().focus().undo().run()} title="Annuler">
          <Undo className="w-4 h-4" />
        </TB>
        <TB onClick={() => editor.chain().focus().redo().run()} title="Rétablir">
          <Redo className="w-4 h-4" />
        </TB>
      </div>

      {/* Image editing hint */}
      {editor.isActive("image") && (
        <div className="px-3 py-1.5 bg-accent/30 border-b border-border text-xs text-muted-foreground flex items-center gap-2">
          <Settings2 className="w-3.5 h-3.5" />
          Double-cliquez sur l'image pour modifier ses propriétés (dimensions, habillage, légende, alt SEO)
        </div>
      )}

      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFileSelected}
      />

      {/* Image Edit Dialog */}
      <Dialog open={!!imageDialog} onOpenChange={(o) => !o && setImageDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Propriétés de l'image</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {imageDialog && (
              <img
                src={imageDialog.attrs.src}
                alt=""
                className="w-full max-h-36 object-contain rounded-lg bg-muted"
              />
            )}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Texte alternatif (SEO)</Label>
              <Input
                value={imgAlt}
                onChange={(e) => setImgAlt(e.target.value)}
                placeholder="Description de l'image pour le référencement"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Légende</Label>
              <Input
                value={imgCaption}
                onChange={(e) => setImgCaption(e.target.value)}
                placeholder="Légende affichée sous l'image"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Largeur : {imgWidth}%
              </Label>
              <Slider
                value={[imgWidth]}
                onValueChange={([v]) => setImgWidth(v)}
                min={20}
                max={100}
                step={5}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Habillage dans le texte
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {LAYOUTS.map((l) => (
                  <Button
                    key={l.value}
                    variant={imgLayout === l.value ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-9"
                    onClick={() => setImgLayout(l.value)}
                  >
                    {l.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialog(null)}>
              Annuler
            </Button>
            <Button onClick={saveImageAttrs}>Appliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TipTapEditor;
