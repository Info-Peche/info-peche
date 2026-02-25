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

  // All dimensions in px – kept small to never overflow card (~220px wide)
  const config = {
    3:  { w: 60, h: 84, rot: 8,  tx: 22, ty: 3, containerH: 100 },
    6:  { w: 52, h: 72, rot: 12, tx: 16, ty: 2, containerH: 100 },
    12: { w: 40, h: 56, rot: 16, tx: 9,  ty: 1.5, containerH: 95  },
  }[count];

  const getFanStyle = (index: number, total: number): React.CSSProperties => {
    const mid = (total - 1) / 2;
    const offset = index - mid;
    const norm = mid !== 0 ? offset / mid : 0;

    return {
      transform: `rotate(${norm * config.rot}deg) translateY(${Math.abs(offset) * config.ty}px)`,
      left: `calc(50% + ${offset * config.tx}px - ${config.w / 2}px)`,
      zIndex: total - Math.abs(Math.round(offset)),
      transformOrigin: "bottom center",
      width: config.w,
      height: config.h,
    };
  };

  return (
    <figure
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height: config.containerH }}
      role="img"
      aria-label={`Éventail de ${count} numéros du magazine Info Pêche`}
    >
      {covers.map((url, i) => (
        <div
          key={i}
          className="absolute rounded-sm overflow-hidden shadow-md border border-border/20"
          style={getFanStyle(i, covers.length)}
        >
          <img
            src={url}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
            loading="lazy"
            width={config.w}
            height={config.h}
          />
        </div>
      ))}
    </figure>
  );
};

export default MagazineFanVisual;
