import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentEdition {
  issue_number: string;
  issue_period: string;
  youtube_video_id: string;
  cover_image: string;
  highlights: string[];
}

const DEFAULTS: CurrentEdition = {
  issue_number: "N°100",
  issue_period: "Janvier 2026",
  youtube_video_id: "gwYLuVXP-Ik",
  cover_image: "https://fokaikipfikcokjwyeka.supabase.co/storage/v1/object/public/magazine-covers/ip100-cover.png",
  highlights: [
    "Dossier spécial : Les amorces d'hiver",
    "Test matériel : 5 cannes au banc d'essai",
    "Reportage : Championnat du monde 2024",
    "Technique : La pêche à la grande canne expliquée",
  ],
};

export const useCurrentEdition = () => {
  return useQuery({
    queryKey: ["current-edition"],
    queryFn: async (): Promise<CurrentEdition> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "current_edition")
        .single();
      if (error || !data) return DEFAULTS;
      return { ...DEFAULTS, ...(data.value as any) };
    },
    staleTime: 5 * 60 * 1000,
  });
};
