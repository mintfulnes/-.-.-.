import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Artwork, ArtworkId, SessionItemMetric } from '../types';
import { ARTWORKS } from '../data/artworks';
import { Heart, ChevronDown, ArrowRight, ZoomIn, X, Info } from 'lucide-react';

interface FeedFormatAProps {
  order: ArtworkId[];
  initialItems: Record<ArtworkId, SessionItemMetric>;
  onUpdateItemMetric: (id: ArtworkId, updater: (prev: SessionItemMetric) => SessionItemMetric) => void;
  onFinishFeed: () => void;
}

export const FeedFormatA: React.FC<FeedFormatAProps> = ({
  order,
  initialItems,
  onUpdateItemMetric,
  onFinishFeed
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Record<string, HTMLElement | null>>({});
  const visibleStartTimeRef = useRef<Record<string, number | null>>({});

  const [expandedLearnMore, setExpandedLearnMore] = useState<Record<string, boolean>>({});
  const [likes, setLikes] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    order.forEach((id) => {
      init[id] = initialItems[id]?.liked ?? false;
    });
    return init;
  });
  const [imageModalUrl, setImageModalUrl] = useState<{ src: string; title: string } | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});

  // Ensure scroll is at the top on mount
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-artwork-id') as ArtworkId | null;
          if (!id) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (!visibleStartTimeRef.current[id]) {
              visibleStartTimeRef.current[id] = Date.now();
            }
          } else {
            recordDwellTimeDelta(id);
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
  }, [order, recordDwellTimeDelta]);

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

  const handleToggleLearnMore = (id: ArtworkId) => {
    const isCurrentlyExpanded = expandedLearnMore[id];
    setExpandedLearnMore((prev) => ({ ...prev, [id]: !isCurrentlyExpanded }));

    const currentMetric = initialItems[id];
    if (!currentMetric?.learnMoreClicked) {
      const nowIso = new Date().toISOString();
      onUpdateItemMetric(id, (prev) => ({
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
      className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory bg-[#FAF8F5] text-[#2B2724] no-scrollbar select-none"
    >
      {order.map((id, index) => {
        const artwork: Artwork = ARTWORKS[id];
        const isLiked = likes[id];
        const isLearnMoreOpen = expandedLearnMore[id];
        const hasError = imageLoadErrors[id];
        const displayImageSrc = hasError ? artwork.fallbackImage : artwork.imageSrc;

        return (
          <section
            key={id}
            data-artwork-id={id}
            ref={(el) => {
              slideRefs.current[id] = el;
            }}
            className="h-[100dvh] w-full snap-start snap-always relative flex flex-col justify-between p-4 sm:p-8 md:p-10 border-b border-[#EBE4D8] overflow-y-auto"
          >
            {/* Top Bar */}
            <div className="w-full max-w-4xl mx-auto flex items-center justify-between py-2 text-xs sm:text-sm text-[#7D7060] font-medium border-b border-[#EBE4D8]">
              <span className="uppercase tracking-widest text-[11px] font-semibold text-[#8F4F24]">
                Традиційний формат
              </span>
              <span className="bg-[#EFE9DF] px-2.5 py-0.5 rounded-full text-xs font-bold text-[#5A4C3D]">
                Твір {index + 1} з 4
              </span>
            </div>

            {/* Central Content */}
            <div className="w-full max-w-4xl mx-auto my-auto py-3 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Artwork Image */}
              <div className="md:col-span-6 flex flex-col items-center justify-center">
                <div className="relative group w-full max-h-[44vh] sm:max-h-[50vh] flex items-center justify-center bg-[#F0EBE1] rounded-2xl p-2 sm:p-3 border border-[#E0D8CB] shadow-xs overflow-hidden">
                  <img
                    src={displayImageSrc}
                    alt={artwork.title}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!hasError) {
                        setImageLoadErrors((prev) => ({ ...prev, [id]: true }));
                      } else if (artwork.remoteFallback && target.src !== artwork.remoteFallback) {
                        target.src = artwork.remoteFallback;
                      }
                    }}
                    className="max-h-[40vh] sm:max-h-[46vh] w-auto max-w-full object-contain rounded-xl shadow-xs transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <button
                    type="button"
                    onClick={() => setImageModalUrl({ src: displayImageSrc, title: artwork.title })}
                    className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-[#2B2724] p-2 rounded-xl shadow-md backdrop-blur-xs transition-all cursor-pointer"
                    title="Збільшити твір"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Artwork Info & Controls */}
              <div className="md:col-span-6 flex flex-col justify-center space-y-3.5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#9A7D60] mb-0.5">
                    {artwork.genre}
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1F1B18] leading-tight">
                    {artwork.title}
                  </h2>
                  <div className="text-xs sm:text-sm text-[#6E6152] font-medium mt-0.5">
                    {artwork.author}, <span className="text-[#8F4F24] font-semibold">{artwork.year}</span>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-[#3E372F] leading-relaxed bg-white/70 p-3.5 rounded-xl border border-[#E9E2D5] shadow-xs">
                  {artwork.description}
                </div>

                {/* Learn More Accordion */}
                <div className="border border-[#E4DDD0] rounded-xl overflow-hidden bg-white/90">
                  <button
                    type="button"
                    onClick={() => handleToggleLearnMore(id)}
                    className="w-full p-3 flex items-center justify-between text-xs sm:text-sm font-semibold text-[#8F4F24] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Info className="w-4 h-4" />
                      {isLearnMoreOpen ? 'Згорнути додаткову інформацію' : 'Дізнатися більше про твір'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isLearnMoreOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isLearnMoreOpen && (
                    <div className="px-3.5 pb-3.5 pt-1 text-xs text-[#4E443A] leading-relaxed border-t border-[#F0EAE0] bg-[#FCFBF8]">
                      {artwork.learnMore}
                    </div>
                  )}
                </div>

                {/* Like Button */}
                <div className="pt-0.5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer shadow-xs ${
                      isLiked
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-white text-[#564B3E] border border-[#DDD4C7] hover:border-[#BFB1A0]'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 transition-transform duration-150 ${
                        isLiked ? 'fill-rose-600 text-rose-600 scale-110' : 'text-[#827464]'
                      }`}
                    />
                    <span>Подобається</span>
                  </button>
                  <span className="text-[11px] text-[#8F8171]">
                    {isLiked ? 'Вподобано' : 'Натисніть сердечко, якщо твір сподобався'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom scroll hint */}
            <div className="w-full text-center text-xs text-[#9E9283] py-2">
              {index < order.length - 1 ? 'Гортайте вниз до наступного твору ↓' : 'Гортайте вниз для переходу до 2 етапу ↓'}
            </div>
          </section>
        );
      })}

      {/* Transition slide to Phase 2 (NO early thank-you) */}
      <section className="h-[100dvh] w-full snap-start snap-always flex flex-col justify-center items-center p-6 text-center bg-[#FAF7F2]">
        <div className="max-w-md w-full bg-white border border-[#E5DDD0] rounded-3xl p-8 sm:p-10 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1A17]">
              Ви переглянули всі 4 картини
            </h2>
            <p className="text-sm text-[#6C6053] leading-relaxed">
              Тепер перейдімо до обов&apos;язкового другого етапу — коротких запитань про ваші враження та пригадування деталей.
            </p>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="w-full py-4 px-6 rounded-xl font-medium text-base bg-[#8F4F24] hover:bg-[#783F1A] text-white transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span>Перейти до другого етапу</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Image Modal Lightbox */}
      {imageModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setImageModalUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-transparent flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImageModalUrl(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={imageModalUrl.src}
              alt={imageModalUrl.title}
              className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl"
            />
            <div className="text-white text-sm mt-3 font-serif">{imageModalUrl.title}</div>
          </div>
        </div>
      )}
    </div>
  );
};
