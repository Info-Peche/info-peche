import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plus, ArrowLeft, Trash2, Image as ImageIcon, Upload, Loader2,
  GripVertical, Eye, Edit, Save, FileText, Bold, Italic, Heading2, Heading3, List, Sparkles, ImagePlus, Wand2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type BlogArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  category: string | null;
  is_free: boolean;
  author: string | null;
  published_at: string | null;
  paywall_preview_length: number | null;
  related_issue_id: string | null;
};

type ContentBlock = {
  id: string;
  type: "text" | "image";
  content: string; // text or image URL
  caption?: string;
};

const CATEGORIES = ["Technique", "Compétition", "Matériel", "Débutant", "Reportage", "Famille"];

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const generateId = () => Math.random().toString(36).substring(2, 10);

// Parse existing content back into blocks
const parseContentToBlocks = (content: string): ContentBlock[] => {
  if (!content) return [{ id: generateId(), type: "text", content: "" }];

  const blocks: ContentBlock[] = [];
  const imageRegex = /\[IMAGE\]\((.*?)\)\{caption:(.*?)\}/g;
  let lastIndex = 0;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index).trim();
    if (textBefore) {
      blocks.push({ id: generateId(), type: "text", content: textBefore });
    }
    blocks.push({ id: generateId(), type: "image", content: match[1], caption: match[2] });
    lastIndex = match.index + match[0].length;
  }

  const remaining = content.substring(lastIndex).trim();
  if (remaining) {
    blocks.push({ id: generateId(), type: "text", content: remaining });
  }

  if (blocks.length === 0) {
    blocks.push({ id: generateId(), type: "text", content: "" });
  }

  return blocks;
};

const blocksToContent = (blocks: ContentBlock[]): string => {
  return blocks
    .map(b => {
      if (b.type === "image") return `[IMAGE](${b.content}){caption:${b.caption || ""}}`;
      return b.content;
    })
    .join("\n\n");
};

