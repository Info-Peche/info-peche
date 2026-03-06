import { useState, useEffect, useCallback } from "react";
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
  GripVertical, Eye, Edit, Save, FileText, Bold, Italic, Heading2, Heading3, List, Sparkles, ImagePlus, Wand2,
  CheckCircle2, AlertCircle, FileUp, X, ChevronRight, UploadCloud
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

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

type ImageRef = {
  refName: string;       // name found in text, e.g. "IMG_7095"
  caption: string;       // text after the (ref)
  matchedFile?: File;    // uploaded file that matches
  uploadedUrl?: string;  // URL after upload
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

// Normalize a name for fuzzy matching: lowercase, strip leading underscores, remove extension, collapse spaces/underscores
const normalizeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/\.[a-z]{3,4}$/i, "")  // remove extension
    .replace(/^_+/, "")              // strip leading underscores
    .replace(/[\s_-]+/g, "")         // collapse separators
    .trim();

// Extract image references from raw text: lines like "(image_name) caption text"
const extractImageRefs = (rawText: string): ImageRef[] => {
  const refs: ImageRef[] = [];
  // Match pattern: (image_ref) optional caption text
  const regex = /^\(([^)]+)\)\s*(.*)$/gm;
  let match;
  while ((match = regex.exec(rawText)) !== null) {
    const refName = match[1].trim();
    const caption = match[2].trim();
    // Skip if looks like a numbered list item or very short parenthetical
    if (/^\d+$/.test(refName)) continue;
    refs.push({ refName, caption });
  }
  return refs;
};

// Try to match an uploaded file to a reference name
const matchFileToRef = (file: File, refName: string): boolean => {
  const normalizedFile = normalizeName(file.name);
  const normalizedRef = normalizeName(refName);
  // Exact match after normalization
  if (normalizedFile === normalizedRef) return true;
  // One contains the other
  if (normalizedFile.includes(normalizedRef) || normalizedRef.includes(normalizedFile)) return true;
  return false;
};

