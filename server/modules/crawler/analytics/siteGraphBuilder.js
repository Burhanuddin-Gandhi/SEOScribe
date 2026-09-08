/**
 * Deterministic Site Link Graph & Hierarchy Builder
 * Generates the Page A -> Page B directional graph from extracted link data.
 */
function buildSiteLinkGraph(pages = []) {
  const nodes = [];
  const edges = [];
  const inDegreeMap = new Map();
  const outDegreeMap = new Map();
  const allPageUrls = new Set(pages.map((p) => p.url));

  pages.forEach((page) => {
    nodes.push({
      page_id: page.page_id,
      url: page.url,
      title: page.metadata?.title?.raw || page.url,
    });

    const pageOutbound = new Set();
    const internalLinks = page.links?.internal || [];

    internalLinks.forEach((link) => {
      const targetUrl = link.normalized_url;
      if (allPageUrls.has(targetUrl) && targetUrl !== page.url && !pageOutbound.has(targetUrl)) {
        pageOutbound.add(targetUrl);
        edges.push({
          source: page.url,
          target: targetUrl,
          anchor_text: link.anchor_text,
          location: link.location,
        });

        inDegreeMap.set(targetUrl, (inDegreeMap.get(targetUrl) || 0) + 1);
      }
    });

    outDegreeMap.set(page.url, pageOutbound.size);
  });

  // Detect orphan pages (pages in site with 0 internal incoming links, excluding homepage / root)
  const orphanPages = [];
  pages.forEach((page, index) => {
    const inDegree = inDegreeMap.get(page.url) || 0;
    if (inDegree === 0 && index > 0) {
      orphanPages.push({
        page_id: page.page_id,
        url: page.url,
        inbound_links_count: 0,
      });
    }
  });

  return {
    nodes,
    edges,
    total_nodes: nodes.length,
    total_edges: edges.length,
    orphan_pages: orphanPages,
    link_distribution: {
      in_degree: Object.fromEntries(inDegreeMap),
      out_degree: Object.fromEntries(outDegreeMap),
    },
  };
}

module.exports = {
  buildSiteLinkGraph,
};
