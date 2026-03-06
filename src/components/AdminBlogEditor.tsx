import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Plus, ArrowLeft, Trash2, Image as ImageIcon, Upload, Loader2,
  Eye, Edit, Save, FileText, Bold, Italic, Heading2, Heading3, List,
  ImagePlus, X, UploadCloud, ListOrdered, GripVertical, ChevronUp, ChevronDown,
  CalendarIcon
} from "lucide-react";
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
  content: string;
  caption?: string;
};

type TocEntry = {
  id: string;
  text: string;
  level: number;
  anchor: string;
};

const CATEGORIES = ["Technique", "Compétition", "Matériel", "Débutant", "Reportage", "Famille"];

const generateSlug = (title: string) =>
  title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const generateId = () => Math.random().toString(36).substring(2, 10);

const generateAnchor = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Parse existing content back into blocks
const parseContentToBlocks = (content: string): ContentBlock[] => {
  if (!content) return [{ id: generateId(), type: "text", content: "" }];
  const blocks: ContentBlock[] = [];
  const imageRegex = /\[IMAGE\]\((.*?)\)\{caption:(.*?)\}/g;
  let lastIndex = 0;
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index).trim();
    if (textBefore) blocks.push({ id: generateId(), type: "text", content: textBefore });
    blocks.push({ id: generateId(), type: "image", content: match[1], caption: match[2] });
    lastIndex = match.index + match[0].length;
  }
  const remaining = content.substring(lastIndex).trim();
  if (remaining) blocks.push({ id: generateId(), type: "text", content: remaining });
  if (blocks.length === 0) blocks.push({ id: generateId(), type: "text", content: "" });
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

