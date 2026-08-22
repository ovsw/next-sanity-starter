import assert from "node:assert/strict";
import test from "node:test";

import { getYouTubeVideoId as getFrontendVideoId } from "../frontend/lib/youtube-video-id.ts";
import { getYouTubeVideoId as getStudioVideoId } from "./schemas/blocks/big-video-feature.ts";

const videoId = "dQw4w9WgXcQ";
const parsers = [getStudioVideoId, getFrontendVideoId];

test("Studio and frontend accept supported YouTube URL forms", () => {
  const urls = [
    `https://youtube.com/watch?v=${videoId}`,
    `https://www.youtube.com/watch?v=${videoId}&t=10`,
    `https://m.youtube.com/watch?v=${videoId}`,
    `https://youtube.com/embed/${videoId}`,
    `https://youtube-nocookie.com/embed/${videoId}`,
    `https://youtube.com/shorts/${videoId}`,
    `https://youtube.com/live/${videoId}`,
    `https://youtube.com/v/${videoId}`,
    `https://youtu.be/${videoId}?t=10`,
  ];

  for (const parser of parsers) {
    for (const url of urls) assert.equal(parser(url), videoId, url);
  }
});

test("Studio and frontend reject unsafe or malformed YouTube URLs", () => {
  const urls = [
    `https://youtube.com.evil.example/watch?v=${videoId}`,
    `https://notyoutube.com/watch?v=${videoId}`,
    `http://youtube.com/watch?v=${videoId}`,
    "https://youtube.com/watch",
    "https://youtube.com/watch?v=too-short",
    "https://youtube.com/shorts/",
    `https://youtu.be/${videoId}/extra`,
    "not a URL",
    "",
  ];

  for (const parser of parsers) {
    for (const url of urls) assert.equal(parser(url), null, url);
  }
});
