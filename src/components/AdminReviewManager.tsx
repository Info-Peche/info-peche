import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Star, Check, X, Pencil, Trash2, Loader2, User, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  author_name: string;
  author_location: string | null;
  avatar_url: string | null;
  rating: number;
  review_text: string;
  is_approved: boolean;
  created_at: string;
}

const AdminReviewManager = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Review>>({});

  const fetchReviews = async () => {
    setLoading(true);
    let query = supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter === "pending") query = query.eq("is_approved", false);
    if (filter === "approved") query = query.eq("is_approved", true);

    const { data, error } = await query;
    if (!error && data) setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const approveReview = async (id: string) => {
    const { error } = await supabase
      .from("reviews")
      .update({ is_approved: true })
      .eq("id", id);
    if (error) {
      toast.error("Erreur lors de l'approbation");
      return;
    }
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: true } : r));
    toast.success("Avis approuvé et publié");
  };

  const rejectReview = async (id: string) => {
    const { error } = await supabase
      .from("reviews")
      .update({ is_approved: false })
      .eq("id", id);
    if (error) {
      toast.error("Erreur lors du rejet");
      return;
    }
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: false } : r));
    toast.success("Avis masqué");
  };

  const deleteReview = async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    setReviews(prev => prev.filter(r => r.id !== id));
    toast.success("Avis supprimé");
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditForm({
      author_name: review.author_name,
      author_location: review.author_location,
      rating: review.rating,
      review_text: review.review_text,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from("reviews")
      .update({
        author_name: editForm.author_name,
        author_location: editForm.author_location || null,
        rating: editForm.rating,
        review_text: editForm.review_text,
      })
      .eq("id", editingId);
    if (error) {
      toast.error("Erreur lors de la sauvegarde");
      return;
    }
    setReviews(prev =>
      prev.map(r =>
        r.id === editingId
          ? { ...r, ...editForm }
          : r
      ) as Review[]
    );
    setEditingId(null);
    toast.success("Avis modifié");
  };

  const pendingCount = reviews.filter(r => !r.is_approved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-serif font-bold text-foreground">Modération des avis</h2>
        <div className="flex gap-2">
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            En attente {filter !== "pending" && pendingCount > 0 && `(${pendingCount})`}
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("approved")}
          >
            Publiés
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Tous
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {filter === "pending" ? "Aucun avis en attente de modération." : "Aucun avis."}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div
              key={review.id}
              className={`bg-card border rounded-xl p-4 md:p-5 transition-colors ${
                !review.is_approved ? "border-accent/50 bg-accent/5" : "border-border"
              }`}
            >
              {editingId === review.id ? (
                // Edit mode
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom</label>
                      <Input
                        value={editForm.author_name || ""}
                        onChange={e => setEditForm(prev => ({ ...prev, author_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Localisation</label>
                      <Input
                        value={editForm.author_location || ""}
                        onChange={e => setEditForm(prev => ({ ...prev, author_location: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Note</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, rating: star }))}
                          className="p-0.5"
                        >
                          <Star
                            className={`w-5 h-5 transition-colors ${
                              star <= (editForm.rating || 0) ? "text-accent fill-current" : "text-border"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Texte</label>
                    <Textarea
                      value={editForm.review_text || ""}
                      onChange={e => setEditForm(prev => ({ ...prev, review_text: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      Annuler
                    </Button>
                    <Button size="sm" onClick={saveEdit}>
                      Enregistrer
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex gap-4">
                  {/* Avatar */}
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    {review.avatar_url ? (
                      <AvatarImage src={review.avatar_url} alt={review.author_name} />
                    ) : null}
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">{review.author_name}</span>
                          {review.author_location && (
                            <span className="text-xs text-muted-foreground">— {review.author_location}</span>
                          )}
                          <Badge variant={review.is_approved ? "default" : "secondary"} className="text-[10px]">
                            {review.is_approved ? "Publié" : "En attente"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < review.rating ? "text-accent fill-current" : "text-border"}`}
                            />
                          ))}
                          <span className="text-xs text-muted-foreground ml-2">
                            {new Date(review.created_at).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-foreground mt-2 leading-relaxed">{review.review_text}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {!review.is_approved ? (
                        <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={() => approveReview(review.id)}>
                          <Check className="w-3 h-3" /> Approuver
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => rejectReview(review.id)}>
                          <EyeOff className="w-3 h-3" /> Masquer
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => startEdit(review)}>
                        <Pencil className="w-3 h-3" /> Éditer
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive hover:text-destructive">
                            <Trash2 className="w-3 h-3" /> Supprimer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cet avis ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Avis de {review.author_name}. Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteReview(review.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviewManager;
