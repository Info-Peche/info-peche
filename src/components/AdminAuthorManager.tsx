import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2, Upload, Loader2, ExternalLink, Save, X, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Author = {
  id: string;
  name: string;
  photo_url: string | null;
  description: string | null;
  external_url: string | null;
  created_at: string;
};

const AdminAuthorManager = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Author | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const { data: authors, isLoading } = useQuery({
    queryKey: ["blog-authors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_authors")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Author[];
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setExternalUrl("");
    setPhotoUrl(null);
    setEditing(null);
    setCreating(false);
  };

  const openCreate = () => {
    resetForm();
    setCreating(true);
  };

  const openEdit = (author: Author) => {
    setEditing(author);
    setCreating(false);
    setName(author.name);
    setDescription(author.description || "");
    setExternalUrl(author.external_url || "");
    setPhotoUrl(author.photo_url);
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("author-avatars")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) {
      toast.error("Erreur upload : " + error.message);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from("author-avatars").getPublicUrl(path);
    return publicUrl;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const url = await uploadPhoto(file);
    if (url) setPhotoUrl(url);
    setUploadingPhoto(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      external_url: externalUrl.trim() || null,
      photo_url: photoUrl,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("blog_authors").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("blog_authors").insert(payload));
    }

    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success(editing ? "Auteur mis à jour" : "Auteur créé");
      queryClient.invalidateQueries({ queryKey: ["blog-authors"] });
      resetForm();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet auteur ?")) return;
    const { error } = await supabase.from("blog_authors").delete().eq("id", id);
    if (error) toast.error("Erreur : " + error.message);
    else {
      toast.success("Auteur supprimé");
      queryClient.invalidateQueries({ queryKey: ["blog-authors"] });
      if (editing?.id === id) resetForm();
    }
  };

  const isFormOpen = creating || editing !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Gestion des auteurs</h2>
        {!isFormOpen && (
          <Button onClick={openCreate} className="gap-2">
            <UserPlus className="w-4 h-4" /> Nouvel auteur
          </Button>
        )}
      </div>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              {editing ? "Modifier l'auteur" : "Nouvel auteur"}
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-6">
              {/* Photo */}
              <div className="flex flex-col items-center gap-2">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={photoUrl || undefined} />
                  <AvatarFallback className="text-lg">{name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                </Avatar>
                <label>
                  <Button variant="outline" size="sm" className="text-xs gap-1" asChild disabled={uploadingPhoto}>
                    <span>
                      {uploadingPhoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      Photo
                    </span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>

              {/* Fields */}
              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <Label>Nom *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nom de l'auteur" />
                </div>
                <div className="space-y-1">
                  <Label>Mini description</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Expert pêche au coup, champion de France" />
                </div>
                <div className="space-y-1">
                  <Label>Lien externe (LinkedIn, site...)</Label>
                  <Input value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={resetForm}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {editing ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {authors?.map(author => (
            <Card key={author.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src={author.photo_url || undefined} />
                  <AvatarFallback>{author.name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{author.name}</p>
                  {author.description && (
                    <p className="text-xs text-muted-foreground truncate">{author.description}</p>
                  )}
                  {author.external_url && (
                    <a href={author.external_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                      <ExternalLink className="w-3 h-3" /> Profil
                    </a>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(author)}>
                    <Save className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(author.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {authors?.length === 0 && (
            <p className="text-muted-foreground text-sm col-span-full text-center py-6">Aucun auteur. Créez le premier !</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAuthorManager;
