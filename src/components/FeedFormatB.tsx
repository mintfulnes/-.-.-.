import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Artwork, ArtworkId, SessionItemMetric } from '../types';
import { ARTWORKS } from '../data/artworks';
import {
  Heart,
  Volume2,
  VolumeX,
  Info,
  ArrowRight,
  X,
  Sparkles,
  Play,
  Pause
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

  const [isMuted, setIsMuted] = useState(true);
  const [activeArtworkId, setActiveArtworkId] = useState<ArtworkId | null>(order[0] || null);
  const [activeModalArtwork, setActiveModalArtwork] = useState<Artwork | null>(null);
  const [isPlayingMap, setIsPlayingMap] = useState<Record<string, boolean>>({});

  const [likes, setLikes] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    order.forEach((id) => {
      init[id] = initialItems[id]?.liked ?? false;
    });
    return init;
  });

  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [motionProgress, setMotionProgress] = useState<Record<string, number>>({});

  // Reset scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

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

  // IntersectionObserver for video autoplay and visibility
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

            if (videoEl && !videoErrors[id]) {
              videoEl.play().then(() => {
                setIsPlayingMap((prev) => ({ ...prev, [id]: true }));
              }).catch(() => {
                videoEl.muted = true;
                videoEl.play().catch(() => {});
              });
            } else {
              setIsPlayingMap((prev) => ({ ...prev, [id]: true }));
            }
          } else {
            recordDwellTimeDelta(id);
            if (videoEl) {
              videoEl.pause();
            }
            setIsPlayingMap((prev) => ({ ...prev, [id]: false }));
          }
        });
      },
      { threshold: 0.5 }
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

  // Sync mute state
  useEffect(() => {
    order.forEach((id) => {
      const videoEl = videoRefs.current[id];
      if (videoEl) {
        videoEl.muted = isMuted;
      }
    });
  }, [isMuted, order]);

  // Smooth cinematic progress simulator for animated reels
  useEffect(() => {
    if (!activeArtworkId) return;
    const isPlaying = isPlayingMap[activeArtworkId] ?? true;
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setMotionProgress((prev) => {
        const cur = prev[activeArtworkId] || 0;
        const next = (cur + 2) % 100;
        const recorded = Math.min(100, (cur + 2));

        if (recorded > (maxCompletionRef.current[activeArtworkId] || 0)) {
          maxCompletionRef.current[activeArtworkId] = recorded;
          onUpdateItemMetric(activeArtworkId, (p) => ({
            ...p,
            watchCompletion: recorded
          }));
        }
        return { ...prev, [activeArtworkId]: next };
      });
    }, 250);

    return () => clearInterval(interval);
  }, [activeArtworkId, isPlayingMap, onUpdateItemMetric]);

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

  const handleOpenLearnMore = (artwork: Artwork) => {
    setActiveModalArtwork(artwork);
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

  const handleTogglePlayPause = (id: ArtworkId) => {
    const videoEl = videoRefs.current[id];
    if (videoEl && !videoErrors[id]) {
      if (videoEl.paused) {
        videoEl.play().catch(() => {});
        setIsPlayingMap((prev) => ({ ...prev, [id]: true }));
      } else {
        videoEl.pause();
        setIsPlayingMap((prev) => ({ ...prev, [id]: false }));
      }
    } else {
      setIsPlayingMap((prev) => ({ ...prev, [id]: !prev[id] }));
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
      {/* Sound Toggle */}
      <div className="fixed top-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsMuted((prev) => !prev)}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white p-2.5 sm:p-3 rounded-full shadow-lg transition-transform active:scale-90 cursor-pointer flex items-center gap-2"
          aria-label={isMuted ? 'Увімкнути звук' : 'Вимкнути звук'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-white/90" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-xs font-semibold pr-1 hidden sm:inline">
            {isMuted ? 'Без звуку' : 'Звук увімкнено'}
          </span>
        </button>
      </div>

      {/* Format Indicator */}
      <div className="fixed top-4 left-4 z-40 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium text-white/90">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Формат стрічки Reels</span>
        </div>
      </div>

      {/* Artwork Slides */}
      {order.map((id, index) => {
        const artwork: Artwork = ARTWORKS[id];
        const isLiked = likes[id];
        const hasVideoError = videoErrors[id];
        const isPlaying = isPlayingMap[id] ?? true;
        const completion =
          maxCompletionRef.current[id] ||
          initialItems[id]?.watchCompletion ||
          motionProgress[id] ||
          0;

        return (
          <section
            key={id}
            data-artwork-id={id}
            ref={(el) => {
              slideRefs.current[id] = el;
            }}
            onClick={() => handleTogglePlayPause(id)}
            className="h-[100dvh] w-full snap-start snap-always relative overflow-hidden flex items-center justify-center bg-black cursor-pointer"
          >
            {/* Visual presentation */}
            {!hasVideoError ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={(el) => {
                    videoRefs.current[id] = el;
                  }}
                  src={artwork.videoSrc}
                  playsInline
                  loop
                  autoPlay
                  muted={isMuted}
                  preload="auto"
                  onTimeUpdate={(e) => handleTimeUpdate(id, e)}
                  onPlay={() => setIsPlayingMap((prev) => ({ ...prev, [id]: true }))}
                  onPause={() => setIsPlayingMap((prev) => ({ ...prev, [id]: false }))}
                  onError={(e) => {
                    console.warn('Video error for artwork:', id, e);
                    setVideoErrors((prev) => ({ ...prev, [id]: true }));
                  }}
                  className="w-full h-full object-cover sm:object-contain sm:max-w-md mx-auto"
                >
                  <source src={artwork.videoSrc} type="video/mp4" />
                </video>

                {/* Center Play Icon when paused */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center text-white/90 shadow-2xl">
                      <Play className="w-8 h-8 fill-white ml-1" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Polished cinematic Reels image presentation with dynamic motion */
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                {/* Ambient backdrop */}
                <img
                  src={artwork.imageSrc || artwork.fallbackImage}
                  alt={artwork.title}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== artwork.fallbackImage) {
                      target.src = artwork.fallbackImage;
                    } else if (artwork.remoteFallback && target.src !== artwork.remoteFallback) {
                      target.src = artwork.remoteFallback;
                    }
                  }}
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40" />

                {/* Main animated painting card */}
                <div className="relative z-10 w-full max-w-sm sm:max-w-md h-[78vh] mx-auto px-2 flex items-center justify-center">
                  <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/60 relative flex items-center justify-center">
                    <img
                      src={artwork.imageSrc || artwork.fallbackImage}
                      alt={artwork.title}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== artwork.fallbackImage) {
                          target.src = artwork.fallbackImage;
                        } else if (artwork.remoteFallback && target.src !== artwork.remoteFallback) {
                          target.src = artwork.remoteFallback;
                        }
                      }}
                      className={`w-full h-full object-contain transition-transform duration-1000 ease-out ${
                        isPlaying ? 'scale-105' : 'scale-100'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none" />

            {/* Bottom-Left Information Overlay */}
            <div
              className="absolute bottom-6 left-4 right-20 sm:right-24 z-30 space-y-1.5 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
                  {artwork.author.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-semibold text-white drop-shadow">
                    {artwork.author}
                  </span>
                  <span className="text-[10px] text-white/70">
                    {artwork.year} • {artwork.genre}
                  </span>
                </div>
              </div>

              <h2 className="font-serif text-base sm:text-lg font-bold text-white drop-shadow leading-tight">
                {artwork.title}
              </h2>

              <p className="text-xs text-white/85 line-clamp-2 drop-shadow leading-relaxed">
                {artwork.description}
              </p>

              <button
                type="button"
                onClick={() => handleOpenLearnMore(artwork)}
                className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 font-medium underline underline-offset-4 cursor-pointer pt-0.5"
              >
                Читати детальний опис
              </button>
            </div>

            {/* Right Action Bar */}
            <div
              className="absolute bottom-8 right-3 sm:right-5 z-30 flex flex-col items-center gap-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Like Button */}
              <button
                type="button"
                onClick={() => handleToggleLike(id)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 shadow-lg ${
                    isLiked
                      ? 'bg-rose-600 text-white scale-110 ring-4 ring-rose-500/30'
                      : 'bg-black/50 text-white hover:bg-black/70 border border-white/20'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
                </div>
                <span className="text-[10px] font-semibold text-white drop-shadow">
                  {isLiked ? '1' : 'Лайк'}
                </span>
              </button>

              {/* Learn More Button */}
              <button
                type="button"
                onClick={() => handleOpenLearnMore(artwork)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 flex items-center justify-center text-white backdrop-blur-md transition-all shadow-lg active:scale-95">
                  <Info className="w-5 h-5 text-amber-300" />
                </div>
                <span className="text-[10px] font-medium text-white/90 drop-shadow">
                  Більше
                </span>
              </button>

              <div className="text-[10px] text-white/70 font-mono bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                {index + 1}/4
              </div>
            </div>

            {/* Video Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
              <div
                className="h-full bg-amber-400 transition-all duration-150"
                style={{ width: `${completion}%` }}
              />
            </div>
          </section>
        );
      })}

      {/* Transition to Phase 2 (NO early thank-you) */}
      <section className="h-[100dvh] w-full snap-start snap-always flex flex-col justify-center items-center p-6 text-center bg-[#111113]">
        <div className="max-w-md w-full bg-[#1A1A1E] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Ви переглянули всі 4 твори!
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Тепер переходимо до обов&apos;язкового другого етапу дослідження — кількох запитань про те, що вам запам&apos;яталося.
            </p>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="w-full py-4 px-6 rounded-xl font-medium text-base bg-[#8F4F24] hover:bg-[#783F1A] text-white transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span>Перейти до другого етапу</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Modal for "Дізнатися більше" */}
      {activeModalArtwork && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setActiveModalArtwork(null)}
        >
          <div
            className="bg-[#1C1A18] text-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/15 p-6 sm:p-8 max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                  {activeModalArtwork.genre}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5">
                  {activeModalArtwork.title}
                </h3>
                <div className="text-xs text-white/70">
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

            <div className="space-y-1">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                Опис картини
              </h4>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">
                {activeModalArtwork.description}
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Дізнатись більше
              </h4>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                {activeModalArtwork.learnMore}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveModalArtwork(null)}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Закрити
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
