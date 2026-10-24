"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { HeartHandshake, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalActions } from "@/components/ui/modal";
import { QueryError } from "@/components/ui/query-error";
import { ReloadButton } from "@/components/ui/reload-button";
import { TableShell } from "@/components/ui/table-shell";
import { Textarea } from "@/components/ui/textarea";
import { TruncatedText } from "@/components/ui/truncated-text";
import {
  useWelfarePackages,
  type WelfareFormValues,
} from "@/hooks/use-welfare";
import { ApiRequestError } from "@/lib/api/client";
import { formatNairaFromKobo, koboToNaira } from "@/lib/utils";
import type { WelfarePackage } from "@/types";

type Editor =
  | { mode: "create" }
  | { mode: "edit"; item: WelfarePackage };

const emptyForm: WelfareFormValues = {
  title: "",
  detail: "",
  amountNaira: 0,
  active: true,
};

export function WelfareTable() {
  const {
    listQuery,
    form,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useWelfarePackages();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const packages = listQuery.data ?? [];
  const offered = packages.filter((item) => item.active);
  const combinedKobo = offered.reduce((sum, item) => sum + item.amountKobo, 0);

  const closeEditor = useCallback(() => {
    setEditor(null);
    setConfirmDelete(false);
  }, []);

  const openCreate = () => {
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
    form.reset(emptyForm);
    setConfirmDelete(false);
    setEditor({ mode: "create" });
  };

  const openEdit = useCallback(
    (item: WelfarePackage) => {
      createMutation.reset();
      updateMutation.reset();
      deleteMutation.reset();
      form.reset({
        title: item.title,
        detail: item.detail,
        amountNaira: koboToNaira(item.amountKobo),
        active: item.active,
      });
      setConfirmDelete(false);
      setEditor({ mode: "edit", item });
    },
    [createMutation, deleteMutation, form, updateMutation],
  );

  const columns = useMemo<ColumnDef<WelfarePackage>[]>(
    () => [
      {
        id: "title",
        header: "Care",
        cell: ({ row }) => (
          <div className="max-w-[16rem]">
            <TruncatedText
              text={row.original.title}
              className="font-medium"
              maxWidthClass="max-w-[16rem]"
            />
            <TruncatedText
              text={row.original.detail}
              className="text-xs text-(--ink-muted)"
              maxWidthClass="max-w-[16rem]"
            />
          </div>
        ),
      },
      {
        id: "amount",
        header: "Donor receives",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatNairaFromKobo(row.original.amountKobo)}
          </span>
        ),
      },
      {
        id: "active",
        header: "Offered",
        cell: ({ row }) => (
          <Badge tone={row.original.active ? "success" : "neutral"}>
            {row.original.active ? "Offered" : "Hidden"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openEdit(row.original)}
          >
            Edit price
          </Button>
        ),
      },
    ],
    [openEdit],
  );

  const table = useReactTable({
    data: packages,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const saving = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error ?? deleteMutation.error;

  const onSubmit = form.handleSubmit(async (values) => {
    if (!editor) return;
    if (editor.mode === "create") {
      await createMutation.mutateAsync(values);
    } else {
      await updateMutation.mutateAsync({ id: editor.item.id, values });
    }
    closeEditor();
  });

  const onDelete = async () => {
    if (editor?.mode !== "edit") return;
    await deleteMutation.mutateAsync(editor.item.id);
    closeEditor();
  };

  return (
    <>
      <TableShell
        toolbar={
          <>
            <p className="min-w-0 flex-1 text-sm text-(--ink-muted)">
              {listQuery.isSuccess
                ? `${offered.length} offered · ${formatNairaFromKobo(combinedKobo)} if a donor receives every offered item`
                : "Care items donors can arrange"}
            </p>
            <ReloadButton
              onReload={() => listQuery.refetch()}
              loading={listQuery.isFetching}
            />
            <Button onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              Add welfare
            </Button>
          </>
        }
      >
        {listQuery.isLoading ? (
          <EmptyState title="Loading welfare…" />
        ) : listQuery.isError ? (
          <QueryError
            title="Couldn’t load welfare"
            error={listQuery.error}
            onRetry={() => listQuery.refetch()}
          />
        ) : packages.length === 0 ? (
          <EmptyState
            icon={HeartHandshake}
            title="No welfare items yet"
            description="Add the first care item and set the amount donors receive."
            action={{ label: "Add welfare", onClick: openCreate }}
          />
        ) : (
          <table>
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableShell>

      {editor ? (
        <Modal
          title={editor.mode === "create" ? "Add welfare" : "Edit welfare"}
          onClose={closeEditor}
        >
          <form className="space-y-4" onSubmit={onSubmit}>
            <Field
              id="welfare-title"
              label="Name"
              error={form.formState.errors.title?.message}
              {...form.register("title")}
            />
            <div>
              <Label htmlFor="welfare-detail">Description</Label>
              <Textarea
                id="welfare-detail"
                {...form.register("detail")}
              />
              {form.formState.errors.detail?.message ? (
                <p className="mt-1 text-xs text-(--danger)">
                  {form.formState.errors.detail.message}
                </p>
              ) : null}
            </div>
            <Field
              id="welfare-amount"
              label="Amount donors receive (₦)"
              hint="The amount the donor receives for this care item."
              type="number"
              min={0}
              step="0.01"
              error={form.formState.errors.amountNaira?.message}
              {...form.register("amountNaira")}
            />
            <div className="flex items-start gap-3 rounded-md border border-(--border) bg-(--surface) p-3">
              <input
                id="welfare-active"
                type="checkbox"
                className="mt-1"
                {...form.register("active")}
              />
              <div>
                <Label htmlFor="welfare-active" className="mb-0">
                  Offer to donors
                </Label>
                <p className="text-xs text-(--ink-muted)">
                  Donors can choose this item while it is offered.
                </p>
              </div>
            </div>

            {mutationError ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {mutationError instanceof ApiRequestError
                  ? mutationError.message
                  : "Couldn’t save this welfare item."}
              </p>
            ) : null}

            {editor.mode === "edit" && confirmDelete ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm text-rose-900">
                  Remove {editor.item.title}? Donors will no longer see it.
                </p>
                <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Keep
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={deleteMutation.isPending}
                    onClick={onDelete}
                  >
                    {deleteMutation.isPending ? "Removing…" : "Remove"}
                  </Button>
                </div>
              </div>
            ) : null}

            <ModalActions
              onCancel={closeEditor}
              pending={saving}
              label={editor.mode === "create" ? "Add welfare" : "Save price"}
            />

            {editor.mode === "edit" && !confirmDelete ? (
              <button
                type="button"
                className="text-sm text-(--danger) hover:underline"
                onClick={() => setConfirmDelete(true)}
              >
                Remove this welfare
              </button>
            ) : null}
          </form>
        </Modal>
      ) : null}
    </>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
      {hint ? <p className="mt-1 text-xs text-(--ink-muted)">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-(--danger)">{error}</p> : null}
    </div>
  );
}
