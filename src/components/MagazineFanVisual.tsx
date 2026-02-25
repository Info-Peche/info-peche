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
        .select("cover_image, issue_number")
        .not("cover_image", "is", null)
        .order("issue_number", { ascending: false })
        .limit(12);

      if (data) {
        const urls = data.map((d) => d.cover_image!).filter(Boolean);
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

  const getFanStyle = (index: number, total: number): React.CSSProperties => {
    const mid = (total - 1) / 2;
    const offset = index - mid;

    const maxRotation = total <= 3 ? 10 : total <= 6 ? 14 : 18;
    const rotation = mid !== 0 ? (offset / mid) * maxRotation : 0;

    const maxTranslateX = total <= 3 ? 28 : total <= 6 ? 16 : 10;
    const translateX = offset * maxTranslateX;

    const translateY = Math.abs(offset) * (total <= 3 ? 3 : 2);

    return {
      transform: `rotate(${rotation}deg) translateX(${translateX}px) translateY(${translateY}px)`,
      zIndex: total - Math.abs(Math.round(offset)),
      transformOrigin: "bottom center",
    };
  };

  const coverSize = count <= 3
    ? "w-16 h-22 md:w-20 md:h-28"
    : count <= 6
      ? "w-11 h-16 md:w-14 md:h-20"
      : "w-8 h-11 md:w-11 md:h-16";

  const containerHeight = count <= 3 ? 120 : count <= 6 ? 100 : 90;

  return (
    <figure
      className={`relative flex items-end justify-center overflow-hidden ${className}`}
      style={{ height: containerHeight }}
      role="img"
      aria-label={`Éventail de ${count} numéros du magazine Info Pêche`}
    >
      {covers.map((url, i) => (
        <div
          key={i}
          className={`absolute ${coverSize} rounded-sm overflow-hidden shadow-md border border-border/20`}
          style={getFanStyle(i, covers.length)}
        >
          <img
            src={url}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
            loading="lazy"
            width={count <= 3 ? 80 : count <= 6 ? 56 : 44}
            height={count <= 3 ? 112 : count <= 6 ? 80 : 64}
          />
        </div>
      ))}
    </figure>
  );
};

export default MagazineFanVisual;
