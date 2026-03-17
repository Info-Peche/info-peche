import { useState, useEffect, useMemo, useCallback } from "react";
import { useCanonical } from "@/hooks/useCanonical";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, MapPin, Navigation, Filter, ExternalLink, Fish, Waves, TreePine, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const createIcon = (type: string) => {
  const colors: Record<string, string> = {
    plan_eau: "#2563eb",
    carpodrome: "#dc2626",
    riviere: "#059669",
  };
  const color = colors[type] || "#6b7280";

  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: 32px; height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    ">
      <span style="transform: rotate(45deg); color: white; font-size: 14px;">
        ${type === "riviere" ? "〰" : type === "carpodrome" ? "🐟" : "💧"}
      </span>
    </div>`,
    className: "custom-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

type FishingSpot = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  department: string | null;
  city: string | null;
  description: string | null;
  issue_number: string | null;
  google_maps_url: string | null;
  fish_species: string[] | null;
};

const typeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  plan_eau: { label: "Plan d'eau", icon: <Waves className="h-4 w-4" />, color: "bg-blue-500" },
  carpodrome: { label: "Carpodrome", icon: <Fish className="h-4 w-4" />, color: "bg-red-500" },
  riviere: { label: "Rivière", icon: <TreePine className="h-4 w-4" />, color: "bg-emerald-500" },
};

function GeolocationButton() {
  const map = useMap();

  const handleGeolocate = () => {
    map.locate({ setView: true, maxZoom: 12 });
  };

  return (
    <Button
      onClick={handleGeolocate}
      size="icon"
      variant="secondary"
      className="absolute bottom-6 right-4 z-[1000] h-11 w-11 rounded-full shadow-lg bg-white hover:bg-muted border border-border"
      title="Me géolocaliser"
    >
      <Navigation className="h-5 w-5 text-primary" />
    </Button>
  );
}

function FlyToSpot({ spot }: { spot: FishingSpot | null }) {
  const map = useMap();
  useEffect(() => {
    if (spot) {
      map.flyTo([spot.latitude, spot.longitude], 13, { duration: 1.2 });
    }
  }, [spot, map]);
  return null;
}

const FishingSpots = () => {
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(["plan_eau", "carpodrome", "riviere"]));
  const [selectedSpot, setSelectedSpot] = useState<FishingSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchSpots = async () => {
      const { data } = await supabase.from("fishing_spots").select("*");
      if (data) setSpots(data as unknown as FishingSpot[]);
      setLoading(false);
    };
    fetchSpots();
  }, []);

  const toggleType = useCallback((type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    return spots.filter((s) => {
      if (!activeTypes.has(s.type)) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.department?.includes(q) ||
        s.fish_species?.some((f) => f.toLowerCase().includes(q))
      );
    });
  }, [spots, activeTypes, search]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-20">
        {/* Hero bar */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border">
          <div className="container mx-auto px-4 py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                  <MapPin className="h-7 w-7 text-primary" />
                  Coins de Pêche
                </h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                  Découvrez les meilleurs spots référencés dans Info Pêche
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="font-mono">
                  {filtered.length} spot{filtered.length > 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-card border-b border-border sticky top-[64px] z-[999]">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un spot, une ville, un département..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-muted/50 border-border"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Desktop filters */}
              <div className="hidden md:flex items-center gap-2">
                {Object.entries(typeLabels).map(([key, { label, icon, color }]) => (
                  <button
                    key={key}
                    onClick={() => toggleType(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all border ${
                      activeTypes.has(key)
                        ? `${color} text-white border-transparent shadow-sm`
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {/* Mobile filter toggle */}
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile filters */}
            {showFilters && (
              <div className="md:hidden flex items-center gap-2 mt-3 pb-1">
                {Object.entries(typeLabels).map(([key, { label, icon, color }]) => (
                  <button
                    key={key}
                    onClick={() => toggleType(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      activeTypes.has(key)
                        ? `${color} text-white border-transparent`
                        : "bg-muted/50 text-muted-foreground border-border"
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map + Sidebar */}
        <div className="flex flex-col lg:flex-row" style={{ height: "calc(100vh - 220px)" }}>
          {/* Sidebar list */}
          <div className="lg:w-96 border-r border-border bg-card overflow-y-auto order-2 lg:order-1 h-64 lg:h-auto">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Chargement...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>Aucun spot trouvé</p>
              </div>
            ) : (
              filtered.map((spot) => {
                const typeInfo = typeLabels[spot.type] || typeLabels.plan_eau;
                return (
                  <button
                    key={spot.id}
                    onClick={() => setSelectedSpot(spot)}
                    className={`w-full text-left p-4 border-b border-border hover:bg-muted/50 transition-colors ${
                      selectedSpot?.id === spot.id ? "bg-primary/5 border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`${typeInfo.color} p-2 rounded-lg text-white shrink-0 mt-0.5`}>
                        {typeInfo.icon}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">{spot.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {spot.city}{spot.department ? ` (${spot.department})` : ""}
                        </p>
                        {spot.fish_species && spot.fish_species.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {spot.fish_species.slice(0, 3).map((fish) => (
                              <Badge key={fish} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {fish}
                              </Badge>
                            ))}
                            {spot.fish_species.length > 3 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                +{spot.fish_species.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Map */}
          <div className="flex-1 relative order-1 lg:order-2 min-h-[400px]">
            <MapContainer
              center={[46.6, 2.5]}
              zoom={6}
              className="h-full w-full z-0"
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {filtered.map((spot) => (
                <Marker
                  key={spot.id}
                  position={[spot.latitude, spot.longitude]}
                  icon={createIcon(spot.type)}
                  eventHandlers={{
                    click: () => setSelectedSpot(spot),
                  }}
                >
                  <Popup maxWidth={320} className="fishing-popup">
                    <div className="p-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`${typeLabels[spot.type]?.color || "bg-muted"} p-1.5 rounded text-white`}>
                          {typeLabels[spot.type]?.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-foreground">{spot.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {typeLabels[spot.type]?.label} — {spot.city} ({spot.department})
                          </p>
                        </div>
                      </div>

                      {spot.description && (
                        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                          {spot.description}
                        </p>
                      )}

                      {spot.fish_species && spot.fish_species.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {spot.fish_species.map((fish) => (
                            <span
                              key={fish}
                              className="inline-block bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5 rounded-full"
                            >
                              {fish}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        {spot.issue_number && (
                          <span className="text-[10px] text-muted-foreground">
                            Info Pêche n°{spot.issue_number}
                          </span>
                        )}
                        <a
                          href={spot.google_maps_url || `https://www.google.com/maps?q=${spot.latitude},${spot.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Google Maps
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              <GeolocationButton />
              <FlyToSpot spot={selectedSpot} />
            </MapContainer>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FishingSpots;
