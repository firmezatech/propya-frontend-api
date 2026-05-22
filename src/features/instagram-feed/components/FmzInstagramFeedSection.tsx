'use client';

import { ChevronLeft, ChevronRight, Heart, Instagram, MessageCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { fmzInstagramFeedConfig } from '../config';
import type { FmzInstagramFeedResponse, FmzInstagramPost } from '../domain/fmz-instagram-feed.types';
import { fetchFmzInstagramFeed } from '../services/fmz-instagram-feed-client';

const getVisibleCards = (width: number): number => {
  if (width <= 380) return 1;
  if (width <= 600) return 2;
  if (width <= 900) return 3;
  return 5;
};

const formatCounter = (value: number): string => {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
};

function FmzInstagramCard({ post }: { post: FmzInstagramPost }) {
  return (
    <a href={post.permalink} target="_blank" rel="noreferrer" className="group relative block flex-[0_0_calc(20%_-_7px)] cursor-pointer overflow-hidden rounded-lg bg-[#eee] no-underline max-[900px]:flex-[0_0_calc(33.333%_-_6px)] max-[600px]:flex-[0_0_calc(50%_-_4px)] max-[380px]:flex-[0_0_calc(100%_-_2px)]">
      <div className="relative w-full overflow-hidden bg-[#ccc] pb-[100%]">
        <img src={post.imageUrl} alt={post.caption || fmzInstagramFeedConfig.handle} loading="lazy" className="absolute inset-0 block h-full w-full object-cover transition duration-[350ms] ease-out group-hover:scale-[1.05]" />
      </div>

      <div className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-1.5 bg-black/55 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="mb-1 flex items-center gap-3.5">
          <span className="flex items-center gap-1 text-[13px] font-medium text-white"><Heart className="h-3.5 w-3.5 fill-white/25" />{formatCounter(post.likeCount)}</span>
          <span className="flex items-center gap-1 text-[13px] font-medium text-white"><MessageCircle className="h-3.5 w-3.5 fill-white/25" />{formatCounter(post.commentsCount)}</span>
        </div>
        <p className="line-clamp-3 max-w-[140px] text-center text-[11px] leading-[1.4] text-white/80">{post.caption}</p>
        <span className="mt-1 text-[10px] uppercase tracking-[0.04em] text-white/55">Ver no Instagram ↗</span>
      </div>
    </a>
  );
}

export function FmzInstagramFeedSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [feed, setFeed] = useState<FmzInstagramFeedResponse>({ posts: [], stats: fmzInstagramFeedConfig.stats, source: 'fallback' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(5);

  useEffect(() => {
    let isMounted = true;
    fetchFmzInstagramFeed().then((nextFeed) => {
      if (isMounted) setFeed(nextFeed);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const syncVisibleCards = () => setVisibleCards(getVisibleCards(window.innerWidth));
    syncVisibleCards();
    window.addEventListener('resize', syncVisibleCards);
    return () => window.removeEventListener('resize', syncVisibleCards);
  }, []);

  const maxIndex = useMemo(() => Math.max(0, feed.posts.length - visibleCards), [feed.posts.length, visibleCards]);

  useEffect(() => {
    setCurrentIndex((index) => Math.min(index, maxIndex));
  }, [maxIndex]);

  const slideTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
  }, [maxIndex]);

  const cardStep = useMemo(() => {
    const firstCard = trackRef.current?.querySelector('a');
    if (!firstCard) return 0;
    return firstCard.getBoundingClientRect().width + 8;
  }, [feed.posts.length, visibleCards]);

  const transform = `translateX(-${currentIndex * cardStep}px)`;

  return (
    <section className="border-t border-fmz-border-light bg-fmz-page px-5 py-10 md:px-10 md:py-[52px]">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-[42px] w-[42px] shrink-0 rounded-full bg-gradient-to-br from-[#f9a825] via-[#e91e63] to-[#9c27b0] p-0.5">
              <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-white bg-fmz-navy">
                <Instagram className="h-5 w-5 text-fmz-gold" aria-hidden="true" />
              </div>
            </div>
            <div>
              <h2 className="font-sans text-[13px] font-bold text-fmz-navy">{fmzInstagramFeedConfig.handle}</h2>
              <p className="mt-px text-[11px] text-fmz-text-hint">{fmzInstagramFeedConfig.profileName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-4 md:gap-[18px]">
            <div className="flex gap-4">
              {Object.entries(feed.stats).map(([key, value]) => (
                <div key={key} className="text-center">
                  <p className="font-sans text-[13px] font-bold leading-none text-fmz-navy">{value}</p>
                  <p className="mt-0.5 text-[10px] text-fmz-text-hint">{key}</p>
                </div>
              ))}
            </div>
            <a href={fmzInstagramFeedConfig.profileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-[7px] border-[1.5px] border-fmz-border-light bg-white px-3.5 py-2 font-sans text-[11.5px] font-bold tracking-[0.03em] text-fmz-navy no-underline transition hover:border-fmz-navy hover:bg-fmz-page">
              <Instagram className="h-3 w-3" aria-hidden="true" />
              Ver no Instagram
            </a>
          </div>
        </div>

        <div className="relative">
          <button type="button" onClick={() => slideTo(currentIndex - 1)} disabled={currentIndex === 0} aria-label="Post anterior" className="absolute left-[-16px] top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-white p-0 shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition hover:scale-105 hover:bg-[#f5f5f5] hover:shadow-[0_3px_12px_rgba(0,0,0,0.22)] disabled:cursor-default disabled:opacity-30 disabled:hover:scale-100 max-[600px]:left-[-12px] max-[600px]:h-7 max-[600px]:w-7">
            <ChevronLeft className="h-3.5 w-3.5 text-fmz-navy" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => slideTo(currentIndex + 1)} disabled={currentIndex >= maxIndex} aria-label="Próximo post" className="absolute right-[-16px] top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-white p-0 shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition hover:scale-105 hover:bg-[#f5f5f5] hover:shadow-[0_3px_12px_rgba(0,0,0,0.22)] disabled:cursor-default disabled:opacity-30 disabled:hover:scale-100 max-[600px]:right-[-12px] max-[600px]:h-7 max-[600px]:w-7">
            <ChevronRight className="h-3.5 w-3.5 text-fmz-navy" aria-hidden="true" />
          </button>

          <div className="overflow-hidden">
            <div ref={trackRef} className="flex gap-2 transition-transform duration-300 ease-out will-change-transform max-[600px]:gap-1.5" style={{ transform }}>
              {feed.posts.map((post) => <FmzInstagramCard key={post.id} post={post} />)}
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-center gap-1.5">
          {Array.from({ length: maxIndex + 1 }, (_, index) => (
            <button key={index} type="button" aria-label={`Ir para o post ${index + 1}`} onClick={() => slideTo(index)} className={fmzCn('h-[7px] w-[7px] rounded-full border-0 bg-fmz-border-light p-0 transition', index === currentIndex && 'scale-125 bg-fmz-navy')} />
          ))}
        </div>
      </div>
    </section>
  );
}
