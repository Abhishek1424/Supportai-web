// Previous / Next buttons with '1-10 of 42'. Flutter idea: a small pager row widget. It
//   does not load data itself; the parent passes `onPageChange`, like a callback
//   `ValueChanged<int>`.
import { Button } from "./Button";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Previous/Next controls with a "x–y of total" summary.
 *
 * Edge cases: with zero results it shows "0 results"; Previous is disabled on
 * the first page and Next on the last.
 *
 * @param props Current page state and the change handler.
 * @returns The pagination bar.
 */
export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const hasNext = page * pageSize < total;
  return (
    <div className="flex items-center justify-between pt-4 text-sm text-slate-600">
      <span>{total === 0 ? "0 results" : `${first}–${last} of ${total}`}</span>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