// Extract TOC entries from content blocks
const extractTocFromBlocks = (blocks: ContentBlock[]): TocEntry[] => {
  const entries: TocEntry[] = [];
  for (const block of blocks) {
    if (block.type !== "text") continue;
    const lines = block.content.split("\n");
    for (const line of lines) {
      const h2Match = line.match(/^## (.+)/);
      const h3Match = line.match(/^### (.+)/);
      if (h2Match) {
        const text = h2Match[1].trim();
        entries.push({ id: generateId(), text, level: 2, anchor: generateAnchor(text) });
      } else if (h3Match) {
        const text = h3Match[1].trim();
        entries.push({ id: generateId(), text, level: 3, anchor: generateAnchor(text) });
      }
    }
  }
  return entries;
};

// Build TOC markdown to prepend to content
const buildTocMarkdown = (entries: TocEntry[]): string => {
  if (entries.length === 0) return "";
  const lines = entries.map(e => {
    const indent = e.level === 3 ? "  " : "";
    return `${indent}- [${e.text}](#${e.anchor})`;
  });
  return `[TOC]\n${lines.join("\n")}\n[/TOC]`;
};

const AdminBlogEditor = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "edit">("list");
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("Technique");
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [author, setAuthor] = useState("Info Pêche");
  const [isFree, setIsFree] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { id: generateId(), type: "text", content: "" },
  ]);
  const [previewMode, setPreviewMode] = useState(false);
  const [relatedIssueId, setRelatedIssueId] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<Date>(new Date());

  // TOC
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);
  const [includeToc, setIncludeToc] = useState(true);

  // Image references mapping: filename -> uploaded URL
  const [imageRefMap, setImageRefMap] = useState<Record<string, string>>({});
  const [uploadingRef, setUploadingRef] = useState<string | null>(null);

  // Detect image references like (nom_image.jpg) in text blocks
  const detectedImageRefs = (() => {
    const refs = new Set<string>();
    for (const block of contentBlocks) {
      if (block.type !== "text") continue;
      const matches = block.content.matchAll(/\(([^)]+\.(?:jpg|jpeg|png|gif|webp|avif))\)/gi);
      for (const m of matches) refs.add(m[1]);
    }
    return Array.from(refs);
  })();

  // Auto-update TOC when content blocks change
  useEffect(() => {
    const entries = extractTocFromBlocks(contentBlocks);
    setTocEntries(entries);
  }, [contentBlocks]);

  const { data: articles, isLoading } = useQuery({
    queryKey: ["admin-blog-articles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_articles").select("*").order("published_at", { ascending: false });
      if (error) throw error;
      return data as BlogArticle[];
    },
  });

  const { data: issues } = useQuery({
    queryKey: ["admin-issues-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("digital_issues").select("id, issue_number, title").order("issue_number", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: authors } = useQuery({
    queryKey: ["blog-authors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_authors").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data as { id: string; name: string; photo_url: string | null; description: string | null; external_url: string | null }[];
    },
  });

  const resetForm = () => {
    setTitle(""); setSlug(""); setExcerpt(""); setCategory("Technique"); setAuthor("Info Pêche");
    setIsFree(false); setCoverImage(null); setContentBlocks([{ id: generateId(), type: "text", content: "" }]);
    setRelatedIssueId(null); setPreviewMode(false); setTocEntries([]); setIncludeToc(true);
    setImageRefMap({}); setAuthorId(null); setPublishedAt(new Date());
  };

  const openEditor = (article?: BlogArticle) => {
    if (article) {
      setEditingArticle(article);
      setTitle(article.title); setSlug(article.slug); setExcerpt(article.excerpt);
      setCategory(article.category || "Technique"); setAuthor(article.author || "Info Pêche");
      setIsFree(article.is_free); setCoverImage(article.cover_image);
      setPublishedAt(article.published_at ? new Date(article.published_at) : new Date());
      // Match author by name
      const matchedAuthor = authors?.find(a => a.name === article.author);
      if (matchedAuthor) setAuthorId(matchedAuthor.id);
      else setAuthorId(null);
      // Strip existing TOC from content before parsing
      const contentWithoutToc = article.content.replace(/\[TOC\][\s\S]*?\[\/TOC\]\n*/g, "");
      setContentBlocks(parseContentToBlocks(contentWithoutToc));
      setRelatedIssueId(article.related_issue_id);
      setIncludeToc(article.content.includes("[TOC]"));
    } else {
      setEditingArticle(null); resetForm();
    }
    setView("edit");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingArticle) setSlug(generateSlug(val));
  };

  const uploadImage = async (file: File, purpose: "cover" | "article"): Promise<string | null> => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${purpose}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) { toast.error("Erreur upload : " + error.message); return null; }
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
  const handleRefImageUpload = async (refName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingRef(refName);
    const url = await uploadImage(file, "article");
    if (url) setImageRefMap(prev => ({ ...prev, [refName]: url }));
    setUploadingRef(null);
  };

  const addImageBlock = async (e: React.ChangeEvent<HTMLInputElement>, afterIndex: number) => {
    const files = e.target.files;
    if (!files) return;
    const newBlocks: ContentBlock[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadImage(file, "article");
      if (url) newBlocks.push({ id: generateId(), type: "image", content: url, caption: "" });
    }
    if (newBlocks.length > 0) {
      setContentBlocks(prev => { const copy = [...prev]; copy.splice(afterIndex + 1, 0, ...newBlocks); return copy; });
    }
  };

  const addTextBlock = (afterIndex: number) => {
    setContentBlocks(prev => { const copy = [...prev]; copy.splice(afterIndex + 1, 0, { id: generateId(), type: "text", content: "" }); return copy; });
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setContentBlocks(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)));
  };

  const removeBlock = (id: string) => {
    setContentBlocks(prev => prev.length <= 1 ? prev : prev.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    setContentBlocks(prev => {
      const copy = [...prev];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= copy.length) return prev;
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
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

  const updateTocEntry = (id: string, newText: string) => {
    setTocEntries(prev => prev.map(e => e.id === id ? { ...e, text: newText, anchor: generateAnchor(newText) } : e));
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !excerpt.trim()) { toast.error("Titre, slug et chapeau sont obligatoires"); return; }
    // Check unmapped image refs
    const unmapped = detectedImageRefs.filter(r => !imageRefMap[r]);
    if (unmapped.length > 0) {
      const proceed = confirm(`${unmapped.length} image(s) non importée(s) : ${unmapped.join(", ")}. Les références seront supprimées. Continuer ?`);
      if (!proceed) return;
    }
    setSaving(true);
    
    // Replace image refs with uploaded URLs or remove them
    let processedBlocks = contentBlocks.map(block => {
      if (block.type !== "text") return block;
      let text = block.content;
      for (const [refName, url] of Object.entries(imageRefMap)) {
        // Replace (refName) with an image block marker
        text = text.replace(new RegExp(`\\(${refName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'), `\n\n[IMAGE](${url}){caption:}\n\n`);
      }
      // Remove unmapped refs
      for (const ref of unmapped) {
        text = text.replace(new RegExp(`\\(${ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'), '');
      }
      return { ...block, content: text };
    });
    
    let content = blocksToContent(processedBlocks);
    
    // Prepend TOC if enabled
    if (includeToc && tocEntries.length > 0) {
      const tocMd = buildTocMarkdown(tocEntries);
      content = tocMd + "\n\n" + content;
    }

    // Resolve author name from selected author
    const selectedAuthor = authors?.find(a => a.id === authorId);
    const authorName = selectedAuthor?.name || author;

    const articleData = {
      title: title.trim(), slug: slug.trim(), excerpt: excerpt.trim(), content, cover_image: coverImage,
      category, author: authorName, is_free: isFree, related_issue_id: relatedIssueId,
      published_at: publishedAt.toISOString(),
    };
    let error;
    if (editingArticle) {
      ({ error } = await supabase.from("blog_articles").update(articleData).eq("id", editingArticle.id));
    } else {
      ({ error } = await supabase.from("blog_articles").insert(articleData));
    }
    if (error) { toast.error("Erreur : " + error.message); }
    else {
      toast.success(editingArticle ? "Article mis à jour" : "Article créé");
      queryClient.invalidateQueries({ queryKey: ["admin-blog-articles"] });
      setView("list"); resetForm();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet article ?")) return;
    const { error } = await supabase.from("blog_articles").delete().eq("id", id);
    if (error) toast.error("Erreur : " + error.message);
    else { toast.success("Article supprimé"); queryClient.invalidateQueries({ queryKey: ["admin-blog-articles"] }); }
  };

  // Render content preview
  const renderPreview = (text: string) => {
    // Strip TOC block
    const cleanText = text.replace(/\[TOC\][\s\S]*?\[\/TOC\]\n*/g, "");
    return cleanText.split("\n\n").map((paragraph, i) => {
      const imgMatch = paragraph.match(/^\[IMAGE\]\((.*?)\)\{caption:(.*?)\}$/);
      if (imgMatch) {
        return (
          <figure key={i} className="my-8">
            <img src={imgMatch[1]} alt={imgMatch[2] || ""} className="w-full rounded-xl" />
            {imgMatch[2] && <figcaption className="text-sm text-muted-foreground text-center mt-3 italic">{imgMatch[2]}</figcaption>}
          </figure>
        );
      }
      if (paragraph.startsWith("### ")) return <h3 key={i} className="text-xl font-bold mt-8 mb-3 font-[Playfair_Display]">{paragraph.replace("### ", "")}</h3>;
      if (paragraph.startsWith("## ")) return <h2 key={i} className="text-2xl font-bold mt-10 mb-4 font-[Playfair_Display] border-l-4 border-primary pl-4">{paragraph.replace("## ", "")}</h2>;
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
      return <p key={i} className="my-4 text-[1.05rem] leading-[1.85]" dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }} />;
    });
  };

  // ===== LIST VIEW =====
  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold">Articles de blog</h2>
          <Button onClick={() => openEditor()} className="gap-2">
            <Plus className="w-4 h-4" /> Nouvel article
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
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
                      {article.category && <Badge variant="outline" className="text-xs flex-shrink-0">{article.category}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{article.excerpt}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {article.published_at && new Date(article.published_at).toLocaleDateString("fr-FR")} · {article.author}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEditor(article)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(article.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {articles?.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun article. Créez le premier !</p>}
          </div>
        )}
      </div>
    );
  }

  // ===== EDIT VIEW =====
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => { setView("list"); resetForm(); }}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
        <h2 className="text-xl font-bold flex-1">
          {editingArticle ? "Modifier l'article" : "Nouvel article"}
        </h2>
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
          <CardContent className="p-8 max-w-3xl mx-auto">
            {coverImage && <img src={coverImage} alt={title} className="w-full aspect-[16/9] object-cover rounded-xl mb-8" />}
            <h1 className="text-3xl font-bold mb-4 font-[Playfair_Display]">{title || "Sans titre"}</h1>
            <p className="text-lg text-muted-foreground italic mb-8 border-l-4 border-primary pl-4">{excerpt}</p>
            {/* TOC preview */}
            {includeToc && tocEntries.length > 0 && (
              <nav className="bg-muted/50 border border-border rounded-xl p-6 mb-10">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <ListOrdered className="w-4 h-4" /> Sommaire
                </h2>
                <ol className="space-y-2">
                  {tocEntries.map((e, i) => (
                    <li key={e.id} className={`text-sm ${e.level === 3 ? "ml-6 text-muted-foreground" : "font-medium text-foreground"}`}>
                      <a href={`#${e.anchor}`} className="hover:text-primary transition-colors">
                        {e.level === 2 && <span className="text-primary mr-2">{tocEntries.filter(t => t.level === 2).indexOf(e) + 1}.</span>}
                        {e.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            <div className="prose max-w-none">{renderPreview(blocksToContent(contentBlocks))}</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Title */}
            <Card>
              <CardHeader><CardTitle className="text-base">① Titre de l'article</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="Collez le titre de l'article ici" className="text-lg font-semibold" />
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Slug (URL)</Label>
                  <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="slug-automatique" className="font-mono text-sm" />
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Cover image */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-4 h-4" /> ② Image de couverture</CardTitle></CardHeader>
              <CardContent>
                {coverImage ? (
                  <div className="relative">
                    <img src={coverImage} alt="" className="w-full aspect-[16/9] object-cover rounded-lg" />
                    <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setCoverImage(null)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors">
                    {uploadingCover ? <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /> : (
                      <><Upload className="w-8 h-8 text-muted-foreground mb-2" /><span className="text-sm text-muted-foreground">Cliquez pour charger l'image cover</span></>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  </label>
                )}
              </CardContent>
            </Card>

            {/* Step 3: Intro / Excerpt */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">③ Introduction / Chapeau</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Collez l'introduction de l'article ici..." rows={4} className="leading-relaxed" />
              </CardContent>
            </Card>

            {/* Step 4: Body content - blocks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  ④ Corps de l'article
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    Collez le texte brut, utilisez ## pour les titres H2, ### pour les H3
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contentBlocks.map((block, index) => (
                  <div key={block.id} className="group relative border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">{block.type === "text" ? "Texte" : "Image"}</Badge>
                      <div className="flex-1" />
                      {/* Move up/down */}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveBlock(index, "up")} disabled={index === 0}>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveBlock(index, "down")} disabled={index === contentBlocks.length - 1}>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                      {block.type === "text" && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting(block.id, "**", "**")} title="Gras"><Bold className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting(block.id, "*", "*")} title="Italique"><Italic className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting(block.id, "\n\n## ", "\n\n")} title="Titre H2"><Heading2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting(block.id, "\n\n### ", "\n\n")} title="Titre H3"><Heading3 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting(block.id, "\n- ", "")} title="Liste"><List className="w-3.5 h-3.5" /></Button>
                        </div>
                      )}
                      {contentBlocks.length > 1 && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeBlock(block.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      )}
                    </div>

                    {block.type === "text" ? (
                      <Textarea
                        data-block-id={block.id}
                        value={block.content}
                        onChange={e => updateBlock(block.id, { content: e.target.value })}
                        placeholder="Collez le texte de l'article ici. Utilisez ## pour les titres de sections, ### pour les sous-titres..."
                        rows={14}
                        className="font-mono text-sm leading-relaxed"
                      />
                    ) : (
                      <div className="space-y-3">
                        <img src={block.content} alt={block.caption || ""} className="w-full max-h-72 object-contain rounded-lg bg-muted" />
                        <Input value={block.caption || ""} onChange={e => updateBlock(block.id, { caption: e.target.value })} placeholder="Légende de l'image (optionnel)" className="text-sm" />
                      </div>
                    )}

                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                      <Button variant="outline" size="sm" onClick={() => addTextBlock(index)} className="text-xs gap-1"><Plus className="w-3 h-3" /> Texte</Button>
                      <label>
                        <Button variant="outline" size="sm" className="text-xs gap-1" asChild><span><ImageIcon className="w-3 h-3" /> Images</span></Button>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={e => addImageBlock(e, index)} />
                      </label>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Image References Panel */}
            {detectedImageRefs.length > 0 && (
              <Card className="border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImagePlus className="w-4 h-4 text-amber-600" /> Images détectées dans le texte
                    <Badge variant="outline" className="ml-auto text-amber-700 border-amber-300">
                      {detectedImageRefs.filter(r => imageRefMap[r]).length}/{detectedImageRefs.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Les références <code className="bg-muted px-1 rounded">(nom_image.jpg)</code> trouvées dans votre texte sont listées ci-dessous. Importez chaque image correspondante.
                  </p>
                  {detectedImageRefs.map(refName => (
                    <div key={refName} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                        {imageRefMap[refName] ? (
                          <img src={imageRefMap[refName]} alt={refName} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-medium truncate">{refName}</p>
                        {imageRefMap[refName] ? (
                          <p className="text-xs text-green-600 flex items-center gap-1">✅ Importée</p>
                        ) : (
                          <p className="text-xs text-amber-600">En attente d'import</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {imageRefMap[refName] ? (
                          <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={() => setImageRefMap(prev => { const copy = { ...prev }; delete copy[refName]; return copy; })}>
                            <X className="w-4 h-4" />
                          </Button>
                        ) : null}
                        <label>
                          <Button variant={imageRefMap[refName] ? "outline" : "default"} size="sm" className="h-8 text-xs gap-1" asChild disabled={uploadingRef === refName}>
                            <span>
                              {uploadingRef === refName ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                              {imageRefMap[refName] ? "Remplacer" : "Importer"}
                            </span>
                          </Button>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleRefImageUpload(refName, e)} />
                        </label>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* TOC Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4" /> Sommaire (SEO)
                  </span>
                  <div className="flex items-center gap-2">
                    <Checkbox id="include_toc" checked={includeToc} onCheckedChange={(checked) => setIncludeToc(checked === true)} />
                    <Label htmlFor="include_toc" className="text-xs cursor-pointer">Inclure le sommaire</Label>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tocEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Aucun titre détecté. Utilisez <code className="bg-muted px-1.5 py-0.5 rounded text-xs">## Titre</code> dans vos blocs texte pour générer le sommaire automatiquement.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">Le sommaire est généré automatiquement depuis vos titres ## et ###. Vous pouvez éditer le texte affiché ci-dessous :</p>
                    {tocEntries.map((entry, i) => (
                      <div key={entry.id} className={`flex items-center gap-2 ${entry.level === 3 ? "ml-6" : ""}`}>
                        <span className="text-xs text-muted-foreground w-8 flex-shrink-0">
                          {entry.level === 2 ? `H2` : `H3`}
                        </span>
                        <Input
                          value={entry.text}
                          onChange={e => updateTocEntry(entry.id, e.target.value)}
                          className="text-sm h-8"
                        />
                        <span className="text-xs text-muted-foreground font-mono flex-shrink-0">#{entry.anchor}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Paramètres</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Auteur</Label>
                  <Input value={author} onChange={e => setAuthor(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Numéro associé</Label>
                  <Select value={relatedIssueId || "none"} onValueChange={v => setRelatedIssueId(v === "none" ? null : v)}>
                    <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {issues?.map(issue => <SelectItem key={issue.id} value={issue.id}>N°{issue.issue_number} – {issue.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Checkbox id="is_free" checked={isFree} onCheckedChange={(checked) => setIsFree(checked === true)} />
                  <Label htmlFor="is_free" className="cursor-pointer">Article en accès libre</Label>
                </div>
                <p className="text-xs text-muted-foreground">{isFree ? "✅ Accessible à tout le monde" : "🔒 Réservé aux abonnés"}</p>
              </CardContent>
            </Card>

            {/* Quick guide */}
            <Card>
              <CardHeader><CardTitle className="text-base">Guide rapide</CardTitle></CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p><strong>Workflow :</strong></p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Collez le titre</li>
                  <li>Chargez l'image cover</li>
                  <li>Collez l'intro</li>
                  <li>Collez le texte brut du corps</li>
                  <li>Importez les images référencées <code className="bg-muted px-1 rounded">(photo.jpg)</code></li>
                </ol>
                <div className="border-t border-border pt-2 mt-3">
                  <p><strong>Mise en forme :</strong></p>
                  <p><code className="bg-muted px-1 rounded">## Titre</code> → Section H2</p>
                  <p><code className="bg-muted px-1 rounded">### Sous-titre</code> → Section H3</p>
                  <p><code className="bg-muted px-1 rounded">**texte**</code> → <strong>Gras</strong></p>
                  <p><code className="bg-muted px-1 rounded">*texte*</code> → <em>Italique</em></p>
                  <p><code className="bg-muted px-1 rounded">- item</code> → Liste à puces</p>
                  <p><code className="bg-muted px-1 rounded">&gt; citation</code> → Citation</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogEditor;
