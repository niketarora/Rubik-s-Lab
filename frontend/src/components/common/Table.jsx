import React from 'react';
import Button from './Button';

const Table = ({
  columns = [], // Array of { key, label, render, monospace, align: 'left'|'right'|'center' }
  data = [],
  pagination, // Object { currentPage, totalItems, itemsPerPage, onPageChange }
  emptyMessage = "No records found.",
  loading = false,
  className = '',
}) => {
  const getAlignClass = (align) => {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  };

  // Pagination calculations
  const hasPagination = pagination && pagination.totalItems > 0;
  const startItem = hasPagination ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 0;
  const endItem = hasPagination ? Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems) : 0;
  const totalPages = hasPagination ? Math.ceil(pagination.totalItems / pagination.itemsPerPage) : 0;

  return (
    <div className={`w-full flex flex-col ${className}`}>
      <div className="overflow-x-auto w-full border border-subtle rounded-card bg-surface">
        <table className="w-full min-w-max border-collapse">
          <thead>
            <tr className="border-b border-subtle">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-[14px] px-6 text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans ${getAlignClass(col.align)}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="border-b border-subtle last:border-b-0 animate-pulse h-[52px]">
                  {columns.map((col) => (
                    <td key={col.key} className="py-[14px] px-6">
                      <div className="h-4 bg-gray-200 rounded-sm w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[14px] text-secondary font-sans">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  className="border-b border-subtle last:border-b-0 hover:bg-gray-50 transition-colors h-[52px]"
                >
                  {columns.map((col) => {
                    const value = row[col.key];
                    const content = col.render ? col.render(row, value) : value;
                    const monospaceClass = col.monospace ? 'font-mono text-[13px]' : 'font-sans text-[14px] text-primary';
                    return (
                      <td
                        key={col.key}
                        className={`py-[14px] px-6 ${monospaceClass} ${getAlignClass(col.align)}`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasPagination && !loading && (
        <div className="flex items-center justify-between mt-4 px-2">
          <span className="text-[13px] text-secondary font-sans">
            Showing {startItem}–{endItem} of {pagination.totalItems} solves
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={pagination.currentPage === 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              className="py-[6px] px-3 text-[13px] h-8"
            >
              Previous
            </Button>
            <span className="text-[13px] text-primary font-semibold font-sans px-1">
              {pagination.currentPage} / {totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={pagination.currentPage === totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              className="py-[6px] px-3 text-[13px] h-8"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
