import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  author_name: string;
  author_location: string | null;
  rating: number;
  review_text: string;
  created_at: string;
}

const CustomerReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(12);

      if (data) setReviews(data);
    };
    fetchReviews();
  }, []);

  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
        ) / 10
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("reviews").insert({
      author_name: name.trim(),
      author_location: location.trim() || null,
      rating,
      review_text: text.trim(),
    });
    setLoading(false);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre avis. Réessayez.",
        variant: "destructive",
      });
    } else {
      setSubmitted(true);
      setName("");
      setLocation("");
      setRating(5);
      setText("");
    }
  };

  return (
    <section id="avis" className="py-24 bg-background">
      <div className="container px-4 mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-bold tracking-widest uppercase text-sm">
            Avis Clients
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mt-2 mb-4 text-foreground">
            Ce que disent nos lecteurs
          </h2>
          {reviews.length > 0 && (
            <div className="flex justify-center items-center gap-2">
              <div className="flex text-accent">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(avgRating)
                        ? "fill-current"
                        : "text-border"
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-foreground">
                {avgRating}/5
              </span>
              <span className="text-muted-foreground">
                — {reviews.length} avis vérifiés
              </span>
            </div>
          )}
        </div>

        {/* Reviews grid */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl p-6 border border-border shadow-sm"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? "text-accent fill-current"
                          : "text-border"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-4 italic">
                  "{review.review_text}"
                </p>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {review.author_name}
                  </p>
                  {review.author_location && (
                    <p className="text-muted-foreground text-xs">
                      {review.author_location}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA to leave a review */}
        <div className="text-center">
          {!showForm && !submitted && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8"
            >
              <Star className="w-4 h-4 mr-2" />
              Laisser un avis
            </Button>
          )}

          {submitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 text-nature font-semibold"
            >
              <CheckCircle className="w-5 h-5" />
              Merci ! Votre avis sera publié après vérification.
            </motion.div>
          )}

          {showForm && !submitted && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="max-w-lg mx-auto bg-card border border-border rounded-xl p-6 text-left space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Nom *
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jean D."
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Département
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Loire-Atlantique (44)"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Note *
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= (hoverRating || rating)
                            ? "text-accent fill-current"
                            : "text-border"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Votre avis *
                </label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Partagez votre expérience avec Info Pêche..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? "Envoi…" : "Envoyer"}
                </Button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
