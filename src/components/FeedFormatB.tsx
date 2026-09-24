import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Artwork, ArtworkId, SessionItemMetric } from '../types';
import { ARTWORKS } from '../data/artworks';
import {
  Heart,
  Volume2,
  VolumeX,
  Info,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';

interface FeedFormatBProps {
  order: ArtworkId[];
  initialItems: Record<ArtworkId, SessionItemMetric>;
  onUpdateItemMetric: (id: ArtworkId, updater: (prev: SessionItemMetric) => SessionItemMetric) => void;
  onFinishFeed: () => void;
}

export const FeedFormatB: React.FC<FeedFormatBProps> = ({
  order,
  initialItems,
  onUpdateItemMetric,
  onFinishFeed
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Record<string, HTMLElement | null>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const maxCompletionRef = useRef<Record<string, number>>({});
  const visibleStartTimeRef = useRef<Record<string, number | null>>({});

  // Global sound state for Reels (default muted for browser autoplay policies)
  const [isMuted, setIsMuted] = useState(true);

  // Active artwork in view
  const [activeArtworkId, setActiveArtworkId] = useState<ArtworkId | null>(order[0] || null);

  // Learn more bottom sheet modal
  const [activeModalArtwork, setActiveModalArtwork] = useState<Artwork | null>(null);

  // Likes state
  const [likes, setLikes] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    order.forEach((id) => {
      init[id] = initialItems[id]?.liked ?? false;
    });
    return init;
  });

  // Track video loading errors to gracefully fallback to cinematic painting presentation
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [simulatedProgress, setSimulatedProgress] = useState<Record<string, number>>({});

  // Commit dwell time delta
  const recordDwellTimeDelta = useCallback(
    (id: ArtworkId) => {
      const startTime = visibleStartTimeRef.current[id];
      if (startTime) {
        const delta = Date.now() - startTime;
        visibleStartTimeRef.current[id] = null;
        if (delta > 50) {
          onUpdateItemMetric(id, (prev) => ({
            ...prev,
            dwellMs: (prev?.dwellMs || 0) + delta
          }));
        }
      }
    },
    [onUpdateItemMetric]
  );

  // IntersectionObserver to auto-play / pause videos as they snap into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-artwork-id') as ArtworkId | null;
          if (!id) return;

          const videoEl = videoRefs.current[id];

          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setActiveArtworkId(id);
            if (!visibleStartTimeRef.current[id]) {
              visibleStartTimeRef.current[id] = Date.now();
            }

            // Play video if available
            if (videoEl && !videoErrors[id]) {
              videoEl.play().catch(() => {
                // Autoplay may need user gesture, keep video muted
                videoEl.muted = true;
                videoEl.play().catch(() => {});
              });
            }
          } else {
            // Left view
            recordDwellTimeDelta(id);
            if (videoEl) {
              videoEl.pause();
            }
          }
        });
      },
      {
        threshold: 0.5
      }
    );

    order.forEach((id) => {
      const el = slideRefs.current[id];
      if (el) observer.observe(el);
    });

    return () => {
      order.forEach((id) => {
        recordDwellTimeDelta(id);
      });
      observer.disconnect();
    };
  }, [order, videoErrors, recordDwellTimeDelta]);

  // Sync mute state across all video elements
  useEffect(() => {
    order.forEach((id) => {
      const videoEl = videoRefs.current[id];
      if (videoEl) {
        videoEl.muted = isMuted;
      }
    });
  }, [isMuted, order]);

  // Fallback simulator for dwell & completion if video file is missing or still uploading
  useEffect(() => {
    if (!activeArtworkId) return;
    if (!videoErrors[activeArtworkId]) return;

    // Simulate completion progression for fallback
    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        const cur = prev[activeArtworkId] || 0;
        const next = Math.min(100, cur + 5);
        if (next > (maxCompletionRef.current[activeArtworkId] || 0)) {
          maxCompletionRef.current[activeArtworkId] = next;
          onUpdateItemMetric(activeArtworkId, (p) => ({
            ...p,
            watchCompletion: next
          }));
        }
        return { ...prev, [activeArtworkId]: next };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeArtworkId, videoErrors, onUpdateItemMetric]);

  // Handle video timeupdate to calculate max watchCompletion
  const handleTimeUpdate = (id: ArtworkId, e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (!video.duration || isNaN(video.duration)) return;

    const currentPercent = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
    const previousMax = maxCompletionRef.current[id] || initialItems[id]?.watchCompletion || 0;

    if (currentPercent > previousMax) {
      maxCompletionRef.current[id] = currentPercent;
      onUpdateItemMetric(id, (prev) => ({
        ...prev,
        watchCompletion: currentPercent
      }));
    }
  };

  // Toggle Like
  const handleToggleLike = (id: ArtworkId) => {
    const newLiked = !likes[id];
    const nowIso = new Date().toISOString();

    setLikes((prev) => ({ ...prev, [id]: newLiked }));

    onUpdateItemMetric(id, (prev) => ({
      ...prev,
      liked: newLiked,
      likedAt: prev?.likedAt || (newLiked ? nowIso : null)
    }));
  };

  // Open "Дізнатися більше" bottom sheet
  const handleOpenLearnMore = (artwork: Artwork) => {
    setActiveModalArtwork(artwork);

    // Record first click event if not recorded yet
    const currentMetric = initialItems[artwork.id];
    if (!currentMetric?.learnMoreClicked) {
      const nowIso = new Date().toISOString();
      onUpdateItemMetric(artwork.id, (prev) => ({
        ...prev,
        learnMoreClicked: true,
        learnMoreClickedAt: prev?.learnMoreClickedAt || nowIso
      }));
    }
  };

  const handleFinish = () => {
    order.forEach((id) => {
      recordDwellTimeDelta(id);
    });
    onFinishFeed();
  };

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory bg-black text-white no-scrollbar select-none"
    >
      {/* Persistent Sound Toggle Button */}
      <div className="fixed top-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsMuted((prev) => !prev)}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white p-3 rounded-full shadow-lg transition-transform active:scale-90 cursor-pointer flex items-center gap-2"
          aria-label={isMuted ? 'Увімкнути звук' : 'Вимкнути звук'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-white/90" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-xs font-semibold pr-1 hidden sm:inline">
            {isMuted ? 'Без звуку' : 'Звук увімкнено'}
          </span>
        </button>
      </div>

      {/* Persistent Format B Indicator */}
      <div className="fixed top-4 left-4 z-40 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium text-white/90">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Формат Б (Reels / Shorts)</span>
        </div>
      </div>

      {/* Artwork Slides */}
      {order.map((id, index) => {
        const artwork: Artwork = ARTWORKS[id];
        const isLiked = likes[id];
        const hasVideoError = videoErrors[id];
        const completion = maxCompletionRef.current[id] || initialItems[id]?.watchCompletion || simulatedProgress[id] || 0;

        return (
          <section
            key={id}
            data-artwork-id={id}
            ref={(el) => {
              slideRefs.current[id] = el;
            }}
            className="h-[100dvh] w-full snap-start snap-always relative overflow-hidden flex items-center justify-center bg-[#0B0B0C]"
          >
            {/* Background / Video Player */}
            {!hasVideoError ? (
              <video
                ref={(el) => {
                  videoRefs.current[id] = el;
                }}
                src={artwork.videoSrc}
                playsInline
                loop
                muted={isMuted}
                onTimeUpdate={(e) => handleTimeUpdate(id, e)}
                onError={() => {
                  setVideoErrors((prev) => ({ ...prev, [id]: true }));
                }}
                className="w-full h-full object-cover sm:object-contain sm:max-w-md mx-auto"
              />
            ) : (
              /* Fallback cinematic preview when /media/{id}.mp4 is missing or loading */
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <img
                  src={artwork.fallbackImage}
                  alt={artwork.title}
                  className="w-full h-full object-cover blur-md opacity-30 scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
                <div className="relative z-10 max-w-sm sm:max-w-md mx-auto px-4 text-center space-y-3">
                  <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black/40 relative">
                    <img
                      src={artwork.fallbackImage}
                      alt={artwork.title}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md py-1.5 px-3 rounded-lg text-[11px] text-white/80 border border-white/10">
                      Очікується відео: {artwork.videoSrc}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gradient Overlays for Reels styling */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

            {/* Bottom-Left Information Overlay (Reels caption style) */}
            <div className="absolute bottom-6 left-4 right-20 sm:right-24 z-30 space-y-2 pointer-events-auto">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
                  {artwork.author.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white drop-shadow-md">
                    {artwork.author}
                  </span>
                  <span className="text-[11px] text-white/70">
                    {artwork.year} • {artwork.genre}
                  </span>
                </div>
              </div>

              <h2 className="font-serif text-lg sm:text-xl font-bold text-white drop-shadow-md leading-tight">
                {artwork.title}
              </h2>

              <p className="text-xs sm:text-sm text-white/85 line-clamp-2 drop-shadow leading-relaxed">
                {artwork.description}
              </p>

              <button
                type="button"
                onClick={() => handleOpenLearnMore(artwork)}
                className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 font-medium underline underline-offset-4 cursor-pointer"
              >
                Читати повний опис та факти
              </button>
            </div>

            {/* Right Action Bar (Reels buttons column) */}
            <div className="absolute bottom-8 right-3 sm:right-5 z-30 flex flex-col items-center gap-5 pointer-events-auto">
              {/* Like Button */}
              <button
                type="button"
                onClick={() => handleToggleLike(id)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
                title={isLiked ? 'Прибрати вподобайку' : 'Поставити вподобайку'}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 shadow-lg ${
                    isLiked
                      ? 'bg-rose-600 text-white scale-110 ring-4 ring-rose-500/30'
                      : 'bg-black/50 text-white hover:bg-black/70 border border-white/20'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-white' : ''}`} />
                </div>
                <span className="text-[11px] font-semibold tracking-wider text-white drop-shadow">
                  {isLiked ? '1' : 'Лайк'}
                </span>
              </button>

              {/* Learn More Button */}
              <button
                type="button"
                onClick={() => handleOpenLearnMore(artwork)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
                title="Дізнатися більше"
              >
                <div className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 flex items-center justify-center text-white backdrop-blur-md transition-all shadow-lg active:scale-95">
                  <Info className="w-6 h-6 text-amber-300" />
                </div>
                <span className="text-[11px] font-medium tracking-tight text-white/90 drop-shadow text-center max-w-[56px] leading-tight">
                  Більше
                </span>
              </button>

              {/* Progress pill indicator */}
              <div className="text-[10px] text-white/70 font-mono bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                {index + 1}/4
              </div>
            </div>

            {/* Video Progress Bar at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
              <div
                className="h-full bg-amber-400 transition-all duration-150"
                style={{ width: `${completion}%` }}
              />
            </div>
          </section>
        );
      })}

      {/* Final Slide: Finish Screen */}
      <section className="h-[100dvh] w-full snap-start snap-always flex flex-col justify-center items-center p-6 text-center bg-[#111113]">
        <div className="max-w-md w-full bg-[#1A1A1E] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Дякуємо, це були всі 4 твори!
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Ви завершили перегляд стрічки відеоформату. Тепер перейдемо до збереження результатів.
            </p>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="w-full py-4 px-6 rounded-xl font-medium text-base bg-[#8F4F24] hover:bg-[#783F1A] text-white transition-all duration-200 shadow-lg cursor-pointer active:scale-[0.99]"
          >
            Завершити
          </button>
        </div>
      </section>

      {/* Bottom Sheet Modal for "Дізнатися більше" */}
      {activeModalArtwork && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setActiveModalArtwork(null)}
        >
          <div
            className="bg-[#1C1A18] text-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/15 p-6 sm:p-8 max-h-[85vh] overflow-y-auto space-y-5 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                  {activeModalArtwork.genre}
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">
                  {activeModalArtwork.title}
                </h3>
                <div className="text-sm text-white/70">
                  {activeModalArtwork.author}, <span className="text-amber-300 font-semibold">{activeModalArtwork.year}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalArtwork(null)}
                className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Опис твору
              </h4>
              <p className="text-sm text-white/85 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
                {activeModalArtwork.description}
              </p>
            </div>

            {/* Learn More section */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Дізнатись більше
              </h4>
              <p className="text-sm text-white/90 leading-relaxed bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                {activeModalArtwork.learnMore}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveModalArtwork(null)}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors cursor-pointer"
            >
              Закрити
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
