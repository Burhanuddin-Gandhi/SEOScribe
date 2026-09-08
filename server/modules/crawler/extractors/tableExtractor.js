const cheerio = require('cheerio');

/**
 * Deterministic Structured Table Extractor
 * Extracts tables with preserved header-column-cell relationships and type classification.
 */
function extractTables(html) {
  const $ = typeof html === 'string' ? cheerio.load(html) : html;
  const tables = [];
  let tableIndex = 0;

  $('table').each((_, el) => {
    tableIndex++;
    const $table = $(el);
    const caption = $table.find('caption').text().replace(/\s+/g, ' ').trim() || null;

    // 1. Extract Headers
    const headers = [];
    $table.find('thead th, thead td, tr:first-child th').each((_, th) => {
      const hText = $(th).text().replace(/\s+/g, ' ').trim();
      headers.push(hText);
    });

    // 2. Extract Data Rows
    const rows = [];
    const rowSelector = headers.length > 0 && $table.find('thead').length > 0 ? 'tbody tr' : 'tr';

    $table.find(rowSelector).each((rowIndex, tr) => {
      // If no thead was present, skip first row if it was used for headers
      if ($table.find('thead').length === 0 && rowIndex === 0 && headers.length > 0) {
        return;
      }

      const cells = [];
      $(tr).find('td, th').each((_, cell) => {
        cells.push($(cell).text().replace(/\s+/g, ' ').trim());
      });

      if (cells.length > 0) {
        rows.push(cells);
      }
    });

    // 3. Classify Table Type
    const combinedText = (caption + ' ' + headers.join(' ') + ' ' + rows.map((r) => r.join(' ')).join(' ')).toLowerCase();
    let tableType = 'DATA_TABLE';

    if (combinedText.includes('$') || combinedText.includes('€') || combinedText.includes('month') || combinedText.includes('plan') || combinedText.includes('tier') || combinedText.includes('pricing')) {
      tableType = 'PRICING_TABLE';
    } else if (combinedText.includes('spec') || combinedText.includes('dimensions') || combinedText.includes('weight') || combinedText.includes('compatibility') || combinedText.includes('model')) {
      tableType = 'SPECIFICATION_TABLE';
    } else if (combinedText.includes('vs') || combinedText.includes('feature') || combinedText.includes('comparison') || combinedText.includes('pro') || combinedText.includes('enterprise')) {
      tableType = 'COMPARISON_TABLE';
    }

    const columnCount = headers.length > 0 ? headers.length : rows.length > 0 ? rows[0].length : 0;

    tables.push({
      table_id: `tbl_${tableIndex}`,
      caption,
      table_type: tableType,
      columns_count: columnCount,
      rows_count: rows.length,
      headers,
      rows,
      section: $table.closest('section, article, main').attr('id') || 'Main Content',
      dom_position: tableIndex,
    });
  });

  return {
    tables,
    total_tables: tables.length,
  };
}

module.exports = {
  extractTables,
};
