const cheerio = require('cheerio');
const path = require('path');
const { normalizeUrl } = require('../normalizers/urlNormalizer');

/**
 * Deterministic Media and Image Extractor
 */
function extractMedia(html, baseUrl) {
  const $ = typeof html === 'string' ? cheerio.load(html) : html;

  const images = [];
  const videos = [];
  let mediaIndex = 0;

  $('img').each((_, el) => {
    const $el = $(el);
    const rawSrc = $el.attr('src') || $el.attr('data-src') || $el.attr('data-lazy-src') || $el.attr('srcset')?.split(/\s+/)[0];
    if (!rawSrc) return;

    mediaIndex++;
    const resolvedUrl = normalizeUrl(rawSrc, baseUrl);
    const altText = $el.attr('alt');
    const title = $el.attr('title') || null;
    const width = parseInt($el.attr('width'), 10) || null;
    const height = parseInt($el.attr('height'), 10) || null;
    const loading = $el.attr('loading')?.toLowerCase() || 'eager';
    const srcset = $el.attr('srcset') || null;
    const sizes = $el.attr('sizes') || null;

    // Detect format and filename
    let filename = null;
    let format = null;
    if (resolvedUrl) {
      try {
        const parsedPath = new URL(resolvedUrl).pathname;
        filename = path.basename(parsedPath);
        const ext = path.extname(parsedPath).replace('.', '').toLowerCase();
        format = ext || 'unknown';
      } catch {}
    }

    // Check figure and figcaption relationship
    const parentFigure = $el.closest('figure');
    const isFigure = parentFigure.length > 0;
    const figcaption = isFigure ? parentFigure.find('figcaption').text().replace(/\s+/g, ' ').trim() || null : null;

    const parentText = $el.parent().text().replace(/\s+/g, ' ').trim();
    const context = parentText.length > 120 ? parentText.slice(0, 117) + '...' : parentText;

    const isMissingAlt = altText === undefined || altText === null;
    const isEmptyAlt = altText === '';

    images.push({
      image_id: `img_${mediaIndex}`,
      source_src: rawSrc,
      absolute_url: resolvedUrl,
      alt: altText ?? null,
      title,
      width,
      height,
      srcset,
      sizes,
      loading,
      filename,
      format,
      is_figure: isFigure,
      figcaption,
      surrounding_text: context,
      flags: {
        missing_alt: isMissingAlt,
        empty_alt: isEmptyAlt,
        missing_dimensions: width === null || height === null,
        is_lazy_loaded: loading === 'lazy',
      },
      dom_position: mediaIndex,
    });
  });

  // Extract <video> elements
  $('video').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src') || $el.find('source').attr('src');
    if (src) {
      videos.push({
        video_id: `vid_${videos.length + 1}`,
        source_url: src,
        absolute_url: normalizeUrl(src, baseUrl),
        autoplay: $el.is('[autoplay]'),
        controls: $el.is('[controls]'),
      });
    }
  });

  const missingAltCount = images.filter((img) => img.flags.missing_alt).length;
  const emptyAltCount = images.filter((img) => img.flags.empty_alt).length;
  const missingDimensionsCount = images.filter((img) => img.flags.missing_dimensions).length;

  return {
    images,
    videos,
    counts: {
      total_images: images.length,
      total_videos: videos.length,
      missing_alt: missingAltCount,
      empty_alt: emptyAltCount,
      missing_dimensions: missingDimensionsCount,
      lazy_loaded: images.filter((img) => img.flags.is_lazy_loaded).length,
    },
  };
}

module.exports = {
  extractMedia,
};
