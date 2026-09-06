import { redirect } from "next/navigation";
import {
  Blocks,
  Database,
  Globe2,
  Plus,
  RadioTower,
  ServerCog,
  Trash2,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getTemplates, getUserOrganization } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/page-heading";
import {
  createTemplateAction,
  deleteTemplateAction,
} from "@/lib/actions/operations";
import { BUILTIN_TEMPLATES } from "@/lib/builtin-templates";

const icons = [Globe2, RadioTower, ServerCog, Database, Blocks];

export default async function TemplatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ctx = await getUserOrganization(user.id);
  if (!ctx) redirect("/login");
  const custom = await getTemplates(ctx.org.id);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading
        eyebrow="Catalog"
        title="Service templates"
        description="Opinionated starting points that remain fully editable after creation."
        actions={
          <details className="relative">
            <summary className="list-none">
              <Button asChild>
                <span>
                  <Plus className="mr-2 h-4 w-4" />
                  Custom template
                </span>
              </Button>
            </summary>
            <Card className="absolute right-0 z-20 mt-2 w-96 p-5 shadow-xl">
              <form action={createTemplateAction} className="space-y-3">
                <Input name="name" placeholder="Template name" required />
                <Input name="description" placeholder="What is this for?" />
                <select
                  name="type"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="web">Web</option>
                  <option value="worker">Worker</option>
                  <option value="cron">Cron</option>
                  <option value="custom">Custom</option>
                </select>
                <Input name="image" placeholder="ghcr.io/org/image:tag" />
                <div className="grid grid-cols-2 gap-2">
                  <Input name="port" type="number" placeholder="Port" />
                  <Input
                    name="replicas"
                    type="number"
                    min="0"
                    defaultValue="1"
                  />
                </div>
                <Textarea
                  name="config"
                  className="font-mono text-xs"
                  placeholder={
                    'Optional full config JSON\n{"volumes":[],"healthCheckType":"tcp"}'
                  }
                />
                <Button className="w-full">Save template</Button>
              </form>
            </Card>
          </details>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {BUILTIN_TEMPLATES.map((item, index) => {
          const Icon = icons[index % icons.length];
          return (
            <Card
              key={item.name}
              className="group p-6 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </span>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {item.type}
                </Badge>
              </div>
              <h2 className="mt-5 text-lg font-bold">{item.name}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </Card>
          );
        })}

        {custom.map((template) => (
          <Card
            key={template.id}
            className="group p-6 transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10">
                <Blocks className="h-5 w-5 text-primary" />
              </span>
              <form action={deleteTemplateAction.bind(null, template.id)}>
                <Button size="icon" variant="ghost">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </form>
            </div>
            <h2 className="mt-5 text-lg font-bold">{template.name}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {template.description ?? "Custom organization template."}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
