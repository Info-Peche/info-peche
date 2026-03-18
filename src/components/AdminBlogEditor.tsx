import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminAuthorManager from "@/components/AdminAuthorManager";
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
  Eye, Edit, Save, FileText, CalendarIcon, UploadCloud, X, ArrowRight,
  ImagePlus, FileDown
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import TipTapEditor from "@/components/TipTapEditor";
import "@/components/TipTapStyles.css";

type BlogArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  category: string | null;
  is_free: boolean;
  is_featured: boolean;
  display_order: number | null;
  author: string | null;
  published_at: string | null;
  paywall_preview_length: number | null;
  related_issue_id: string | null;
  key_points: string[] | null;
  status: string;
};

// "import" = paste raw text + image URL map, "editor" = TipTap WYSIWYG
type EditStep = "import" | "editor";

const CATEGORIES = ["Technique", "Compétition", "Matériel", "Débutant", "Reportage", "Famille"];

const generateSlug = (title: string) =>
  title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const normalizeForMatch = (name: string) =>
  name.toLowerCase().replace(/\.(jpg|jpeg|png|gif|webp|avif)$/i, "").replace(/[\s_\-]+/g, "").trim();

const formatInline = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
};

const escapeHtmlAttr = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Convert raw pasted text (from Notion/Word) + image URL map into HTML for TipTap
 */
