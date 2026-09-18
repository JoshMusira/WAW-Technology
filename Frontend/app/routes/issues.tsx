import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { MessageSquare, Pencil, Plus, Search, UserRound } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { controlClassName, Field, Label } from "~/components/ui/field";
import {
  priorities,
  statuses,
  useAddComment,
  useCreateIssue,
  useIssues,
  useUpdateIssue,
  useUsers,
  type Issue,
  type Priority,
  type Status,
} from "~/hooks/use-issues";

const labels: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const statusVariants: Record<Status, "neutral" | "blue" | "green" | "accent"> = {
  OPEN: "blue",
  IN_PROGRESS: "accent",
  RESOLVED: "green",
  CLOSED: "neutral",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));

type Filters = {
  status: string;
  priority: string;
  assignedToId: string;
  search: string;
};

type UpdateIssue = (data: {
  id: number;
  data: Partial<{
    title: string;
    description: string;
    priority: Priority;
    assignedToId: number;
  }> & { status?: Status };
}) => Promise<unknown>;

export default function Issues() {
  const [filters, setFilters] = useState<Filters>({
    status: "",
    priority: "",
    assignedToId: "",
    search: "",
  });
  const [showCreate, setShowCreate] = useState(false);

  const issuesQuery = useIssues(filters);
  const usersQuery = useUsers();
  const createIssue = useCreateIssue();
  const updateIssue = useUpdateIssue();
  const addComment = useAddComment();

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    await createIssue.mutateAsync({
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      priority: String(form.get("priority") ?? "MEDIUM") as Priority,
      ...(form.get("assignedToId")
        ? { assignedToId: Number(form.get("assignedToId")) }
        : {}),
    });

    event.currentTarget.reset();
    setShowCreate(false);
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B4421E]">
            Workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Issue management
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Create, prioritize, assign, and resolve work in one place.
          </p>
        </div>

        <Button variant="accent" onClick={() => setShowCreate((visible) => !visible)}>
          <Plus className="h-4 w-4" />
          {showCreate ? "Close form" : "Create issue"}
        </Button>
      </header>

      {showCreate && (
        <CreateIssueForm
          users={usersQuery.data ?? []}
          isPending={createIssue.isPending}
          isError={createIssue.isError}
          onSubmit={handleCreate}
        />
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Find an issue</CardTitle>
          <CardDescription>Filter by status, priority, or ownership.</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={filters.search}
              onChange={(event) => setFilter("search", event.target.value)}
              placeholder="Search issues"
              className={`${controlClassName} pl-9`}
            />
          </div>

          <select
            value={filters.status}
            onChange={(event) => setFilter("status", event.target.value)}
            className={controlClassName}
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {labels[value]}
              </option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(event) => setFilter("priority", event.target.value)}
            className={controlClassName}
          >
            <option value="">All priorities</option>
            {priorities.map((value) => (
              <option key={value} value={value}>
                {labels[value]}
              </option>
            ))}
          </select>

          <select
            value={filters.assignedToId}
            onChange={(event) => setFilter("assignedToId", event.target.value)}
            className={controlClassName}
          >
            <option value="">Everyone</option>
            {usersQuery.data?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {issuesQuery.isLoading && (
        <p className="text-sm text-slate-500">Loading issues...</p>
      )}

      {issuesQuery.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">
            Unable to load issues. Please sign in again.
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {issuesQuery.data?.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            users={usersQuery.data ?? []}
            onUpdate={updateIssue.mutateAsync}
            onComment={addComment.mutateAsync}
          />
        ))}
      </div>

      {!issuesQuery.isLoading && !issuesQuery.data?.length && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="rounded-full bg-slate-100 p-3">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <p className="font-medium text-slate-700">No issues match these filters.</p>
            <p className="text-sm text-slate-500">
              Try adjusting your filters or create a new issue.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function CreateIssueForm({
  users,
  isPending,
  isError,
  onSubmit,
}: {
  users: { id: number; name: string }[];
  isPending: boolean;
  isError: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card className="border-[#B4421E]/20">
      <CardHeader>
        <CardTitle>New issue</CardTitle>
        <CardDescription>
          Capture the details your team needs to take action.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2">
          <Field className="md:col-span-2">
            <Label htmlFor="title">Title</Label>
            <input
              id="title"
              name="title"
              required
              className={controlClassName}
              placeholder="Describe the issue briefly"
            />
          </Field>

          <Field className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              className={controlClassName}
              placeholder="Add context, expected behavior, and useful details"
            />
          </Field>

          <Field>
            <Label htmlFor="priority">Priority</Label>
            <select id="priority" name="priority" defaultValue="MEDIUM" className={controlClassName}>
              {priorities.map((value) => (
                <option key={value} value={value}>
                  {labels[value]}
                </option>
              ))}
            </select>
          </Field>

          <Field>
            <Label htmlFor="assignedToId">Assign to</Label>
            <select id="assignedToId" name="assignedToId" defaultValue="" className={controlClassName}>
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </Field>

          {isError && (
            <p role="alert" className="text-sm text-red-600 md:col-span-2">
              Unable to create issue. Please check the details and try again.
            </p>
          )}

          <div className="md:col-span-2">
            <Button type="submit" variant="accent" disabled={isPending}>
              {isPending ? "Creating..." : "Create issue"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function IssueCard({
  issue,
  users,
  onUpdate,
  onComment,
}: {
  issue: Issue;
  users: { id: number; name: string }[];
  onUpdate: UpdateIssue;
  onComment: (data: { id: number; body: string }) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState("");

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const assignedToId = String(form.get("assignedToId") ?? "");

    await onUpdate({
      id: issue.id,
      data: {
        title: String(form.get("title")),
        description: String(form.get("description")),
        priority: String(form.get("priority")) as Priority,
        ...(assignedToId ? { assignedToId: Number(assignedToId) } : {}),
      },
    });

    setEditing(false);
  };

  const handleComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!comment.trim()) return;

    await onComment({ id: issue.id, body: comment });
    setComment("");
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {editing ? (
          <form onSubmit={handleEdit} className="space-y-4">
            <Field>
              <Label htmlFor={`title-${issue.id}`}>Title</Label>
              <input
                id={`title-${issue.id}`}
                name="title"
                defaultValue={issue.title}
                required
                className={controlClassName}
              />
            </Field>

            <Field>
              <Label htmlFor={`description-${issue.id}`}>Description</Label>
              <textarea
                id={`description-${issue.id}`}
                name="description"
                defaultValue={issue.description}
                required
                rows={3}
                className={controlClassName}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label htmlFor={`priority-${issue.id}`}>Priority</Label>
                <select
                  id={`priority-${issue.id}`}
                  name="priority"
                  defaultValue={issue.priority}
                  className={controlClassName}
                >
                  {priorities.map((value) => (
                    <option key={value} value={value}>
                      {labels[value]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <Label htmlFor={`assigned-${issue.id}`}>Assigned to</Label>
                <select
                  id={`assigned-${issue.id}`}
                  name="assignedToId"
                  defaultValue={issue.assignedToId ?? ""}
                  className={controlClassName}
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div>
              <Button type="submit" size="sm">
                Save changes
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="truncate">{issue.title}</CardTitle>
                  <Badge variant="accent">{labels[issue.priority]}</Badge>
                  <Badge variant={statusVariants[issue.status]}>{labels[issue.status]}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{issue.description}</p>
              </div>

              <select
                aria-label={`Change status for ${issue.title}`}
                value={issue.status}
                onChange={(event) =>
                  onUpdate({ id: issue.id, data: { status: event.target.value as Status } })
                }
                className="h-9 shrink-0 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5" />
                {issue.createdBy.name}
              </span>
              <span>{issue.assignedTo ? `Assigned to ${issue.assignedTo.name}` : "Unassigned"}</span>
              <span>Updated {formatDate(issue.updatedAt)}</span>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4 text-slate-500" />
          Comments <span className="text-slate-400">{issue.comments.length}</span>
        </div>

        <div className="space-y-2">
          {issue.comments.map((item) => (
            <div key={item.id} className="rounded-md bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
              <p className="font-medium text-slate-800">{item.author.name}</p>
              <p className="mt-1 text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleComment} className="mt-3 flex gap-2">
          <input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Add a comment..."
            className={`${controlClassName} min-w-0`}
          />
          <Button type="submit" size="sm">
            Comment
          </Button>
        </form>
      </div>
    </Card>
  );
}