import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MagazineFanVisualProps {
  count: 3 | 6 | 12;
  className?: string;
}

const MagazineFanVisual = ({ count, className = "" }: MagazineFanVisualProps) => {
  const [covers, setCovers] = useState<string[]>([]);

  useEffect(() => {
    const fetchCovers = async () => {
      const { data } = await supabase
        .from("digital_issues")
        .select("cover_image")
        .not("cover_image", "is", null)
        .order("issue_number", { ascending: false })
        .limit(12);

      if (data) {
        const urls = data.map((d) => d.cover_image!).filter(Boolean);
        // Cycle covers if we don't have enough
        const result: string[] = [];
        for (let i = 0; i < count; i++) {
          result.push(urls[i % urls.length]);
        }
        setCovers(result);
      }
    };
    fetchCovers();
  }, [count]);

  if (covers.length === 0) return null;

  // Fan layout: spread covers in an arc
  const getFanStyle = (index: number, total: number): React.CSSProperties => {
    const mid = (total - 1) / 2;
    const offset = index - mid;

    // Tighter spread for small counts, wider for large
    const maxRotation = total <= 3 ? 12 : total <= 6 ? 18 : 22;
    const rotation = (offset / mid) * maxRotation;

    const maxTranslateX = total <= 3 ? 30 : total <= 6 ? 20 : 14;
    const translateX = offset * maxTranslateX;

    // Arc effect: items at edges are slightly lower
    const translateY = Math.abs(offset) * (total <= 3 ? 4 : 3);

    return {
      transform: `rotate(${rotation}deg) translateX(${translateX}px) translateY(${translateY}px)`,
      zIndex: total - Math.abs(Math.round(offset)),
      transformOrigin: "bottom center",
    };
  };

  // Size covers based on count
  const coverSize = count <= 3
    ? "w-20 h-28 md:w-24 md:h-32"
    : count <= 6
      ? "w-14 h-20 md:w-18 md:h-24"
      : "w-10 h-14 md:w-14 md:h-20";

  return (
    <div className={`relative flex items-end justify-center ${className}`} style={{ height: count <= 3 ? 140 : count <= 6 ? 120 : 110 }}>
      {covers.map((url, i) => (
        <div
          key={i}
          className={`absolute ${coverSize} rounded-sm overflow-hidden shadow-md border border-border/20 transition-transform duration-300 hover:scale-110 hover:z-50`}
          style={getFanStyle(i, covers.length)}
        >
          <img
            src={url}
            alt={`Numéro ${i + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
};

export default MagazineFanVisual;
