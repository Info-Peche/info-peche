import { useState, useEffect, lazy, Suspense } from "react";
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
  Eye, Edit, Save, FileText, CalendarIcon
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
  author: string | null;
  published_at: string | null;
  paywall_preview_length: number | null;
  related_issue_id: string | null;
};

const CATEGORIES = ["Technique", "Compétition", "Matériel", "Débutant", "Reportage", "Famille"];

const generateSlug = (title: string) =>
  title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Convert legacy markdown-like content to HTML for TipTap
 */
const convertLegacyToHtml = (content: string): string => {
  // If content already looks like HTML, return as-is
  if (content.trim().startsWith("<") && (content.includes("</p>") || content.includes("</h2>"))) {
    return content;
  }

  // Strip existing TOC
  let text = content.replace(/\[TOC\][\s\S]*?\[\/TOC\]\n*/g, "");

  // Convert :::conseil and :::encadre blocks
  text = text.replace(/:::(conseil|encadre)\s+(.+?)\n([\s\S]*?):::/g, (_, type, title, body) => {
    const label = type === "conseil" ? "Le conseil du prof" : "Encadré";
    const emoji = type === "conseil" ? "🎓" : "📋";
    const cleanBody = body.trim().replace(/\[IMAGE\]\(.*?\)\{.*?\}/g, "").trim();
    return `<div class="encadre-block encadre-${type}" data-type="${type}"><div class="encadre-header"><span>${emoji} ${label}</span></div><div class="encadre-body"><h4>${title.trim()}</h4><p>${cleanBody}</p></div></div>`;
  });

  // Convert [IMAGE] blocks
  text = text.replace(/\[IMAGE\]\((.*?)\)\{caption:(.*?)(?:\|layout:([\w-]+))?(?:\|size:(\d+))?\}/g, (_, src, caption) => {
    return `<img src="${src}" alt="${caption?.trim() || ""}" />`;
  });

  // Convert line by line
  const lines = text.split("\n");
  let html = "";
  let inList = false;
  let listType = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; }
      continue;
    }

    // Headings
    if (line.startsWith("#### ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<h4>${line.slice(5)}</h4>`; continue; }
    if (line.startsWith("### ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<h3>${line.slice(4)}</h3>`; continue; }
    if (line.startsWith("## ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<h2>${line.slice(3)}</h2>`; continue; }

    // Blockquote
    if (line.startsWith("> ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<blockquote><p>${line.slice(2)}</p></blockquote>`; continue; }

    // Bullet list
    if (line.startsWith("- ")) {
      if (!inList || listType !== "ul") { if (inList) html += listType === "ul" ? "</ul>" : "</ol>"; html += "<ul>"; inList = true; listType = "ul"; }
      html += `<li>${formatInline(line.slice(2))}</li>`;
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s(.+)/);
    if (numMatch) {
      if (!inList || listType !== "ol") { if (inList) html += listType === "ul" ? "</ul>" : "</ol>"; html += "<ol>"; inList = true; listType = "ol"; }
      html += `<li>${formatInline(numMatch[2])}</li>`;
      continue;
    }

    if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; }

    // Regular paragraph (skip if it's already an HTML block)
    if (line.startsWith("<")) { html += line; }
    else { html += `<p>${formatInline(line)}</p>`; }
  }

  if (inList) html += listType === "ul" ? "</ul>" : "</ol>";

  return html;
};

const formatInline = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
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
  const [htmlContent, setHtmlContent] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [relatedIssueId, setRelatedIssueId] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<Date>(new Date());

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
    setIsFree(false); setCoverImage(null); setHtmlContent("");
    setRelatedIssueId(null); setPreviewMode(false);
    setAuthorId(null); setPublishedAt(new Date());
  };

  const openEditor = (article?: BlogArticle) => {
    if (article) {
      setEditingArticle(article);
      setTitle(article.title); setSlug(article.slug); setExcerpt(article.excerpt);
      setCategory(article.category || "Technique"); setAuthor(article.author || "Info Pêche");
      setIsFree(article.is_free); setCoverImage(article.cover_image);
      setPublishedAt(article.published_at ? new Date(article.published_at) : new Date());
      const matchedAuthor = authors?.find(a => a.name === article.author);
      if (matchedAuthor) setAuthorId(matchedAuthor.id);
      else setAuthorId(null);
      // Convert legacy content to HTML if needed
      setHtmlContent(convertLegacyToHtml(article.content));
      setRelatedIssueId(article.related_issue_id);
    } else {
      setEditingArticle(null); resetForm();
    }
    setView("edit");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingArticle) setSlug(generateSlug(val));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `cover/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) { toast.error("Erreur upload : " + error.message); return null; }
    const { data: { publicUrl } } = supabase.storage.from("blog-images").getPublicUrl(path);
    return publicUrl;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const url = await uploadImage(file);
    if (url) setCoverImage(url);
    setUploadingCover(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !excerpt.trim()) {
      toast.error("Titre, slug et chapeau sont obligatoires");
      return;
    }
    setSaving(true);

    const selectedAuthor = authors?.find(a => a.id === authorId);
    const authorName = selectedAuthor?.name || author;

    const articleData = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content: htmlContent,
      cover_image: coverImage,
      category,
      author: authorName,
      is_free: isFree,
      related_issue_id: relatedIssueId,
      published_at: publishedAt.toISOString(),
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
    if (error) toast.error("Erreur : " + error.message);
    else { toast.success("Article supprimé"); queryClient.invalidateQueries({ queryKey: ["admin-blog-articles"] }); }
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
            <div className="article-html-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <Card>
              <CardHeader><CardTitle className="text-base">① Titre de l'article</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="Titre de l'article" className="text-lg font-semibold" />
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
                <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Introduction de l'article..." rows={4} className="leading-relaxed" />
              </CardContent>
            </Card>

            {/* Body - TipTap WYSIWYG */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">④ Corps de l'article (éditeur visuel)</CardTitle>
              </CardHeader>
              <CardContent>
                <TipTapEditor
                  content={htmlContent}
                  onChange={setHtmlContent}
                  placeholder="Commencez à écrire le contenu de l'article..."
                />
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
                  <Select value={authorId || "custom"} onValueChange={v => {
                    if (v === "custom") { setAuthorId(null); return; }
                    setAuthorId(v);
                    const a = authors?.find(a => a.id === v);
                    if (a) setAuthor(a.name);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un auteur" />
                    </SelectTrigger>
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
                  {!authorId && (
                    <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Nom de l'auteur" className="mt-2" />
                  )}
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
                      <Calendar
                        mode="single"
                        selected={publishedAt}
                        onSelect={(d) => d && setPublishedAt(d)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
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
                <p><strong>Éditeur WYSIWYG :</strong></p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Utilisez la toolbar pour formater le texte</li>
                  <li>Cliquez 📷 pour insérer des images</li>
                  <li>Cliquez ▶️ pour insérer des vidéos YouTube</li>
                  <li>🎓 pour un bloc « Conseil du prof »</li>
                  <li>📦 pour un bloc « Encadré »</li>
                  <li>Sélectionnez du texte pour le mettre en forme</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogEditor;