const convertRawToHtml = (rawText: string, imageMap: Record<string, string>): string => {
  let text = rawText;

  // Replace image references with actual <img> tags
  for (const [refName, url] of Object.entries(imageMap)) {
    const escapedRef = refName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match (refName) with optional inner spaces, followed by the caption on the same line
    const captionRegex = new RegExp(`\\(\\s*${escapedRef}\\s*\\)\\s*([^\\n\\r]*)`, 'gi');
    text = text.replace(captionRegex, (_, captionRaw) => {
      const caption = captionRaw?.trim() || "";
      const safeCaption = escapeHtmlAttr(caption);
      return `\n\n<img src="${url}" alt="${safeCaption}" data-caption="${safeCaption}" />\n\n`;
    });
  }

  // Remove unmapped image refs
  text = text.replace(/\([^)]*(?:IMG|DSC|P\d|_BGN|DSCN|DSCF|KKM)[^)]*\)\s*[^\n(]*/gi, '');

  // Convert :::conseil and :::encadre blocks
  text = text.replace(/:::(conseil|encadre)\s+(.+?)\n([\s\S]*?):::/g, (_, type, title, body) => {
    const label = type === "conseil" ? "Le conseil du prof" : "Encadré";
    const emoji = type === "conseil" ? "🎓" : "📋";
    const cleanBody = body.trim();
    return `<div class="encadre-block encadre-${type}" data-type="${type}"><div class="encadre-header"><span>${emoji} ${label}</span></div><div class="encadre-body"><h4>${title.trim()}</h4><p>${cleanBody}</p></div></div>`;
  });




  // Convert line by line to HTML
  const lines = text.split("\n");
  let html = "";
  let inList = false;
  let listType = "";

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; }
      continue;
    }

    // Already HTML
    if (t.startsWith("<")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += t; continue; }

    // Headings
    if (t.startsWith("#### ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<h4>${t.slice(5)}</h4>`; continue; }
    if (t.startsWith("### ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<h3>${t.slice(4)}</h3>`; continue; }
    if (t.startsWith("## ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<h2>${t.slice(3)}</h2>`; continue; }

    // Blockquote
    if (t.startsWith("> ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<blockquote><p>${t.slice(2)}</p></blockquote>`; continue; }

    // Bullet list
    if (t.startsWith("- ")) {
      if (!inList || listType !== "ul") { if (inList) html += listType === "ul" ? "</ul>" : "</ol>"; html += "<ul>"; inList = true; listType = "ul"; }
      html += `<li>${formatInline(t.slice(2))}</li>`; continue;
    }

    // Numbered list
    const numMatch = t.match(/^(\d+)[.)]\s*(.+)/);
    if (numMatch) {
      if (!inList || listType !== "ol") { if (inList) html += listType === "ul" ? "</ul>" : "</ol>"; html += "<ol>"; inList = true; listType = "ol"; }
      html += `<li>${formatInline(numMatch[2])}</li>`; continue;
    }

    if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; }
    html += `<p>${formatInline(t)}</p>`;
  }
  if (inList) html += listType === "ul" ? "</ul>" : "</ol>";

  return html;
};

/**
 * Convert legacy stored content (markdown + [IMAGE] tags) to HTML
 */
const convertLegacyToHtml = (content: string): string => {
  if (content.trim().startsWith("<") && (content.includes("</p>") || content.includes("</h2>"))) {
    return content;
  }
  let text = content.replace(/\[TOC\][\s\S]*?\[\/TOC\]\n*/g, "");

  // :::conseil/encadre blocks
  text = text.replace(/:::(conseil|encadre)\s+(.+?)\n([\s\S]*?):::/g, (_, type, title, body) => {
    const label = type === "conseil" ? "Le conseil du prof" : "Encadré";
    const emoji = type === "conseil" ? "🎓" : "📋";
    const cleanBody = body.trim().replace(/\[IMAGE\]\(.*?\)\{.*?\}/g, "").trim();
    return `<div class="encadre-block encadre-${type}" data-type="${type}"><div class="encadre-header"><span>${emoji} ${label}</span></div><div class="encadre-body"><h4>${title.trim()}</h4><p>${cleanBody}</p></div></div>`;
  });

  // [IMAGE] blocks
  text = text.replace(/\[IMAGE\]\((.*?)\)\{caption:(.*?)(?:\|layout:([\w-]+))?(?:\|size:(\d+))?\}/g, (_, src, caption) => {
    const cleanCaption = caption?.trim() || "";
    const safeCaption = escapeHtmlAttr(cleanCaption);
    return `<img src="${src}" alt="${safeCaption}" data-caption="${safeCaption}" />`;
  });

  const lines = text.split("\n");
  let html = "";
  let inList = false;
  let listType = "";

  for (const line of lines) {
    const t = line.trim();
    if (!t) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } continue; }
    if (t.startsWith("<")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += t; continue; }
    if (t.startsWith("#### ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<h4>${t.slice(5)}</h4>`; continue; }
    if (t.startsWith("### ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<h3>${t.slice(4)}</h3>`; continue; }
    if (t.startsWith("## ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<h2>${t.slice(3)}</h2>`; continue; }
    if (t.startsWith("> ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<blockquote><p>${t.slice(2)}</p></blockquote>`; continue; }
    if (t.startsWith("- ")) {
      if (!inList || listType !== "ul") { if (inList) html += listType === "ul" ? "</ul>" : "</ol>"; html += "<ul>"; inList = true; listType = "ul"; }
      html += `<li>${formatInline(t.slice(2))}</li>`; continue;
    }
    const numM = t.match(/^(\d+)[.)]\s*(.+)/);
    if (numM) {
      if (!inList || listType !== "ol") { if (inList) html += listType === "ul" ? "</ul>" : "</ol>"; html += "<ol>"; inList = true; listType = "ol"; }
      html += `<li>${formatInline(numM[2])}</li>`; continue;
    }
    if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; }
    html += `<p>${formatInline(t)}</p>`;
  }
  if (inList) html += listType === "ul" ? "</ul>" : "</ol>";
  return html;
};

const AdminBlogEditor = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "edit">("list");
  const [editStep, setEditStep] = useState<EditStep>("import");
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
  const [htmlContent, setHtmlContent] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [relatedIssueId, setRelatedIssueId] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<Date>(new Date());
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<number | null>(null);

  // Import step state
  const [rawText, setRawText] = useState("");
  const [imageRefMap, setImageRefMap] = useState<Record<string, string>>({});
  const [uploadingRef, setUploadingRef] = useState<string | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [generatingKeyPoints, setGeneratingKeyPoints] = useState(false);

  // Detect image references from raw text
  const detectedImageRefs = (() => {
    const refs = new Set<string>();
    const matches = rawText.matchAll(/\(([^)]+)\)/g);
    for (const m of matches) {
      const inner = m[1].trim();
      if (inner.length < 3) continue;
      if (/^\d+$/.test(inner)) continue;
      if (/^[a-zéèêëàâùûîïôöç\s,.']+$/i.test(inner) && !inner.includes('_') && !inner.includes('-') && !inner.includes('.')) continue;
      const isFileLike = /[_\-.]/.test(inner) || /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(inner) || /^(IMG|P\d|_|DSC|DSCN|DSCF|BGN|KKM)/i.test(inner);
      if (isFileLike) refs.add(inner);
    }
    return Array.from(refs);
  })();

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
    setIsFree(false); setCoverImage(null); setHtmlContent(""); setRawText("");
    setRelatedIssueId(null); setPreviewMode(false);
    setAuthorId(null); setPublishedAt(new Date()); setKeyPoints([]);
    setImageRefMap({}); setEditStep("import");
    setIsFeatured(false); setDisplayOrder(null);
  };

  const openEditor = (article?: BlogArticle) => {
    if (article) {
      setEditingArticle(article);
      setTitle(article.title); setSlug(article.slug); setExcerpt(article.excerpt);
      setCategory(article.category || "Technique"); setAuthor(article.author || "Info Pêche");
      setIsFree(article.is_free); setCoverImage(article.cover_image);
      setPublishedAt(article.published_at ? new Date(article.published_at) : new Date());
      const matchedAuthor = authors?.find(a => a.name === article.author);
      if (matchedAuthor) setAuthorId(matchedAuthor.id); else setAuthorId(null);
      setHtmlContent(convertLegacyToHtml(article.content));
      setRelatedIssueId(article.related_issue_id);
      setKeyPoints(article.key_points || []);
      setIsFeatured(article.is_featured || false);
      setDisplayOrder(article.display_order ?? null);
      setRawText("");
      setImageRefMap({});
      // Existing article → go straight to editor
      setEditStep("editor");
    } else {
      setEditingArticle(null); resetForm();
      // New article → start with import step
      setEditStep("import");
    }
    setView("edit");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingArticle) setSlug(generateSlug(val));
  };

  const uploadImage = async (file: File, purpose: string): Promise<string | null> => {
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

  const handleBulkImageImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setBulkUploading(true);
    const newMap: Record<string, string> = { ...imageRefMap };
    const unmatched: string[] = [];

    for (const file of Array.from(files)) {
      const fileNorm = normalizeForMatch(file.name);
      let matchedRef: string | null = null;
      for (const ref of detectedImageRefs) {
        if (newMap[ref]) continue;
        const refNorm = normalizeForMatch(ref);
        if (fileNorm === refNorm || fileNorm.includes(refNorm) || refNorm.includes(fileNorm)) {
          matchedRef = ref; break;
        }
      }
      const url = await uploadImage(file, "article");
      if (url) {
        if (matchedRef) newMap[matchedRef] = url;
        else unmatched.push(file.name);
      }
    }

    setImageRefMap(newMap);
    setBulkUploading(false);
    const matched = Object.keys(newMap).length - Object.keys(imageRefMap).length;
    if (matched > 0) toast.success(`${matched} image(s) associée(s) automatiquement`);
    if (unmatched.length > 0) toast.warning(`${unmatched.length} fichier(s) non associé(s) : ${unmatched.join(", ")}`);
    e.target.value = "";
  };

  // Generate key points via AI
  const generateKeyPoints = async (contentText: string) => {
    if (!title.trim()) return;
    setGeneratingKeyPoints(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-key-points", {
        body: { content: contentText, title: title.trim() },
      });
      if (error) throw error;
      if (data?.key_points && Array.isArray(data.key_points)) {
        setKeyPoints(data.key_points);
        toast.success("Points clés générés par l'IA !");
      }
    } catch (e: any) {
      console.error("Key points generation error:", e);
      toast.error("Impossible de générer les points clés : " + (e?.message || "erreur inconnue"));
    } finally {
      setGeneratingKeyPoints(false);
    }
  };

  // Generate alt texts for images via AI (multimodal)
  const generateAltTexts = async (html: string): Promise<string> => {
    // Extract all <img> with their src and data-caption
    const imgRegex = /<img([^>]*?)\/?\s*>/g;
    const images: { url: string; caption?: string; fullMatch: string }[] = [];
    let m;
    while ((m = imgRegex.exec(html)) !== null) {
      const attrs = m[1];
      const srcMatch = attrs.match(/src="([^"]*)"/);
      const captionMatch = attrs.match(/data-caption="([^"]*)"/);
      if (srcMatch?.[1]) {
        images.push({
          url: srcMatch[1],
          caption: captionMatch?.[1] || undefined,
          fullMatch: m[0],
        });
      }
    }
    if (images.length === 0) return html;

    try {
      const { data, error } = await supabase.functions.invoke("generate-alt-text", {
        body: { images: images.map(i => ({ url: i.url, caption: i.caption })) },
      });
      if (error || !data?.alt_texts) return html;

      let result = html;
      images.forEach((img, idx) => {
        const altText = data.alt_texts[idx];
        if (!altText) return;
        const safeAlt = escapeHtmlAttr(altText);
        // Replace existing alt attribute
        const updated = img.fullMatch.replace(/alt="[^"]*"/, `alt="${safeAlt}"`);
        result = result.replace(img.fullMatch, updated);
      });
      toast.success(`Alt text généré pour ${images.length} image(s)`);
      return result;
    } catch (e) {
      console.error("Alt text generation error:", e);
      return html;
    }
  };

  // Transition from import → editor: convert raw text + images to HTML
  const proceedToEditor = async () => {
    const unmapped = detectedImageRefs.filter(r => !imageRefMap[r]);
    if (unmapped.length > 0) {
      const proceed = confirm(`${unmapped.length} image(s) non importée(s) : ${unmapped.join(", ")}. Les références seront supprimées. Continuer ?`);
      if (!proceed) return;
    }
    let html = convertRawToHtml(rawText, imageRefMap);
    setHtmlContent(html);
    setEditStep("editor");
    toast.success("Contenu importé ! Génération en cours…");
    
    // Generate key points and alt texts in parallel
    generateKeyPoints(rawText);
    generateAltTexts(html).then(updatedHtml => {
      if (updatedHtml !== html) {
        setHtmlContent(updatedHtml);
      }
    });
  };

  const handleSave = async (saveStatus?: "draft" | "published") => {
    if (!title.trim() || !slug.trim() || !excerpt.trim()) {
      toast.error("Titre, slug et chapeau sont obligatoires"); return;
    }
    setSaving(true);
    const selectedAuthor = authors?.find(a => a.id === authorId);
    const authorName = selectedAuthor?.name || author;
    const finalStatus = saveStatus || (editingArticle as any)?.status || "published";
    const articleData: any = {
      title: title.trim(), slug: slug.trim(), excerpt: excerpt.trim(),
      content: htmlContent, cover_image: coverImage, category,
      author: authorName, is_free: isFree, related_issue_id: relatedIssueId,
      published_at: publishedAt.toISOString(),
      key_points: keyPoints.filter(p => p.trim()),
      status: finalStatus,
    };
    let error;
    if (editingArticle) {
      ({ error } = await supabase.from("blog_articles").update(articleData).eq("id", editingArticle.id));
    } else {
      ({ error } = await supabase.from("blog_articles").insert(articleData));
    }
    if (error) toast.error("Erreur : " + error.message);
    else {
      toast.success(finalStatus === "draft" ? "Brouillon enregistré" : (editingArticle ? "Article mis à jour" : "Article publié"));
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

  // ===== LIST VIEW =====
  if (view === "list") {
    return (
      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="authors">Auteurs</TabsTrigger>
        </TabsList>
        <TabsContent value="articles">
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">Articles de blog</h2>
                {articles && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center gap-1.5 text-nature font-medium">
                      <span className="w-2 h-2 rounded-full bg-nature inline-block" />
                      {articles.filter(a => (a as any).status !== "draft").length} en ligne
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="flex items-center gap-1.5 text-accent font-medium">
                      <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                      {articles.filter(a => (a as any).status === "draft").length} brouillon(s)
                    </span>
                  </div>
                )}
              </div>
              <Button onClick={() => openEditor()} className="gap-2">
                <Plus className="w-4 h-4" /> Nouvel article
              </Button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="space-y-3">
                {articles?.map(article => (
                  <Card key={article.id} className={cn("hover:shadow-md transition-shadow", (article as any).status === "draft" && "border-accent/50 bg-accent/5")}>
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
                          {(article as any).status === "draft" ? (
                            <Badge className="text-xs flex-shrink-0 bg-accent/20 text-accent-foreground border-accent/30">Brouillon</Badge>
                          ) : (
                            <Badge className="text-xs flex-shrink-0 bg-nature/20 text-nature border-nature/30">En ligne</Badge>
                          )}
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
        </TabsContent>
        <TabsContent value="authors">
          <AdminAuthorManager />
        </TabsContent>
      </Tabs>
    );
  }

  // ===== EDIT VIEW =====
  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => { setView("list"); resetForm(); }}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
        <h2 className="text-xl font-bold flex-1">
          {editingArticle ? "Modifier l'article" : "Nouvel article"}
        </h2>

        {/* Step indicator */}
        <div className="hidden md:flex items-center gap-2 text-sm">
          <span className={cn("px-3 py-1 rounded-full font-medium transition-colors", editStep === "import" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground cursor-pointer")}
            onClick={() => editStep === "editor" && !editingArticle && setEditStep("import")}>
            ① Import
          </span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <span className={cn("px-3 py-1 rounded-full font-medium transition-colors", editStep === "editor" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            ② Édition
          </span>
        </div>

        {editStep === "editor" && (
          <>
            <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
              {previewMode ? <Edit className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {previewMode ? "Éditer" : "Aperçu"}
            </Button>
            <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
              Brouillon
            </Button>
            <Button onClick={() => handleSave("published")} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Publier
            </Button>
          </>
        )}
      </div>

      {/* ===== IMPORT STEP ===== */}
      {editStep === "import" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
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

            {/* Cover */}
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

            {/* Intro */}
            <Card>
              <CardHeader><CardTitle className="text-base">③ Introduction / Chapeau</CardTitle></CardHeader>
              <CardContent>
                <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Collez l'introduction de l'article ici..." rows={4} className="leading-relaxed" />
              </CardContent>
            </Card>

            {/* Info about auto-generated key points */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  ✨ Les points clés « L'essentiel de l'article » seront <strong>générés automatiquement par l'IA</strong> lors du passage à l'éditeur.
                </p>
              </CardContent>
            </Card>

            {/* Raw body text */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileDown className="w-4 h-4" /> ④ Corps de l'article (texte brut)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Collez le texte brut depuis Notion, Word ou Google Docs. Utilisez <code className="bg-muted px-1 rounded">## Titre</code> pour les sections, <code className="bg-muted px-1 rounded">### Sous-titre</code> pour les sous-sections.
                  Les références d'images comme <code className="bg-muted px-1 rounded">(IMG_4076)</code> seront détectées automatiquement.
                </p>
                <Textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Collez le texte brut du corps de l'article ici..."
                  rows={20}
                  className="font-mono text-sm leading-relaxed"
                />
              </CardContent>
            </Card>

            {/* Image References Panel */}
            {detectedImageRefs.length > 0 && (
              <Card className="border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImagePlus className="w-4 h-4 text-amber-600" /> ⑤ Images détectées dans le texte
                    <Badge variant="outline" className="ml-auto text-amber-700 border-amber-300">
                      {detectedImageRefs.filter(r => imageRefMap[r]).length}/{detectedImageRefs.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground flex-1">
                      Références d'images détectées. Importez toutes les photos d'un coup ou une par une.
                    </p>
                    <label>
                      <Button variant="default" size="sm" className="gap-2 flex-shrink-0" asChild disabled={bulkUploading}>
                        <span>
                          {bulkUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                          Importer toutes les photos
                        </span>
                      </Button>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleBulkImageImport} />
                    </label>
                  </div>
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
                        {imageRefMap[refName] && (
                          <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={() => setImageRefMap(prev => { const copy = { ...prev }; delete copy[refName]; return copy; })}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
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

            {/* Proceed button */}
            <div className="flex justify-end">
              <Button size="lg" className="gap-2" onClick={proceedToEditor} disabled={!rawText.trim() && !title.trim()}>
                Passer à l'éditeur visuel <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
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
                  <Select value={authorId || "custom"} onValueChange={v => {
                    if (v === "custom") { setAuthorId(null); return; }
                    setAuthorId(v);
                    const a = authors?.find(a => a.id === v);
                    if (a) setAuthor(a.name);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Choisir un auteur" /></SelectTrigger>
                    <SelectContent>
                      {authors?.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          <span className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={a.photo_url || undefined} />
                              <AvatarFallback className="text-[10px]">{a.name[0]}</AvatarFallback>
                            </Avatar>
                            {a.name}
                          </span>
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">✏️ Saisie libre</SelectItem>
                    </SelectContent>
                  </Select>
                  {!authorId && <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Nom de l'auteur" className="mt-2" />}
                </div>
                <div className="space-y-2">
                  <Label>Date de publication</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !publishedAt && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {publishedAt ? format(publishedAt, "dd MMMM yyyy", { locale: fr }) : "Choisir une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={publishedAt} onSelect={(d) => d && setPublishedAt(d)} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
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
                  <Checkbox id="is_free_import" checked={isFree} onCheckedChange={(checked) => setIsFree(checked === true)} />
                  <Label htmlFor="is_free_import" className="cursor-pointer">Article en accès libre</Label>
                </div>
                <p className="text-xs text-muted-foreground">{isFree ? "✅ Accessible à tout le monde" : "🔒 Réservé aux abonnés"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Guide d'import</CardTitle></CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p><strong>Workflow :</strong></p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Collez le titre</li>
                  <li>Chargez l'image cover</li>
                  <li>Collez l'intro (chapeau)</li>
                  <li>Collez le texte brut du corps</li>
                  <li>Importez les images référencées</li>
                  <li>Cliquez « Passer à l'éditeur visuel »</li>
                </ol>
                <div className="border-t border-border pt-2 mt-3">
                  <p><strong>Mise en forme :</strong></p>
                  <p><code className="bg-muted px-1 rounded">## Titre</code> → Section H2</p>
                  <p><code className="bg-muted px-1 rounded">### Sous-titre</code> → Section H3</p>
                  <p><code className="bg-muted px-1 rounded">**texte**</code> → <strong>Gras</strong></p>
                  <p><code className="bg-muted px-1 rounded">*texte*</code> → <em>Italique</em></p>
                  <p><code className="bg-muted px-1 rounded">- item</code> → Liste à puces</p>
                  <p><code className="bg-muted px-1 rounded">&gt; citation</code> → Citation</p>
                  <div className="border-t border-border pt-2 mt-3">
                    <p><strong>Blocs spéciaux :</strong></p>
                    <p><code className="bg-muted px-1 rounded">:::conseil TITRE</code></p>
                    <p><code className="bg-muted px-1 rounded">:::encadre TITRE</code></p>
                    <p>→ Encadrés éditoriaux</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ===== EDITOR STEP ===== */}
      {editStep === "editor" && (
        <>
          {previewMode ? (
            <Card>
              <CardContent className="p-8 max-w-3xl mx-auto">
                {coverImage && <img src={coverImage} alt={title} className="w-full aspect-[16/9] object-cover rounded-xl mb-8" />}
                <h1 className="text-3xl font-bold mb-4 font-[Playfair_Display]">{title || "Sans titre"}</h1>
                <p className="text-lg text-muted-foreground italic mb-8 border-l-4 border-primary pl-4">{excerpt}</p>
                <div className="article-html-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Title (editable) */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Titre</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="Titre" className="text-lg font-semibold" />
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Slug</Label>
                      <Input value={slug} onChange={e => setSlug(e.target.value)} className="font-mono text-sm" />
                    </div>
                  </CardContent>
                </Card>

                {/* Cover (editable) */}
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Image de couverture</CardTitle></CardHeader>
                  <CardContent>
                    {coverImage ? (
                      <div className="relative">
                        <img src={coverImage} alt="" className="w-full aspect-[16/9] object-cover rounded-lg" />
                        <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setCoverImage(null)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
                        {uploadingCover ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : (
                          <><Upload className="w-6 h-6 text-muted-foreground mb-1" /><span className="text-sm text-muted-foreground">Charger l'image cover</span></>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                      </label>
                    )}
                  </CardContent>
                </Card>

                {/* Intro */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Introduction / Chapeau</CardTitle></CardHeader>
                  <CardContent>
                    <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Introduction..." rows={3} className="leading-relaxed" />
                  </CardContent>
                </Card>

                {/* Key Points */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 justify-between">
                      <span className="flex items-center gap-2">📌 L'essentiel de l'article</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateKeyPoints(htmlContent.replace(/<[^>]*>/g, " "))}
                        disabled={generatingKeyPoints}
                        className="text-xs gap-1"
                      >
                        {generatingKeyPoints ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>✨</span>}
                        {generatingKeyPoints ? "Génération…" : "Régénérer avec l'IA"}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={keyPoints.join("\n")}
                      onChange={e => setKeyPoints(e.target.value.split("\n"))}
                      placeholder="Un point clé par ligne..."
                      rows={4}
                      className="leading-relaxed"
                    />
                  </CardContent>
                </Card>

                {/* TipTap WYSIWYG Editor - no Card wrapper to allow sticky toolbar */}
                <div>
                  <h3 className="text-base font-semibold mb-3">Corps de l'article (éditeur visuel)</h3>
                  <TipTapEditor
                    content={htmlContent}
                    onChange={setHtmlContent}
                    placeholder="Commencez à écrire..."
                  />
                </div>
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
                      <Select value={authorId || "custom"} onValueChange={v => {
                        if (v === "custom") { setAuthorId(null); return; }
                        setAuthorId(v);
                        const a = authors?.find(a => a.id === v);
                        if (a) setAuthor(a.name);
                      }}>
                        <SelectTrigger><SelectValue placeholder="Choisir un auteur" /></SelectTrigger>
                        <SelectContent>
                          {authors?.map(a => (
                            <SelectItem key={a.id} value={a.id}>
                              <span className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={a.photo_url || undefined} />
                                  <AvatarFallback className="text-[10px]">{a.name[0]}</AvatarFallback>
                                </Avatar>
                                {a.name}
                              </span>
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">✏️ Saisie libre</SelectItem>
                        </SelectContent>
                      </Select>
                      {!authorId && <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Nom de l'auteur" className="mt-2" />}
                    </div>
                    <div className="space-y-2">
                      <Label>Date de publication</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !publishedAt && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {publishedAt ? format(publishedAt, "dd MMMM yyyy", { locale: fr }) : "Choisir une date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={publishedAt} onSelect={(d) => d && setPublishedAt(d)} initialFocus className={cn("p-3 pointer-events-auto")} />
                        </PopoverContent>
                      </Popover>
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
                      <Checkbox id="is_free_edit" checked={isFree} onCheckedChange={(checked) => setIsFree(checked === true)} />
                      <Label htmlFor="is_free_edit" className="cursor-pointer">Article en accès libre</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">{isFree ? "✅ Accessible à tout le monde" : "🔒 Réservé aux abonnés"}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Guide éditeur</CardTitle></CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-2">
                    <ul className="list-disc ml-4 space-y-1">
                      <li>Toolbar pour formater le texte</li>
                      <li>📷 pour insérer des images</li>
                      <li>▶️ pour insérer des vidéos YouTube</li>
                      <li>🎓 bloc « Conseil du prof »</li>
                      <li>📦 bloc « Encadré »</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminBlogEditor;
