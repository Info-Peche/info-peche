import { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer, NodeViewProps } from "@tiptap/react";
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
  Box, GraduationCap, Type, Settings2, Upload, GalleryHorizontal,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import "@/components/TipTapStyles.css";

/* ── Image NodeView: renders figure with visible caption ── */
const ImageNodeView = ({ node, selected }: NodeViewProps) => {
  const { src, alt, width, "data-caption": caption, "data-layout": layout } = node.attrs;
  return (
    <NodeViewWrapper
      as="figure"
      className={`tiptap-image-figure ${selected ? "selected" : ""}`}
      data-layout={layout || "center"}
      draggable="true"
      data-drag-handle
    >
      <img
        src={src}
        alt={alt || ""}
        style={width ? { width: `${width}%` } : undefined}
        className="tiptap-image"
      />
      {caption && (
        <figcaption className="tiptap-caption">{caption}</figcaption>
      )}
      {selected && (
        <div className="drag-handle" contentEditable={false}>
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </NodeViewWrapper>
  );
};

// Custom Image extension with layout, width, caption attributes + drag + nodeView
const CustomImage = BaseImage.extend({
  draggable: true,

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

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
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
  { value: "inline", label: "Côte à côte" },
];

const SIZE_PRESETS = [
  { value: 25, label: "25%" },
  { value: 33, label: "33%" },
  { value: 50, label: "50%" },
  { value: 75, label: "75%" },
  { value: 100, label: "100%" },
];

const TipTapEditor = ({ content, onChange, placeholder }: TipTapEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const encadreFileInputRef = useRef<HTMLInputElement>(null);
  const pairFileInputRef1 = useRef<HTMLInputElement>(null);
  const pairFileInputRef2 = useRef<HTMLInputElement>(null);

  // Image detail dialog
  const [imageDialog, setImageDialog] = useState<{
    pos: number;
    attrs: Record<string, any>;
  } | null>(null);
  const [imgAlt, setImgAlt] = useState("");
  const [imgCaption, setImgCaption] = useState("");
  const [imgWidth, setImgWidth] = useState(100);
  const [imgLayout, setImgLayout] = useState("center");

  // Encadré/Conseil dialog
  const [encadreDialog, setEncadreDialog] = useState<{
    type: "conseil" | "encadre";
  } | null>(null);
  const [encadreTitle, setEncadreTitle] = useState("");
  const [encadreText, setEncadreText] = useState("");
  const [encadreImageUrl, setEncadreImageUrl] = useState("");
  const [encadreImageCaption, setEncadreImageCaption] = useState("");
  const [encadreUploading, setEncadreUploading] = useState(false);

  // Selected image quick-resize bar
  const [selectedImagePos, setSelectedImagePos] = useState<number | null>(null);
  const [selectedImageWidth, setSelectedImageWidth] = useState<number>(100);

  // Side-by-side dialog
  const [pairDialog, setPairDialog] = useState(false);
  const [pairImage1, setPairImage1] = useState<string | null>(null);
  const [pairImage2, setPairImage2] = useState<string | null>(null);
  const [pairCaption1, setPairCaption1] = useState("");
  const [pairCaption2, setPairCaption2] = useState("");
  const [pairUploading, setPairUploading] = useState(false);

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

  // Track image selection for inline resize bar
  useEffect(() => {
    if (!editor) return;
    const handleSelection = () => {
      const { selection } = editor.state;
      const node = editor.state.doc.nodeAt(selection.from);
      if (node?.type.name === "image") {
        setSelectedImagePos(selection.from);
        setSelectedImageWidth(node.attrs.width || 100);
      } else {
        setSelectedImagePos(null);
      }
    };
    editor.on("selectionUpdate", handleSelection);
    return () => { editor.off("selectionUpdate", handleSelection); };
  }, [editor]);

  const applyQuickResize = (size: number) => {
    if (!editor || selectedImagePos === null) return;
    const node = editor.state.doc.nodeAt(selectedImagePos);
    if (node?.type.name === "image") {
      editor.view.dispatch(
        editor.state.tr.setNodeMarkup(selectedImagePos, undefined, {
          ...node.attrs,
          width: size >= 100 ? null : size,
        })
      );
      setSelectedImageWidth(size);
    }
  };

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

  // Open encadré dialog
  const openEncadreDialog = useCallback((type: "conseil" | "encadre") => {
    setEncadreTitle("");
    setEncadreText("");
    setEncadreImageUrl("");
    setEncadreImageCaption("");
    setEncadreDialog({ type });
  }, []);

  const handleEncadreImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEncadreUploading(true);
    const url = await uploadImage(file);
    if (url) setEncadreImageUrl(url);
    setEncadreUploading(false);
    e.target.value = "";
  };

  const insertEncadreBlock = () => {
    if (!editor || !encadreDialog) return;
    const { type } = encadreDialog;
    const label = type === "conseil" ? "Le conseil du prof" : "Encadré";
    const emoji = type === "conseil" ? "🎓" : "📋";

    const imgHtml = encadreImageUrl
      ? `<figure class="encadre-figure"><img src="${encadreImageUrl}" alt="${encadreImageCaption || encadreTitle}" />${encadreImageCaption ? `<figcaption>${encadreImageCaption}</figcaption>` : ""}</figure>`
      : "";

    const bodyParagraphs = encadreText
      .split("\n")
      .filter(l => l.trim())
      .map(l => `<p>${l}</p>`)
      .join("");

    const html = `<div class="encadre-block encadre-${type}" data-type="${type}">
      <div class="encadre-header"><span>${emoji} ${label}</span></div>
      <div class="encadre-body">
        <h4>${encadreTitle || "Titre"}</h4>
        ${imgHtml}
        ${bodyParagraphs || "<p>Contenu…</p>"}
      </div>
    </div><p></p>`;

    editor.chain().focus().insertContent(html).run();
    setEncadreDialog(null);
    toast.success("Bloc inséré");
  };

  // ── Side-by-side images ──
  const openPairDialog = () => {
    setPairImage1(null);
    setPairImage2(null);
    setPairCaption1("");
    setPairCaption2("");
    setPairDialog(true);
  };

  const handlePairUpload = async (index: 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPairUploading(true);
    const url = await uploadImage(file);
    if (url) {
      if (index === 1) setPairImage1(url);
      else setPairImage2(url);
    }
    setPairUploading(false);
    e.target.value = "";
  };

  const insertPairImages = () => {
    if (!editor || !pairImage1 || !pairImage2) return;
    // Insert two consecutive images with inline layout and 48% width
    editor.chain().focus()
      .setImage({ src: pairImage1, alt: pairCaption1, "data-caption": pairCaption1, "data-layout": "inline", width: 48 } as any)
      .run();
    // Insert second image right after
    editor.chain().focus()
      .setImage({ src: pairImage2, alt: pairCaption2, "data-caption": pairCaption2, "data-layout": "inline", width: 48 } as any)
      .run();
    setPairDialog(false);
    toast.success("Images côte à côte insérées");
  };

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
    <div className="tiptap-wrapper bg-background">
      {/* Sticky Toolbar */}
      <div className="tiptap-toolbar flex flex-wrap items-center gap-0.5 p-2 border border-border rounded-t-lg bg-muted/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
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
        <TB onClick={openPairDialog} title="2 images côte à côte">
          <GalleryHorizontal className="w-4 h-4" />
        </TB>
        <TB onClick={handleYoutubeEmbed} title="YouTube">
          <YoutubeIcon className="w-4 h-4" />
        </TB>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <TB onClick={() => openEncadreDialog("conseil")} title="Conseil du prof">
          <GraduationCap className="w-4 h-4" />
        </TB>
        <TB onClick={() => openEncadreDialog("encadre")} title="Encadré">
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

      {/* Quick image resize bar - shown when an image is selected */}
      {selectedImagePos !== null && (
        <div className="px-3 py-2 bg-accent/40 border-b border-border flex items-center gap-2 flex-wrap sticky top-[44px] z-40">
          <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mr-1">Taille :</span>
          {SIZE_PRESETS.map((s) => (
            <Button
              key={s.value}
              variant={selectedImageWidth === s.value || (s.value === 100 && !selectedImageWidth) ? "default" : "outline"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => applyQuickResize(s.value)}
            >
              {s.label}
            </Button>
          ))}
          <Separator orientation="vertical" className="h-5 mx-1" />
          <span className="text-xs text-muted-foreground">Double-clic → légende, alt, habillage | Glissez pour déplacer</span>
        </div>
      )}

      <div className="border border-t-0 border-border rounded-b-lg">
        <EditorContent editor={editor} />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFileSelected}
      />

      {/* Image Detail Dialog (double-click) */}
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

      {/* Side-by-side images dialog */}
      <Dialog open={pairDialog} onOpenChange={(o) => !o && setPairDialog(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GalleryHorizontal className="w-5 h-5 text-primary" /> 2 images côte à côte
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {/* Image 1 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Image gauche</Label>
              {pairImage1 ? (
                <div className="relative">
                  <img src={pairImage1} alt="" className="w-full h-28 object-cover rounded-lg" />
                  <Button variant="destructive" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0" onClick={() => setPairImage1(null)}>×</Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-28 border-dashed flex flex-col gap-1"
                  onClick={() => pairFileInputRef1.current?.click()}
                  disabled={pairUploading}
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Importer</span>
                </Button>
              )}
              <Input value={pairCaption1} onChange={e => setPairCaption1(e.target.value)} placeholder="Légende (optionnel)" className="text-xs" />
            </div>
            {/* Image 2 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Image droite</Label>
              {pairImage2 ? (
                <div className="relative">
                  <img src={pairImage2} alt="" className="w-full h-28 object-cover rounded-lg" />
                  <Button variant="destructive" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0" onClick={() => setPairImage2(null)}>×</Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-28 border-dashed flex flex-col gap-1"
                  onClick={() => pairFileInputRef2.current?.click()}
                  disabled={pairUploading}
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Importer</span>
                </Button>
              )}
              <Input value={pairCaption2} onChange={e => setPairCaption2(e.target.value)} placeholder="Légende (optionnel)" className="text-xs" />
            </div>
          </div>
          <input ref={pairFileInputRef1} type="file" accept="image/*" className="hidden" onChange={e => handlePairUpload(1, e)} />
          <input ref={pairFileInputRef2} type="file" accept="image/*" className="hidden" onChange={e => handlePairUpload(2, e)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPairDialog(false)}>Annuler</Button>
            <Button onClick={insertPairImages} disabled={!pairImage1 || !pairImage2 || pairUploading}>Insérer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Encadré / Conseil Dialog */}
      <Dialog open={!!encadreDialog} onOpenChange={(o) => !o && setEncadreDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {encadreDialog?.type === "conseil" ? (
                <><GraduationCap className="w-5 h-5 text-primary" /> Le conseil du prof</>
              ) : (
                <><Box className="w-5 h-5 text-accent-foreground" /> Encadré</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Titre du bloc</Label>
              <Input
                value={encadreTitle}
                onChange={(e) => setEncadreTitle(e.target.value)}
                placeholder="Ex: L'astuce du montage en ligne"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Contenu</Label>
              <Textarea
                value={encadreText}
                onChange={(e) => setEncadreText(e.target.value)}
                placeholder="Texte du bloc…"
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Image (optionnel)</Label>
              {encadreImageUrl ? (
                <div className="relative">
                  <img src={encadreImageUrl} alt="" className="w-full max-h-40 object-contain rounded-lg bg-muted" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-7 text-xs"
                    onClick={() => setEncadreImageUrl("")}
                  >
                    Supprimer
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-20 border-dashed flex flex-col gap-1"
                  onClick={() => encadreFileInputRef.current?.click()}
                  disabled={encadreUploading}
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {encadreUploading ? "Upload en cours…" : "Ajouter une image"}
                  </span>
                </Button>
              )}
              <input
                ref={encadreFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleEncadreImageUpload}
              />
              {encadreImageUrl && (
                <Input
                  value={encadreImageCaption}
                  onChange={(e) => setEncadreImageCaption(e.target.value)}
                  placeholder="Légende de l'image"
                  className="mt-2"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEncadreDialog(null)}>
              Annuler
            </Button>
            <Button onClick={insertEncadreBlock} disabled={!encadreTitle.trim()}>
              Insérer le bloc
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TipTapEditor;
