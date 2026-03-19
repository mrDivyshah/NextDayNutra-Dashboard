"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange, onLimitChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const limitOptions = [10, 20, 50, 100];

  return (
    <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-700">
            Showing <span className="font-semibold">{totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to{" "}
            <span className="font-semibold">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{" "}
            <span className="font-semibold">{totalItems}</span> results
          </p>
          {onLimitChange && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-slate-400 font-bold uppercase tracking-wider">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="rounded-md border border-slate-300 bg-white py-1 pl-2 pr-1 text-[12px] font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
              >
                {limitOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {totalPages > 1 && (
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md" aria-label="Pagination">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              
              {startPage > 1 && (
                <>
                  <button
                    onClick={() => onPageChange(1)}
                    className={`relative inline-flex items-center px-3 py-1 text-[13px] font-bold ring-1 ring-inset ring-slate-300 focus:z-20 ${
                      currentPage === 1 ? "z-10 bg-slate-900 text-white shadow-sm ring-slate-900" : "text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    1
                  </button>
                  {startPage > 2 && <span className="relative inline-flex items-center px-3 py-1 text-[13px] font-bold text-slate-400 ring-1 ring-inset ring-slate-300">...</span>}
                </>
              )}

              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center px-3 py-1 text-[13px] font-bold ring-1 ring-inset ring-slate-300 focus:z-20 ${
                    currentPage === page ? "z-10 bg-slate-900 text-white shadow-sm ring-slate-900" : "text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && <span className="relative inline-flex items-center px-3 py-1 text-[13px] font-bold text-slate-400 ring-1 ring-inset ring-slate-300">...</span>}
                  <button
                    onClick={() => onPageChange(totalPages)}
                    className={`relative inline-flex items-center px-3 py-1 text-[13px] font-bold ring-1 ring-inset ring-slate-300 focus:z-20 ${
                      currentPage === totalPages ? "z-10 bg-slate-900 text-white shadow-sm ring-slate-900" : "text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
