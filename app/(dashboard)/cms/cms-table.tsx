"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Suspense, useEffect, useRef } from "react";
import { useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReloadButton } from "@/components/ui/reload-button";
import { Textarea } from "@/components/ui/textarea";
import {
  newCmsId,
  useCms,
  type CmsFormValues,
} from "@/hooks/use-cms";
import { useUrlParams } from "@/hooks/use-url-params";
import { ApiRequestError } from "@/lib/api/client";

type EditKind = "landing" | "faq" | "testimonial";

const urlDefaults = { edit: "" };

function parseEdit(raw: string): { kind: EditKind; id: string } | null {
  const [kind, ...rest] = raw.split(":");
  const id = rest.join(":");
  if (!id) return null;
  if (kind === "landing" || kind === "faq" || kind === "testimonial") {
    return { kind, id };
  }
  return null;
}

function editKey(kind: EditKind, id: string) {
  return `${kind}:${id}`;
}

function isDraftId(id: string) {
  return id.startsWith("tmp_");
}

function CmsEditorInner() {
  const {
    cmsQuery,
    form,
    sections,
    faqs,
    testimonials,
    saveMutation,
    reloadFromApi,
  } = useCms();
  const [url, setUrl] = useUrlParams(urlDefaults);
  const editing = parseEdit(url.edit);
  const discardedDrafts = useRef(new Set<string>());

  const values = useWatch({ control: form.control }) as CmsFormValues;

  const openEdit = (kind: EditKind, id: string) => {
    discardedDrafts.current.delete(id);
    setUrl({ edit: editKey(kind, id) });
  };
  const closeEdit = () => setUrl({ edit: "" });

  const isEditingItem = (kind: EditKind, id: string) =>
    isDraftId(id) || (editing?.kind === kind && editing.id === id);

  // Recreate a draft after refresh/remount when URL still points at it.
  useEffect(() => {
    if (!cmsQuery.isSuccess || !editing || !isDraftId(editing.id)) return;
    if (discardedDrafts.current.has(editing.id)) return;

    if (editing.kind === "landing") {
      const list = form.getValues("landingSections") ?? [];
      if (list.some((item) => item.id === editing.id)) return;
      sections.append({
        id: editing.id,
        key: "",
        title: "",
        body: "",
        sortOrder: list.length,
      });
      return;
    }

    if (editing.kind === "faq") {
      const list = form.getValues("faqs") ?? [];
      if (list.some((item) => item.id === editing.id)) return;
      faqs.append({
        id: editing.id,
        question: "",
        answer: "",
        sortOrder: list.length,
        published: true,
      });
      return;
    }

    const list = form.getValues("testimonials") ?? [];
    if (list.some((item) => item.id === editing.id)) return;
    testimonials.append({
      id: editing.id,
      authorName: "",
      quote: "",
      role: "",
      sortOrder: list.length,
      published: true,
    });
  }, [cmsQuery.isSuccess, editing, faqs, form, sections, testimonials]);

  const removeItem = (kind: EditKind, index: number, id: string) => {
    if (isDraftId(id)) {
      discardedDrafts.current.add(id);
    }
    if (kind === "landing") sections.remove(index);
    if (kind === "faq") faqs.remove(index);
    if (kind === "testimonial") testimonials.remove(index);
    if (editing?.kind === kind && editing.id === id) closeEdit();
  };

  const cancelEdit = (kind: EditKind, index: number, id: string) => {
    if (isDraftId(id)) {
      removeItem(kind, index, id);
      return;
    }

    const source = cmsQuery.data;
    if (kind === "landing") {
      const original = source?.landingSections.find((s) => s.id === id);
      if (original) form.setValue(`landingSections.${index}`, original);
    }
    if (kind === "faq") {
      const original = source?.faqs.find((s) => s.id === id);
      if (original) form.setValue(`faqs.${index}`, original);
    }
    if (kind === "testimonial") {
      const original = source?.testimonials.find((s) => s.id === id);
      if (original) form.setValue(`testimonials.${index}`, original);
    }
    closeEdit();
  };

  if (cmsQuery.isLoading) return <EmptyState title="Loading CMS content…" />;
  if (cmsQuery.isError) {
    return (
      <EmptyState
        title="Couldn’t load CMS"
        description={
          cmsQuery.error instanceof ApiRequestError
            ? cmsQuery.error.message
            : undefined
        }
      />
    );
  }

  const addSection = () => {
    const id = newCmsId();
    discardedDrafts.current.delete(id);
    const list = form.getValues("landingSections") ?? [];
    sections.append({
      id,
      key: "",
      title: "",
      body: "",
      sortOrder: list.length,
    });
    openEdit("landing", id);
  };

  const addFaq = () => {
    const id = newCmsId();
    discardedDrafts.current.delete(id);
    const list = form.getValues("faqs") ?? [];
    faqs.append({
      id,
      question: "",
      answer: "",
      sortOrder: list.length,
      published: true,
    });
    openEdit("faq", id);
  };

  const addTestimonial = () => {
    const id = newCmsId();
    discardedDrafts.current.delete(id);
    const list = form.getValues("testimonials") ?? [];
    testimonials.append({
      id,
      authorName: "",
      quote: "",
      role: "",
      sortOrder: list.length,
      published: true,
    });
    openEdit("testimonial", id);
  };

  const landingItems = values.landingSections ?? [];
  const faqItems = values.faqs ?? [];
  const testimonialItems = values.testimonials ?? [];

  return (
    <form
      className="space-y-8"
      onSubmit={form.handleSubmit((next) => saveMutation.mutate(next))}
    >
      <div className="flex flex-wrap items-center justify-end gap-2">
        <ReloadButton
          onReload={() => {
            closeEdit();
            void reloadFromApi();
          }}
          loading={cmsQuery.isFetching}
        />
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving…" : "Save all content"}
        </Button>
      </div>

      <Section title="Landing sections" onAdd={addSection}>
        {landingItems.length === 0 ? (
          <EmptyCard label="No landing sections yet — click Add for a blank form" />
        ) : (
          landingItems.map((item, index) => {
            const editingThis = isEditingItem("landing", item.id);
            return (
              <article
                key={item.id}
                className={
                  editingThis
                    ? "space-y-3 rounded-lg border-2 border-(--brand) bg-white p-4 shadow-sm"
                    : "space-y-2 rounded-lg border border-(--border) bg-(--surface) p-4"
                }
              >
                {editingThis ? (
                  <>
                    <p className="text-xs font-medium text-(--brand)">
                      {isDraftId(item.id) ? "New section" : "Editing section"}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Key</Label>
                        <Input
                          placeholder="e.g. hero"
                          {...form.register(`landingSections.${index}.key`)}
                        />
                      </div>
                      <div>
                        <Label>Title</Label>
                        <Input
                          placeholder="Section title"
                          {...form.register(`landingSections.${index}.title`)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Body</Label>
                      <Textarea
                        placeholder="Write the section body…"
                        {...form.register(`landingSections.${index}.body`)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isDraftId(item.id) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => removeItem("landing", index, item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </Button>
                      ) : (
                        <>
                          <Button type="button" size="sm" onClick={closeEdit}>
                            Done
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              cancelEdit("landing", index, item.id)
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              removeItem("landing", index, item.id)
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-(--ink-subtle)">
                        {item.key || "untitled key"}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-(--ink)">
                        {item.title || "Untitled section"}
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-(--ink-muted)">
                        {item.body || "No body yet."}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => openEdit("landing", item.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                )}
              </article>
            );
          })
        )}
      </Section>

      <Section title="FAQ entries" onAdd={addFaq}>
        {faqItems.length === 0 ? (
          <EmptyCard label="No FAQ entries yet — click Add for a blank form" />
        ) : (
          faqItems.map((item, index) => {
            const editingThis = isEditingItem("faq", item.id);
            return (
              <article
                key={item.id}
                className={
                  editingThis
                    ? "space-y-3 rounded-lg border-2 border-(--brand) bg-white p-4 shadow-sm"
                    : "space-y-2 rounded-lg border border-(--border) bg-(--surface) p-4"
                }
              >
                {editingThis ? (
                  <>
                    <p className="text-xs font-medium text-(--brand)">
                      {isDraftId(item.id) ? "New FAQ" : "Editing FAQ"}
                    </p>
                    <div>
                      <Label>Question</Label>
                      <Input
                        placeholder="Question"
                        {...form.register(`faqs.${index}.question`)}
                      />
                    </div>
                    <div>
                      <Label>Answer</Label>
                      <Textarea
                        placeholder="Answer"
                        {...form.register(`faqs.${index}.answer`)}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        {...form.register(`faqs.${index}.published`)}
                      />
                      Published
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {isDraftId(item.id) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => removeItem("faq", index, item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </Button>
                      ) : (
                        <>
                          <Button type="button" size="sm" onClick={closeEdit}>
                            Done
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => cancelEdit("faq", index, item.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() => removeItem("faq", index, item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2">
                        <Badge tone={item.published ? "success" : "neutral"}>
                          {item.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <h3 className="text-base font-semibold text-(--ink)">
                        {item.question || "Untitled question"}
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-(--ink-muted)">
                        {item.answer || "No answer yet."}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => openEdit("faq", item.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                )}
              </article>
            );
          })
        )}
      </Section>

      <Section title="Testimonials" onAdd={addTestimonial}>
        {testimonialItems.length === 0 ? (
          <EmptyCard label="No testimonials yet — click Add for a blank form" />
        ) : (
          testimonialItems.map((item, index) => {
            const editingThis = isEditingItem("testimonial", item.id);
            return (
              <article
                key={item.id}
                className={
                  editingThis
                    ? "space-y-3 rounded-lg border-2 border-(--brand) bg-white p-4 shadow-sm"
                    : "space-y-2 rounded-lg border border-(--border) bg-(--surface) p-4"
                }
              >
                {editingThis ? (
                  <>
                    <p className="text-xs font-medium text-(--brand)">
                      {isDraftId(item.id)
                        ? "New testimonial"
                        : "Editing testimonial"}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Author</Label>
                        <Input
                          placeholder="Author name"
                          {...form.register(
                            `testimonials.${index}.authorName`,
                          )}
                        />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Input
                          placeholder="Role (optional)"
                          {...form.register(`testimonials.${index}.role`)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Quote</Label>
                      <Textarea
                        placeholder="Quote"
                        {...form.register(`testimonials.${index}.quote`)}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        {...form.register(`testimonials.${index}.published`)}
                      />
                      Published
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {isDraftId(item.id) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            removeItem("testimonial", index, item.id)
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </Button>
                      ) : (
                        <>
                          <Button type="button" size="sm" onClick={closeEdit}>
                            Done
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              cancelEdit("testimonial", index, item.id)
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              removeItem("testimonial", index, item.id)
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2">
                        <Badge tone={item.published ? "success" : "neutral"}>
                          {item.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <blockquote className="text-sm italic text-(--ink)">
                        “{item.quote || "No quote yet."}”
                      </blockquote>
                      <p className="mt-2 text-sm font-medium text-(--ink)">
                        {item.authorName || "Unknown author"}
                        {item.role ? (
                          <span className="font-normal text-(--ink-muted)">
                            {" "}
                            · {item.role}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => openEdit("testimonial", item.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                )}
              </article>
            );
          })
        )}
      </Section>

      {saveMutation.isSuccess ? (
        <p className="text-sm text-emerald-700">CMS content saved.</p>
      ) : null}
      {saveMutation.error instanceof ApiRequestError ? (
        <p className="text-sm text-(--danger)">
          {saveMutation.error.message}
        </p>
      ) : null}
    </form>
  );
}

export function CmsEditor() {
  return (
    <Suspense fallback={<EmptyState title="Loading CMS content…" />}>
      <CmsEditorInner />
    </Suspense>
  );
}

function Section({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-(--ink-muted)">
          {title}
        </h2>
        <Button type="button" size="sm" variant="secondary" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function EmptyCard({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-(--border) bg-(--surface) px-4 py-8 text-center text-sm text-(--ink-muted)">
      {label}
    </div>
  );
}
