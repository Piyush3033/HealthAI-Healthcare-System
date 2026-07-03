import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTheme } from '../../context/ThemeContext';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const DataGrid = ({
  columns,
  data,
  onRowClick,
  enableVirtualization = true,
  pageSize = 20,
  enableSearch = true,
  searchableColumns = [],
}) => {
  const { isDark } = useTheme();
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      return value ? value.toString().toLowerCase().includes(filterValue.toLowerCase()) : false;
    },
  });

  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    enabled: enableVirtualization && rows.length > 50,
    count: rows.length,
    getScrollElement: () => document.getElementById('grid-container'),
    estimateSize: () => 40,
  });

  const virtualRows = enableVirtualization && rows.length > 50
    ? rowVirtualizer.getVirtualItems()
    : rows.map((_, i) => ({ index: i, start: i * 40 }));

  const totalSize = enableVirtualization && rows.length > 50
    ? rowVirtualizer.getTotalSize()
    : rows.length * 40;

  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - (virtualRows?.[virtualRows.length - 1]?.start || 0) - 40 : 0;

  const bgClass = isDark ? 'bg-gray-900' : 'bg-white';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const textClass = isDark ? 'text-gray-100' : 'text-gray-900';
  const hoverClass = isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50';
  const headerClass = isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700';
  const inputClass = isDark
    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  return (
    <div className="flex flex-col gap-4">
      {enableSearch && (
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${inputClass} transition-colors`}
          />
        </div>
      )}

      <div
        id="grid-container"
        className={`overflow-auto rounded-lg border ${borderClass} ${bgClass} transition-colors`}
        style={{ height: '500px' }}
      >
        <table className="w-full border-collapse">
          <thead className={`sticky top-0 z-10 ${headerClass}`}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-sm font-semibold border-b cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="ml-2">
                          {header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <span className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className={`px-6 py-8 text-center ${textClass}`}
                >
                  No data found
                </td>
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  className={`border-b ${borderClass} ${hoverClass} transition-colors cursor-pointer`}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={`px-6 py-4 text-sm ${textClass}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className={`text-sm ${textClass}`}>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={`p-2 rounded-lg border ${borderClass} ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            } disabled:opacity-50 transition-colors`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={`p-2 rounded-lg border ${borderClass} ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            } disabled:opacity-50 transition-colors`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataGrid;
