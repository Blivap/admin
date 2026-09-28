"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReloadButton } from "@/components/ui/reload-button";
import { Textarea } from "@/components/ui/textarea";
import { newCmsId, useCms } from "@/hooks/use-cms";
import { ApiRequestError } from "@/lib/api/client";

export function CmsEditor() {
  const { cmsQuery, form, sections, faqs, testimonials, saveMutation } =
    useCms();

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

  return (
    <form
      className="space-y-8"
      onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
    >
      <div className="flex justify-end">
        <ReloadButton
          onReload={() => cmsQuery.refetch()}
          loading={cmsQuery.isFetching}
        />
      </div>
      <Section
        title="Landing sections"
        onAdd={() =>
          sections.append({
            id: newCmsId(),
            key: `section_${sections.fields.length + 1}`,
            title: "",
            body: "",
            sortOrder: sections.fields.length,
          })
        }
      >
        {sections.fields.map((field, index) => (
          <div
            key={field.id}
            className="space-y-3 rounded-lg border border-(--border) bg-white p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Key</Label>
                <Input {...form.register(`landingSections.${index}.key`)} />
              </div>
              <div>
                <Label>Title</Label>
                <Input {...form.register(`landingSections.${index}.title`)} />
              </div>
            </div>
            <div>
              <Label>Body</Label>
              <Textarea {...form.register(`landingSections.${index}.body`)} />
            </div>
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => sections.remove(index)}
            >
              Remove
            </Button>
          </div>
        ))}
      </Section>

      <Section
        title="FAQ entries"
        onAdd={() =>
          faqs.append({
            id: newCmsId(),
            question: "",
            answer: "",
            sortOrder: faqs.fields.length,
            published: true,
          })
        }
      >
        {faqs.fields.map((field, index) => (
          <div
            key={field.id}
            className="space-y-3 rounded-lg border border-(--border) bg-white p-4"
          >
            <div>
              <Label>Question</Label>
              <Input {...form.register(`faqs.${index}.question`)} />
            </div>
            <div>
              <Label>Answer</Label>
              <Textarea {...form.register(`faqs.${index}.answer`)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...form.register(`faqs.${index}.published`)}
              />
              Published
            </label>
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => faqs.remove(index)}
            >
              Remove
            </Button>
          </div>
        ))}
      </Section>

      <Section
        title="Testimonials"
        onAdd={() =>
          testimonials.append({
            id: newCmsId(),
            authorName: "",
            quote: "",
            role: "",
            sortOrder: testimonials.fields.length,
            published: true,
          })
        }
      >
        {testimonials.fields.map((field, index) => (
          <div
            key={field.id}
            className="space-y-3 rounded-lg border border-(--border) bg-white p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Author</Label>
                <Input {...form.register(`testimonials.${index}.authorName`)} />
              </div>
              <div>
                <Label>Role</Label>
                <Input {...form.register(`testimonials.${index}.role`)} />
              </div>
            </div>
            <div>
              <Label>Quote</Label>
              <Textarea {...form.register(`testimonials.${index}.quote`)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...form.register(`testimonials.${index}.published`)}
              />
              Published
            </label>
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => testimonials.remove(index)}
            >
              Remove
            </Button>
          </div>
        ))}
      </Section>

      {saveMutation.isSuccess ? (
        <p className="text-sm text-emerald-700">CMS content saved.</p>
      ) : null}
      {saveMutation.error instanceof ApiRequestError ? (
        <p className="text-sm text-(--danger)">
          {saveMutation.error.message}
        </p>
      ) : null}

      <Button type="submit" disabled={saveMutation.isPending}>
        {saveMutation.isPending ? "Saving…" : "Save all content"}
      </Button>
    </form>
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
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-(--ink-muted)">
          {title}
        </h2>
        <Button type="button" size="sm" variant="secondary" onClick={onAdd}>
          Add
        </Button>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
