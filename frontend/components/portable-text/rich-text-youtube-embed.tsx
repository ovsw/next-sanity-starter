"use client";

import Image from "next/image";
import { useState } from "react";

type RichTextYoutubeEmbedProps = {
  description?: string;
  thumbnail?: {
    alt: string;
    blurDataURL?: string;
    height: number;
    url: string;
    width: number;
  };
  title: string;
  videoId: string;
};

export function RichTextYoutubeEmbed({
  description,
  thumbnail,
  title,
  videoId,
}: RichTextYoutubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
  const iframe = (
    <iframe
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className="h-full w-full"
      loading="lazy"
      src={`${embedUrl}${isPlaying ? "?autoplay=1&rel=0" : "?rel=0"}`}
      title={title}
    />
  );

  return (
    <figure className="my-8 max-w-[45rem]">
      <div className="aspect-video overflow-hidden rounded-card bg-black">
        {thumbnail && !isPlaying ? (
          <button
            aria-label={`Play: ${title}`}
            className="group relative block h-full w-full"
            onClick={() => setIsPlaying(true)}
            type="button"
          >
            <Image
              alt={thumbnail.alt}
              blurDataURL={thumbnail.blurDataURL}
              className="h-full w-full object-cover"
              height={thumbnail.height}
              placeholder={thumbnail.blurDataURL ? "blur" : undefined}
              sizes="(min-width: 1024px) 720px, calc(100vw - 2rem)"
              src={thumbnail.url}
              width={thumbnail.width}
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="flex size-16 items-center justify-center rounded-full bg-black/70 text-white transition-transform group-hover:scale-105 group-focus-visible:scale-105">
                <span
                  aria-hidden="true"
                  className="ml-1 h-0 w-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-current"
                />
              </span>
            </span>
          </button>
        ) : (
          iframe
        )}
      </div>
      {description ? (
        <figcaption className="mt-2 text-sm text-muted-foreground">
          {description}
        </figcaption>
      ) : null}
    </figure>
  );
}
