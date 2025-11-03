"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
}

export function MyUrlsTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: 10, // 设置每页显示10行
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4 py-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder={t("myUrls.searchPlaceholder", {
              defaultValue: "搜索原始链接...",
            })}
            value={
              (table.getColumn("original_url")?.getFilterValue() as string) ??
              ""
            }
            onChange={(event) =>
              table
                .getColumn("original_url")
                ?.setFilterValue(event.target.value)
            }
            className="w-full sm:max-w-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              {t("myUrls.showColumns", { defaultValue: "显示列" })}{" "}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id === "short_code" && t("urlTable.shortCode")}
                    {column.id === "original_url" && t("urlTable.originalUrl")}
                    {column.id === "is_custom" && t("urlTable.isCustom")}
                    {column.id === "created_at" && t("urlTable.createdAt")}
                    {column.id === "expired_at" && t("urlTable.expiredAt")}
                    {column.id === "actions" && t("urlTable.actions")}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // 加载状态
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="text-gray-500 dark:text-gray-400">
                      {t("myUrls.noLinks", {
                        defaultValue: "还没有创建任何短链接",
                      })}
                    </div>
                    <div className="text-sm text-gray-400 dark:text-gray-500">
                      {t("myUrls.createFirst", {
                        defaultValue: "去创建您的第一个短链接吧！",
                      })}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 表格内置分页控件 */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {t("myUrls.showing", { defaultValue: "显示第" })}{" "}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}{" "}
            {t("myUrls.to", { defaultValue: "到" })}{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length,
            )}{" "}
            {t("myUrls.items", { defaultValue: "项" })}，
            {t("myUrls.total", { defaultValue: "共" })}{" "}
            {table.getFilteredRowModel().rows.length}{" "}
            {t("myUrls.items", { defaultValue: "项" })}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {t("myUrls.rowsPerPage", { defaultValue: "每页显示" })}
            </span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="px-2 py-1 border rounded text-sm"
            >
              {[10, 20, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground">
              {t("myUrls.items", { defaultValue: "项" })}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("myUrls.previous", { defaultValue: "上一页" })}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t("myUrls.next", { defaultValue: "下一页" })}
          </Button>
        </div>
      </div>
    </div>
  );
}
