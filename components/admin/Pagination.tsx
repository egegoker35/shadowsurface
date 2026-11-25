'use client';

export default function Pagination({
  page,
  pages,
  total,
  shown,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  shown: number;
  onPage: (p: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * shown + 1;
  const to = Math.min(page * shown, total);

  return (
    <div className="flex items-center justify-between gap-4 px-7 py-3.5 border-t border-slate-800/80">
      <p className="text-[11px] text-slate-500">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span className="px-2 text-[11px] text-slate-500 font-mono">
          {page}/{pages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