const AdminBlogEditor = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "edit" | "import">("list");
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [saving, setSaving] = useState(false);
  const [reformattingExcerpt, setReformattingExcerpt] = useState(false);
  const [reformattingBlocks, setReformattingBlocks] = useState<Set<string>>(new Set());
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());

  // Import workflow state
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [rawImportText, setRawImportText] = useState("");
  const [imageRefs, setImageRefs] = useState<ImageRef[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

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
    if (!rawText.trim()) { toast.error("Collez d'abord du texte à reformater"); return null; }
    try {
      const { data, error } = await supabase.functions.invoke("reformat-article", { body: { rawText, type } });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return null; }
      return data.result;
    } catch (e: any) { toast.error("Erreur IA : " + (e.message || "inconnue")); return null; }
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
    if (!block || block.type !== "text" || !block.content.trim()) { toast.error("Ajoutez du texte"); return; }
    setGeneratingImages(prev => new Set(prev).add(blockId));
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-image", { body: { articleText: block.content } });
      if (error) throw error;
      if (data?.imageUrl) {
        setContentBlocks(prev => {
          const copy = [...prev];
          copy.splice(afterIndex + 1, 0, { id: generateId(), type: "image", content: data.imageUrl, caption: "" });
          return copy;
        });
        toast.success("Image générée !");
      }
    } catch (e: any) { toast.error("Erreur : " + (e.message || "inconnue")); }
    finally { setGeneratingImages(prev => { const s = new Set(prev); s.delete(blockId); return s; }); }
  };

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

  const resetForm = () => {
    setTitle(""); setSlug(""); setExcerpt(""); setCategory("Technique"); setAuthor("Info Pêche");
    setIsFree(false); setCoverImage(null); setContentBlocks([{ id: generateId(), type: "text", content: "" }]);
    setRelatedIssueId(null); setPreviewMode(false);
  };

  const resetImport = () => {
    setImportStep(1); setRawImportText(""); setImageRefs([]); setUploadedFiles([]); setImportProgress(0);
  };

  const openEditor = (article?: BlogArticle) => {
    if (article) {
      setEditingArticle(article);
      setTitle(article.title); setSlug(article.slug); setExcerpt(article.excerpt);
      setCategory(article.category || "Technique"); setAuthor(article.author || "Info Pêche");
      setIsFree(article.is_free); setCoverImage(article.cover_image);
      setContentBlocks(parseContentToBlocks(article.content)); setRelatedIssueId(article.related_issue_id);
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
    if (!title.trim() || !slug.trim() || !excerpt.trim()) { toast.error("Titre, slug et chapeau sont obligatoires"); return; }
    setSaving(true);
    const content = blocksToContent(contentBlocks);
    const articleData = {
      title: title.trim(), slug: slug.trim(), excerpt: excerpt.trim(), content, cover_image: coverImage,
      category, author, is_free: isFree, related_issue_id: relatedIssueId,
      published_at: editingArticle?.published_at || new Date().toISOString(),
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

  // ===== IMPORT WORKFLOW =====

  // Step 1 → 2: Parse text and extract image refs
  const handleParseText = () => {
    if (!rawImportText.trim()) { toast.error("Collez d'abord le texte de l'article"); return; }
    const refs = extractImageRefs(rawImportText);
    setImageRefs(refs);
    setImportStep(2);
    toast.success(`${refs.length} image(s) détectée(s) dans le texte`);
  };

  // Handle file drop/select for import
  const handleImportFiles = (files: FileList | File[]) => {
    const newFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    setUploadedFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      const unique = newFiles.filter(f => !existing.has(f.name));
      return [...prev, ...unique];
    });

    // Auto-match files to refs
    setImageRefs(prev => prev.map(ref => {
      if (ref.matchedFile) return ref;
      const matchedFile = newFiles.find(f => matchFileToRef(f, ref.refName));
      return matchedFile ? { ...ref, matchedFile } : ref;
    }));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files) handleImportFiles(e.dataTransfer.files);
  }, [imageRefs]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const removeUploadedFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
    setImageRefs(prev => prev.map(ref => ref.matchedFile?.name === fileName ? { ...ref, matchedFile: undefined } : ref));
  };

  // Manually assign a file to a ref
  const assignFileToRef = (refName: string, file: File) => {
    setImageRefs(prev => prev.map(ref => ref.refName === refName ? { ...ref, matchedFile: file } : ref));
  };

  // Step 2 → 3: Upload all images and build article
  const handleBuildArticle = async () => {
    setImporting(true);
    setImportProgress(0);

    try {
      // 1. Upload all matched images
      const refsWithFiles = imageRefs.filter(r => r.matchedFile);
      const totalUploads = refsWithFiles.length;
      let uploaded = 0;

      for (const ref of refsWithFiles) {
        if (!ref.matchedFile) continue;
        const url = await uploadImage(ref.matchedFile, "article");
        if (url) ref.uploadedUrl = url;
        uploaded++;
        setImportProgress(Math.round((uploaded / Math.max(totalUploads, 1)) * 50));
      }

      // Update state with URLs
      setImageRefs([...imageRefs]);

      setImportProgress(60);

      // 2. Extract title from text (first significant line or "LE GRAND BON..." pattern)
      const lines = rawImportText.split("\n").map(l => l.trim()).filter(Boolean);
      let extractedTitle = "";
      let extractedSubtitle = "";
      let textBody = rawImportText;

      // Try to find title: first non-empty line that's not a ref
      for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i];
        if (/^\(.*\)/.test(line)) continue; // skip image refs
        if (!extractedTitle) { extractedTitle = line; continue; }
        if (!extractedSubtitle && line.length > 5) { extractedSubtitle = line; break; }
      }

      const fullTitle = extractedSubtitle 
        ? `${extractedTitle} – ${extractedSubtitle}` 
        : extractedTitle;

      // 3. Build content blocks from raw text
      const blocks: ContentBlock[] = [];
      
      // Split text into sections by image references
      // Pattern: text before (ref) caption → text block, then image block
      const imageRefPattern = /^\(([^)]+)\)\s*(.*)$/gm;
      let lastIdx = 0;
      let m;
      const textForParsing = rawImportText;
      
      // Reset regex
      const parseRegex = /^\(([^)]+)\)\s*(.*)$/gm;
      const segments: { type: "text" | "image"; content: string; caption?: string; refName?: string }[] = [];
      
      let prevEnd = 0;
      while ((m = parseRegex.exec(textForParsing)) !== null) {
        const refName = m[1].trim();
        const caption = m[2].trim();
        // Skip if it's a number-only ref
        if (/^\d+$/.test(refName)) continue;
        
        const textBefore = textForParsing.substring(prevEnd, m.index).trim();
        if (textBefore) segments.push({ type: "text", content: textBefore });
        
        // Find uploaded URL for this ref
        const matchedRef = imageRefs.find(r => r.refName === refName);
        if (matchedRef?.uploadedUrl) {
          segments.push({ type: "image", content: matchedRef.uploadedUrl, caption, refName });
        } else {
          // Image not found, add as text note
          segments.push({ type: "text", content: `<!-- Image manquante : ${refName} → ${caption} -->` });
        }
        
        prevEnd = m.index + m[0].length;
      }
      
      const remaining = textForParsing.substring(prevEnd).trim();
      if (remaining) segments.push({ type: "text", content: remaining });

      setImportProgress(70);

      // 4. AI reformat each text segment
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (seg.type === "text" && seg.content.length > 50 && !seg.content.startsWith("<!--")) {
          try {
            const result = await reformatWithAI(seg.content, "content");
            if (result) seg.content = result;
          } catch (e) {
            // Keep original if AI fails
          }
        }
        setImportProgress(70 + Math.round((i / Math.max(segments.length, 1)) * 25));
      }

      // 5. Convert segments to content blocks
      for (const seg of segments) {
        if (seg.type === "image") {
          blocks.push({ id: generateId(), type: "image", content: seg.content, caption: seg.caption });
        } else {
          blocks.push({ id: generateId(), type: "text", content: seg.content });
        }
      }

      setImportProgress(98);

      // 6. Extract excerpt from first paragraph
      const firstTextBlock = blocks.find(b => b.type === "text" && b.content.length > 100);
      let extractedExcerpt = "";
      if (firstTextBlock) {
        // Take first 2-3 sentences
        const sentences = firstTextBlock.content.split(/(?<=[.!?])\s+/);
        extractedExcerpt = sentences.slice(0, 3).join(" ");
        if (extractedExcerpt.length > 300) extractedExcerpt = extractedExcerpt.substring(0, 297) + "…";
      }

      // 7. Set cover image as first uploaded image
      const firstImage = imageRefs.find(r => r.uploadedUrl);

      // Populate editor
      setTitle(fullTitle);
      setSlug(generateSlug(fullTitle));
      setExcerpt(extractedExcerpt);
      setCoverImage(firstImage?.uploadedUrl || null);
      setContentBlocks(blocks.length > 0 ? blocks : [{ id: generateId(), type: "text", content: "" }]);
      setEditingArticle(null);

      setImportProgress(100);
      toast.success("Article importé avec succès ! Vérifiez et ajustez avant de publier.");
      
      // Switch to editor
      setTimeout(() => {
        setView("edit");
        resetImport();
      }, 500);

    } catch (e: any) {
      toast.error("Erreur lors de l'import : " + (e.message || "inconnue"));
    } finally {
      setImporting(false);
    }
  };

  // Render content preview
  const renderPreview = (text: string) => {
    return text.split("\n\n").map((paragraph, i) => {
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

  const matchedCount = imageRefs.filter(r => r.matchedFile).length;
  const unmatchedRefs = imageRefs.filter(r => !r.matchedFile);
  const unassignedFiles = uploadedFiles.filter(f => !imageRefs.some(r => r.matchedFile?.name === f.name));

  // ===== LIST VIEW =====
  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold">Articles de blog</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { resetImport(); setView("import"); }} className="gap-2">
              <FileUp className="w-4 h-4" /> Importer un article
            </Button>
            <Button onClick={() => openEditor()} className="gap-2">
              <Plus className="w-4 h-4" /> Nouvel article
            </Button>
          </div>
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

  // ===== IMPORT VIEW =====
  if (view === "import") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => { setView("list"); resetImport(); }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <h2 className="text-xl font-bold flex-1">Importer un article</h2>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {[
            { n: 1, label: "Coller le texte" },
            { n: 2, label: "Charger les images" },
            { n: 3, label: "Générer l'article" },
          ].map((step, i) => (
            <div key={step.n} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                importStep === step.n ? "bg-primary text-primary-foreground" 
                : importStep > step.n ? "bg-primary/20 text-primary" 
                : "bg-muted text-muted-foreground"
              }`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                  {importStep > step.n ? <CheckCircle2 className="w-4 h-4" /> : step.n}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Step 1: Paste raw text */}
        {importStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Étape 1 — Collez le texte brut de l'article</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Collez le texte tel quel depuis votre document Word. Les références d'images entre parenthèses
                comme <code className="bg-muted px-1.5 py-0.5 rounded text-xs">(nom_image)</code> seront automatiquement détectées. 
                Le texte après la référence sera utilisé comme légende.
              </p>
              <Textarea
                value={rawImportText}
                onChange={e => setRawImportText(e.target.value)}
                placeholder={`Collez ici le texte complet de l'article...

Exemple :
BAS DE LIGNE DU COMMERCE
LE GRAND BON EN AVANT !

(Cresta_photo) Image d'introduction

Pendant très longtemps, les bas de ligne...

(IMG_7095) Légende de cette photo`}
                rows={20}
                className="font-mono text-sm"
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {rawImportText.length > 0 && `${rawImportText.length.toLocaleString()} caractères`}
                </span>
                <Button onClick={handleParseText} disabled={!rawImportText.trim()} className="gap-2">
                  Analyser le texte <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload images */}
        {importStep === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Étape 2 — Chargez les images</span>
                  <Badge variant="outline">{matchedCount}/{imageRefs.length} images associées</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Glissez-déposez ou sélectionnez toutes les images de l'article. L'outil associe automatiquement 
                  chaque fichier à sa référence dans le texte.
                </p>

                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={e => e.target.files && handleImportFiles(e.target.files)}
                  />
                  <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="text-sm font-medium">Glissez les images ici ou cliquez pour sélectionner</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP • Toutes les images de l'article</p>
                </div>
              </CardContent>
            </Card>

            {/* Image matching panel */}
            {imageRefs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Correspondance images ↔ texte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {imageRefs.map((ref, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                      ref.matchedFile ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20" : "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20"
                    }`}>
                      {/* Thumbnail or placeholder */}
                      <div className="w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden bg-muted flex items-center justify-center">
                        {ref.matchedFile ? (
                          <img src={URL.createObjectURL(ref.matchedFile)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">({ref.refName})</code>
                          {ref.matchedFile ? (
                            <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> {ref.matchedFile.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                              <AlertCircle className="w-3 h-3 mr-1" /> Non trouvée
                            </Badge>
                          )}
                        </div>
                        {ref.caption && <p className="text-xs text-muted-foreground italic truncate">{ref.caption}</p>}

                        {/* Manual assignment dropdown for unmatched refs */}
                        {!ref.matchedFile && unassignedFiles.length > 0 && (
                          <Select onValueChange={(fileName) => {
                            const file = uploadedFiles.find(f => f.name === fileName);
                            if (file) assignFileToRef(ref.refName, file);
                          }}>
                            <SelectTrigger className="h-7 text-xs mt-2 w-64">
                              <SelectValue placeholder="Assigner manuellement..." />
                            </SelectTrigger>
                            <SelectContent>
                              {unassignedFiles.map(f => (
                                <SelectItem key={f.name} value={f.name} className="text-xs">{f.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      {ref.matchedFile && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeUploadedFile(ref.matchedFile!.name)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Uploaded files not yet assigned */}
            {unassignedFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-amber-700">
                    {unassignedFiles.length} fichier(s) non associé(s)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {unassignedFiles.map(f => (
                      <div key={f.name} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
                        <img src={URL.createObjectURL(f)} alt="" className="w-8 h-8 object-cover rounded" />
                        <span className="text-xs font-mono">{f.name}</span>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => removeUploadedFile(f.name)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setImportStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Modifier le texte
              </Button>
              <Button onClick={handleBuildArticle} disabled={importing} className="gap-2">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {importing ? "Traitement en cours…" : "Générer l'article"}
              </Button>
            </div>

            {importing && (
              <div className="space-y-2">
                <Progress value={importProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {importProgress < 50 ? "Upload des images…" : importProgress < 70 ? "Analyse du texte…" : importProgress < 95 ? "Reformatage IA…" : "Finalisation…"}
                </p>
              </div>
            )}
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
          <CardContent className="p-8">
            {coverImage && <img src={coverImage} alt={title} className="w-full h-64 object-cover rounded-xl mb-6" />}
            <h1 className="text-3xl font-bold mb-4">{title || "Sans titre"}</h1>
            <p className="text-lg text-muted-foreground italic mb-8 border-l-4 border-primary pl-4">{excerpt}</p>
            <div className="prose max-w-none">{renderPreview(blocksToContent(contentBlocks))}</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Cover */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Image de couverture</CardTitle></CardHeader>
              <CardContent>
                {coverImage ? (
                  <div className="relative">
                    <img src={coverImage} alt="" className="w-full h-48 object-cover rounded-lg" />
                    <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setCoverImage(null)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors">
                    {uploadingCover ? <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /> : (
                      <><Upload className="w-8 h-8 text-muted-foreground mb-2" /><span className="text-sm text-muted-foreground">Cliquez pour charger une image</span></>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  </label>
                )}
              </CardContent>
            </Card>

            {/* Title */}
            <div className="space-y-2">
              <Label>Titre de l'article</Label>
              <Input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="Ex : L'asticot rouge, vraiment plus efficace ?" className="text-lg font-semibold" />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="asticot-rouge-vraiment-plus-efficace" className="font-mono text-sm" />
            </div>

            {/* Chapeau */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Chapeau / Introduction</span>
                  <Button variant="outline" size="sm" onClick={handleReformatExcerpt} disabled={reformattingExcerpt || !excerpt.trim()} className="text-xs gap-1">
                    {reformattingExcerpt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Reformater avec l'IA
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Chapeau de l'article..." rows={4} className="leading-relaxed" />
              </CardContent>
            </Card>

            {/* Content blocks */}
            <Card>
              <CardHeader><CardTitle className="text-base">Contenu de l'article</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {contentBlocks.map((block, index) => (
                  <div key={block.id} className="group relative border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">{block.type === "text" ? "Texte" : "Image"}</Badge>
                      <div className="flex-1" />
                      {block.type === "text" && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting(block.id, "**", "**")}><Bold className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting(block.id, "*", "*")}><Italic className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting(block.id, "\n\n## ", "\n\n")}><Heading2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting(block.id, "\n\n### ", "\n\n")}><Heading3 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting(block.id, "\n- ", "")}><List className="w-3.5 h-3.5" /></Button>
                        </div>
                      )}
                      {contentBlocks.length > 1 && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeBlock(block.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      )}
                    </div>

                    {block.type === "text" ? (
                      <div className="space-y-2">
                        <Textarea data-block-id={block.id} value={block.content} onChange={e => updateBlock(block.id, { content: e.target.value })} placeholder="Texte de l'article..." rows={10} className="font-mono text-sm leading-relaxed" />
                        <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" size="sm" onClick={() => handleReformatBlock(block.id)} disabled={reformattingBlocks.has(block.id) || !block.content.trim()} className="text-xs gap-1">
                            {reformattingBlocks.has(block.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            Reformater avec l'IA
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleGenerateImage(block.id, index)} disabled={generatingImages.has(block.id) || !block.content.trim()} className="text-xs gap-1">
                            {generatingImages.has(block.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                            Générer une image IA
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <img src={block.content} alt={block.caption || ""} className="w-full max-h-64 object-contain rounded-lg bg-muted" />
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
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogEditor;