const AdminBlogEditor = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "edit">("list");
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [saving, setSaving] = useState(false);
  const [reformattingExcerpt, setReformattingExcerpt] = useState(false);
  const [reformattingBlocks, setReformattingBlocks] = useState<Set<string>>(new Set());
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const [generatingArticle, setGeneratingArticle] = useState(false);
  const [rawPasteText, setRawPasteText] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("Technique");
  const [author, setAuthor] = useState("Info Pêche");
  const [isFree, setIsFree] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { id: generateId(), type: "text", content: "" },
  ]);
  const [previewMode, setPreviewMode] = useState(false);
  const [relatedIssueId, setRelatedIssueId] = useState<string | null>(null);

  const reformatWithAI = async (rawText: string, type: "chapeau" | "content"): Promise<string | null> => {
    if (!rawText.trim()) {
      toast.error("Collez d'abord du texte à reformater");
      return null;
    }
    try {
      const { data, error } = await supabase.functions.invoke("reformat-article", {
        body: { rawText, type },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return null;
      }
      return data.result;
    } catch (e: any) {
      toast.error("Erreur IA : " + (e.message || "inconnue"));
      return null;
    }
  };

  const handleReformatExcerpt = async () => {
    setReformattingExcerpt(true);
    const result = await reformatWithAI(excerpt, "chapeau");
    if (result) setExcerpt(result);
    setReformattingExcerpt(false);
  };

  const handleReformatBlock = async (blockId: string) => {
    const block = contentBlocks.find(b => b.id === blockId);
    if (!block || block.type !== "text") return;
    setReformattingBlocks(prev => new Set(prev).add(blockId));
    const result = await reformatWithAI(block.content, "content");
    if (result) updateBlock(blockId, { content: result });
    setReformattingBlocks(prev => { const s = new Set(prev); s.delete(blockId); return s; });
  };

  const handleGenerateImage = async (blockId: string, afterIndex: number) => {
    const block = contentBlocks.find(b => b.id === blockId);
    if (!block || block.type !== "text" || !block.content.trim()) {
      toast.error("Ajoutez du texte pour générer une image");
      return;
    }
    setGeneratingImages(prev => new Set(prev).add(blockId));
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-image", {
        body: { articleText: block.content },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      if (data?.imageUrl) {
        setContentBlocks(prev => {
          const copy = [...prev];
          copy.splice(afterIndex + 1, 0, {
            id: generateId(),
            type: "image",
            content: data.imageUrl,
            caption: "",
          });
          return copy;
        });
        toast.success("Image générée et ajoutée !");
      }
    } catch (e: any) {
      toast.error("Erreur : " + (e.message || "inconnue"));
    } finally {
      setGeneratingImages(prev => { const s = new Set(prev); s.delete(blockId); return s; });
    }
  };
  const handleCreateArticleAI = async () => {
    if (!rawPasteText.trim()) {
      toast.error("Collez d'abord le texte brut de l'article");
      return;
    }
    setGeneratingArticle(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-article-ai", {
        body: { rawText: rawPasteText },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      const article = data.article;
      if (article) {
        setTitle(article.title || "");
        setSlug(generateSlug(article.title || ""));
        setExcerpt(article.excerpt || "");
        setCategory(article.category || "Technique");
        setContentBlocks([{ id: generateId(), type: "text", content: article.content || "" }]);
        setShowCreateDialog(false);
        setRawPasteText("");
        toast.success("Article généré avec succès ! Vérifiez et ajustez si nécessaire.");
      }
    } catch (e: any) {
      toast.error("Erreur IA : " + (e.message || "inconnue"));
    } finally {
      setGeneratingArticle(false);
    }
  };

  const { data: articles, isLoading } = useQuery({
    queryKey: ["admin-blog-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_articles")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as BlogArticle[];
    },
  });

  const { data: issues } = useQuery({
    queryKey: ["admin-issues-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("digital_issues")
        .select("id, issue_number, title")
        .order("issue_number", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setCategory("Technique");
    setAuthor("Info Pêche");
    setIsFree(false);
    setCoverImage(null);
    setContentBlocks([{ id: generateId(), type: "text", content: "" }]);
    setRelatedIssueId(null);
    setPreviewMode(false);
  };

  const openEditor = (article?: BlogArticle) => {
    if (article) {
      setEditingArticle(article);
      setTitle(article.title);
      setSlug(article.slug);
      setExcerpt(article.excerpt);
      setCategory(article.category || "Technique");
      setAuthor(article.author || "Info Pêche");
      setIsFree(article.is_free);
      setCoverImage(article.cover_image);
      setContentBlocks(parseContentToBlocks(article.content));
      setRelatedIssueId(article.related_issue_id);
    } else {
      setEditingArticle(null);
      resetForm();
    }
    setView("edit");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingArticle) setSlug(generateSlug(val));
  };

  const uploadImage = async (file: File, purpose: "cover" | "article"): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${purpose}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from("blog-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error("Erreur lors de l'upload : " + error.message);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from("blog-images").getPublicUrl(path);
    return publicUrl;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const url = await uploadImage(file, "cover");
    if (url) setCoverImage(url);
    setUploadingCover(false);
  };

  const addImageBlock = async (e: React.ChangeEvent<HTMLInputElement>, afterIndex: number) => {
    const files = e.target.files;
    if (!files) return;

    const newBlocks: ContentBlock[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadImage(file, "article");
      if (url) {
        newBlocks.push({ id: generateId(), type: "image", content: url, caption: "" });
      }
    }

    if (newBlocks.length > 0) {
      setContentBlocks(prev => {
        const copy = [...prev];
        copy.splice(afterIndex + 1, 0, ...newBlocks);
        return copy;
      });
    }
  };

  const addTextBlock = (afterIndex: number) => {
    setContentBlocks(prev => {
      const copy = [...prev];
      copy.splice(afterIndex + 1, 0, { id: generateId(), type: "text", content: "" });
      return copy;
    });
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setContentBlocks(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)));
  };

  const removeBlock = (id: string) => {
    setContentBlocks(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(b => b.id !== id);
    });
  };

  const insertFormatting = (blockId: string, prefix: string, suffix: string) => {
    const textarea = document.querySelector(`textarea[data-block-id="${blockId}"]`) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const block = contentBlocks.find(b => b.id === blockId);
    if (!block) return;
    const text = block.content;
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
    updateBlock(blockId, { content: newText });
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !excerpt.trim()) {
      toast.error("Titre, slug et chapeau sont obligatoires");
      return;
    }

    setSaving(true);
    const content = blocksToContent(contentBlocks);
    const articleData = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content,
      cover_image: coverImage,
      category,
      author,
      is_free: isFree,
      related_issue_id: relatedIssueId,
      published_at: editingArticle?.published_at || new Date().toISOString(),
    };

    let error;
    if (editingArticle) {
      ({ error } = await supabase.from("blog_articles").update(articleData).eq("id", editingArticle.id));
    } else {
      ({ error } = await supabase.from("blog_articles").insert(articleData));
    }

    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success(editingArticle ? "Article mis à jour" : "Article créé");
      queryClient.invalidateQueries({ queryKey: ["admin-blog-articles"] });
      setView("list");
      resetForm();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet article ?")) return;
    const { error } = await supabase.from("blog_articles").delete().eq("id", id);
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success("Article supprimé");
      queryClient.invalidateQueries({ queryKey: ["admin-blog-articles"] });
    }
  };

  // Render content preview (same as blog article renderer)
  const renderPreview = (text: string) => {
    return text.split("\n\n").map((paragraph, i) => {
      // Image block
      const imgMatch = paragraph.match(/^\[IMAGE\]\((.*?)\)\{caption:(.*?)\}$/);
      if (imgMatch) {
        return (
          <figure key={i} className="my-6">
            <img src={imgMatch[1]} alt={imgMatch[2] || ""} className="w-full rounded-lg" />
            {imgMatch[2] && <figcaption className="text-sm text-muted-foreground text-center mt-2 italic">{imgMatch[2]}</figcaption>}
          </figure>
        );
      }
      if (paragraph.startsWith("### ")) return <h3 key={i} className="text-xl font-bold mt-6 mb-3">{paragraph.replace("### ", "")}</h3>;
      if (paragraph.startsWith("## ")) return <h2 key={i} className="text-2xl font-bold mt-8 mb-4">{paragraph.replace("## ", "")}</h2>;
      if (paragraph.startsWith("- ")) {
        const items = paragraph.split("\n").filter(Boolean);
        return (
          <ul key={i} className="list-disc pl-6 space-y-2 my-4">
            {items.map((item, j) => (
              <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^- /, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }} />
            ))}
          </ul>
        );
      }
      return <p key={i} className="my-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }} />;
    });
  };

  // --- LIST VIEW ---
  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Articles de blog</h2>
          <Button onClick={() => openEditor()} className="gap-2">
            <Plus className="w-4 h-4" /> Nouvel article
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {articles?.map(article => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  {article.cover_image ? (
                    <img src={article.cover_image} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{article.title}</h3>
                      <Badge variant={article.is_free ? "secondary" : "default"} className="text-xs flex-shrink-0">
                        {article.is_free ? "Libre" : "Premium"}
                      </Badge>
                      {article.category && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">{article.category}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{article.excerpt}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {article.published_at && new Date(article.published_at).toLocaleDateString("fr-FR")}
                      {" · "}{article.author}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEditor(article)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(article.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {articles?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Aucun article. Créez le premier !</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- EDIT VIEW ---
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => { setView("list"); resetForm(); }}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
        <h2 className="text-xl font-bold flex-1">
          {editingArticle ? "Modifier l'article" : "Nouvel article"}
        </h2>
        {!editingArticle && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Wand2 className="w-4 h-4" /> Créer avec l'IA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un article avec l'IA Info-Pêche</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Collez ici le texte brut copié du PDF. L'IA va le restructurer en article de blog complet avec le ton expert Info-Pêche : titre, chapeau, contenu structuré avec titres, sous-titres, listes et mise en forme.
              </p>
              <Textarea
                value={rawPasteText}
                onChange={e => setRawPasteText(e.target.value)}
                placeholder="Collez tout le texte brut du PDF ici..."
                rows={15}
                className="font-mono text-sm"
              />
              <Button
                onClick={handleCreateArticleAI}
                disabled={generatingArticle || !rawPasteText.trim()}
                className="w-full gap-2"
              >
                {generatingArticle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {generatingArticle ? "Génération en cours..." : "Générer l'article"}
              </Button>
            </DialogContent>
          </Dialog>
        )}
        <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
          {previewMode ? <Edit className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {previewMode ? "Éditer" : "Aperçu"}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Enregistrer
        </Button>
      </div>

      {previewMode ? (
        <Card>
          <CardContent className="p-8">
            {coverImage && <img src={coverImage} alt={title} className="w-full h-64 object-cover rounded-xl mb-6" />}
            <h1 className="text-3xl font-bold mb-4">{title || "Sans titre"}</h1>
            <p className="text-lg text-muted-foreground italic mb-8 border-l-4 border-primary pl-4">{excerpt}</p>
            <div className="prose max-w-none">
              {renderPreview(blocksToContent(contentBlocks))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Image de couverture
                </CardTitle>
              </CardHeader>
              <CardContent>
                {coverImage ? (
                  <div className="relative">
                    <img src={coverImage} alt="" className="w-full h-48 object-cover rounded-lg" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setCoverImage(null)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors">
                    {uploadingCover ? (
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Cliquez pour charger une image</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  </label>
                )}
              </CardContent>
            </Card>

            {/* Title */}
            <div className="space-y-2">
              <Label>Titre de l'article</Label>
              <Input
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Ex : L'asticot rouge, vraiment plus efficace ?"
                className="text-lg font-semibold"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="asticot-rouge-vraiment-plus-efficace"
                className="font-mono text-sm"
              />
            </div>

            {/* Chapeau / Intro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Chapeau / Introduction</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReformatExcerpt}
                    disabled={reformattingExcerpt || !excerpt.trim()}
                    className="text-xs gap-1"
                  >
                    {reformattingExcerpt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Reformater avec l'IA
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  placeholder="Collez ici le chapeau brut copié du PDF. Cliquez ensuite sur 'Reformater avec l'IA' pour le nettoyer."
                  rows={4}
                  className="leading-relaxed"
                />
              </CardContent>
            </Card>

            {/* Content blocks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contenu de l'article</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contentBlocks.map((block, index) => (
                  <div key={block.id} className="group relative border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">
                        {block.type === "text" ? "Texte" : "Image"}
                      </Badge>
                      <div className="flex-1" />
                      {block.type === "text" && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting(block.id, "**", "**")} title="Gras">
                            <Bold className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting(block.id, "*", "*")} title="Italique">
                            <Italic className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting(block.id, "\n\n## ", "\n\n")} title="Titre H2">
                            <Heading2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting(block.id, "\n\n### ", "\n\n")} title="Titre H3">
                            <Heading3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting(block.id, "\n- ", "")} title="Liste">
                            <List className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                      {contentBlocks.length > 1 && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeBlock(block.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    {block.type === "text" ? (
                      <div className="space-y-2">
                        <Textarea
                          data-block-id={block.id}
                          value={block.content}
                          onChange={e => updateBlock(block.id, { content: e.target.value })}
                          placeholder="Collez ici le texte brut copié du PDF. Cliquez ensuite sur '✨ Reformater' pour que l'IA nettoie et structure le contenu."
                          rows={10}
                          className="font-mono text-sm leading-relaxed"
                        />
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReformatBlock(block.id)}
                            disabled={reformattingBlocks.has(block.id) || generatingImages.has(block.id) || !block.content.trim()}
                            className="text-xs gap-1"
                          >
                            {reformattingBlocks.has(block.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            Reformater avec l'IA
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateImage(block.id, index)}
                            disabled={generatingImages.has(block.id) || reformattingBlocks.has(block.id) || !block.content.trim()}
                            className="text-xs gap-1"
                          >
                            {generatingImages.has(block.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                            Générer une image IA
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <img src={block.content} alt={block.caption || ""} className="w-full max-h-64 object-contain rounded-lg bg-muted" />
                        <Input
                          value={block.caption || ""}
                          onChange={e => updateBlock(block.id, { caption: e.target.value })}
                          placeholder="Légende de l'image (optionnel)"
                          className="text-sm"
                        />
                      </div>
                    )}

                    {/* Add block buttons */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                      <Button variant="outline" size="sm" onClick={() => addTextBlock(index)} className="text-xs gap-1">
                        <Plus className="w-3 h-3" /> Texte
                      </Button>
                      <label>
                        <Button variant="outline" size="sm" className="text-xs gap-1" asChild>
                          <span>
                            <ImageIcon className="w-3 h-3" /> Images
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={e => addImageBlock(e, index)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Paramètres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Auteur</Label>
                  <Input value={author} onChange={e => setAuthor(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Numéro associé</Label>
                  <Select value={relatedIssueId || "none"} onValueChange={v => setRelatedIssueId(v === "none" ? null : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {issues?.map(issue => (
                        <SelectItem key={issue.id} value={issue.id}>
                          N°{issue.issue_number} – {issue.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Checkbox
                    id="is_free"
                    checked={isFree}
                    onCheckedChange={(checked) => setIsFree(checked === true)}
                  />
                  <Label htmlFor="is_free" className="cursor-pointer">
                    Article en accès libre
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isFree
                    ? "✅ Accessible à tout le monde"
                    : "🔒 Réservé aux abonnés (1 an / 2 ans)"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogEditor;
