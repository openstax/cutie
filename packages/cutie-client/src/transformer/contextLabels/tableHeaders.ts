/**
 * Table Headers
 *
 * Finds the header cells for the table cell an interaction sits in, so an
 * interaction with no label of its own can be labelled by its row and column
 * headers. QTI v3 table cells (TDH) carry the HTML `headers` and `scope`
 * attributes this relies on.
 *
 * References:
 * - HTML header and data cell semantics: https://html.spec.whatwg.org/multipage/tables.html#header-and-data-cell-semantics
 * - W3C WAI tables tutorial: https://www.w3.org/WAI/tutorials/tables/
 */

type TableCell = HTMLTableCellElement;
type TableRow = HTMLTableRowElement;

/** A row of column headers: in the table head, or made only of header cells */
function isHeaderRow(row: TableRow): boolean {
  if (row.parentElement?.tagName === 'THEAD') return true;
  return Array.from(row.cells).every((cell) => cell.tagName === 'TH');
}

/** Header cells with no text name nothing, such as an empty corner cell */
function hasText(cell: Element): boolean {
  return (cell.textContent ?? '').trim().length > 0;
}

/** Spanned cells shift column positions, which this lookup doesn't model */
function hasSpannedCells(table: HTMLTableElement): boolean {
  return Array.from(table.rows).some((row) =>
    Array.from(row.cells).some((cell) => cell.colSpan !== 1 || cell.rowSpan !== 1)
  );
}

/** The cells an author named in the cell's `headers` attribute, where they exist */
function explicitHeaders(cell: TableCell): Element[] {
  const ids = (cell.getAttribute('headers') ?? '').split(/\s+/).filter(Boolean);
  const root = cell.getRootNode() as Document | DocumentFragment;
  return ids
    .map((id) => root.getElementById(id))
    .filter((header): header is HTMLElement => header !== null && hasText(header));
}

/** Header cells to the left of the cell in its row that head that row */
function rowHeaders(row: TableRow, columnIndex: number): Element[] {
  const rowIsHeaderRow = isHeaderRow(row);
  return Array.from(row.cells)
    .slice(0, columnIndex)
    .filter((cell) => {
      if (cell.tagName !== 'TH' || !hasText(cell)) return false;
      const scope = cell.getAttribute('scope');
      return scope === 'row' || (!scope && !rowIsHeaderRow);
    });
}

/** Header cells above the cell in its column that head that column */
function columnHeaders(rows: TableRow[], rowIndex: number, columnIndex: number): Element[] {
  return rows.slice(0, rowIndex).flatMap((row) => {
    const cell = row.cells[columnIndex];
    if (!cell || cell.tagName !== 'TH' || !hasText(cell)) return [];
    const scope = cell.getAttribute('scope');
    return scope === 'col' || (!scope && isHeaderRow(row)) ? [cell] : [];
  });
}

/**
 * The header cells that label the table cell containing `interaction`: the
 * cell's `headers` attribute if it names any, otherwise its row headers then
 * its column headers. Empty when the interaction isn't in a table cell or the
 * table has spanned cells.
 */
export function findTableHeaders(interaction: Element): Element[] {
  const cell = interaction.closest('td, th') as TableCell | null;
  const row = cell?.parentElement as TableRow | null | undefined;
  const table = cell?.closest('table');
  if (!cell || !row || !table) return [];

  const explicit = explicitHeaders(cell);
  if (explicit.length > 0) return explicit;

  if (hasSpannedCells(table)) return [];

  const rows = Array.from(table.rows);
  const rowIndex = rows.indexOf(row);
  const columnIndex = cell.cellIndex;
  if (rowIndex === -1) return [];

  return [...rowHeaders(row, columnIndex), ...columnHeaders(rows, rowIndex, columnIndex)];
}

/**
 * Labels `element` with aria-labelledby referencing the headers of the table
 * cell it's in, giving those headers IDs where they have none. Returns false,
 * leaving `element` unchanged, when there are no headers to label it with.
 */
export function labelByTableHeaders(element: Element, generateId: () => string): boolean {
  const headers = findTableHeaders(element);
  if (headers.length === 0) return false;
  for (const header of headers) {
    if (!header.id) header.id = generateId();
  }
  element.setAttribute('aria-labelledby', headers.map((header) => header.id).join(' '));
  return true;
}
