import { redirect, notFound } from "next/navigation";
import { Globe, Plus, Trash2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getUserOrganization,
  getProjectBySlug,
  getRoutesByProject,
  getServicesByProject,
  getEnvironmentsByProject,
  getManagedProxies,
} from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createRouteAction,
  deleteRouteAction,
  updateRouteAction,
} from "@/lib/actions/operations";

export default async function RoutesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const ctx = await getUserOrganization(user.id);
  if (!ctx) redirect("/login");

  const { slug } = await params;
  const project = await getProjectBySlug(ctx.org.id, slug);
  if (!project) notFound();

  const [routeList, serviceList, environmentList, proxies] = await Promise.all(
    [
      getRoutesByProject(project.id),
      getServicesByProject(project.id),
      getEnvironmentsByProject(project.id),
      getManagedProxies(project.id),
    ]
  );

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Routes</h2>
          <p className="text-sm text-muted-foreground">
            Route traffic to services via the managed Caddy reverse proxy.
          </p>
        </div>
        <details className="group relative">
          <summary className="list-none">
            <Button asChild>
              <span>
                <Plus className="mr-2 h-4 w-4" />
                Add route
              </span>
            </Button>
          </summary>
          <Card className="absolute right-0 z-20 mt-2 w-[440px] p-5 shadow-xl">
            <form
              action={createRouteAction.bind(null, project.id)}
              className="space-y-3"
            >
              <Input name="domain" placeholder="api.example.com" required />
              <Input name="pathPrefix" defaultValue="/" />
              <div className="grid grid-cols-2 gap-2">
                <select
                  name="serviceId"
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Service</option>
                  {serviceList.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
                <select
                  name="environmentId"
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Environment</option>
                  {environmentList.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input name="port" type="number" defaultValue="8080" />
                <select
                  name="tlsMode"
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="auto">Automatic TLS</option>
                  <option value="custom">Custom TLS</option>
                  <option value="none">No TLS</option>
                </select>
                <Input
                  name="rateLimit"
                  type="number"
                  min="1"
                  placeholder="Req/s"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input name="tlsCertSecret" placeholder="TLS cert secret" />
                <Input name="tlsKeySecret" placeholder="TLS key secret" />
              </div>
              <Textarea
                name="requestHeaders"
                placeholder={"Request headers\nX-Forwarded-By=Bower"}
              />
              <Textarea
                name="responseHeaders"
                placeholder={"Response headers\nX-Frame-Options=DENY"}
              />
              <Textarea
                name="redirects"
                placeholder={"Redirects\n/old /new 308"}
              />
              <Button className="w-full">Create & sync proxy</Button>
            </form>
          </Card>
        </details>
      </div>

      {routeList.length === 0 && proxies.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Globe className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No routes configured</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Routes will appear here once you configure domain routing.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {proxies.map(({ proxy, environmentName }) => (
            <Card
              key={proxy.id}
              className="border-primary/20 bg-primary/5 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Managed proxy &middot; {environmentName}
              </p>
              <p className="mt-1 text-sm">
                {proxy.trellisJobName} &middot; {proxy.status} &middot; config{" "}
                {proxy.configHash?.slice(0, 10) ?? "pending"}
              </p>
            </Card>
          ))}
          {routeList.map((r) => (
            <Card key={r.route.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-sm font-medium">
                      {r.route.domain}
                      {r.route.pathPrefix !== "/" && r.route.pathPrefix}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {r.route.tlsMode}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    &rarr; {r.serviceName} ({r.environmentName}) :
                    {r.route.port}
                  </p>
                </div>
                <div className="flex gap-2">
                  <details className="relative">
                    <summary className="list-none">
                      <Button size="sm" variant="outline" asChild>
                        <span>Edit</span>
                      </Button>
                    </summary>
                    <Card className="absolute right-0 z-20 mt-2 w-[440px] p-5 shadow-xl">
                      <form
                        action={updateRouteAction.bind(
                          null,
                          project.id,
                          r.route.id
                        )}
                        className="space-y-3"
                      >
                        <Input
                          name="domain"
                          defaultValue={r.route.domain}
                          required
                        />
                        <Input
                          name="pathPrefix"
                          defaultValue={r.route.pathPrefix}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            name="port"
                            type="number"
                            defaultValue={r.route.port}
                          />
                          <select
                            name="tlsMode"
                            defaultValue={r.route.tlsMode}
                            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                          >
                            <option value="auto">Automatic TLS</option>
                            <option value="custom">Custom TLS</option>
                            <option value="none">No TLS</option>
                          </select>
                          <Input
                            name="rateLimit"
                            type="number"
                            defaultValue={r.route.rateLimit ?? ""}
                            placeholder="Req/s"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            name="tlsCertSecret"
                            defaultValue={r.route.tlsCertSecret ?? ""}
                          />
                          <Input
                            name="tlsKeySecret"
                            defaultValue={r.route.tlsKeySecret ?? ""}
                          />
                        </div>
                        <Textarea
                          name="requestHeaders"
                          defaultValue={Object.entries(
                            r.route.headers as Record<string, string>
                          )
                            .map(([k, v]) => `${k}=${v}`)
                            .join("\n")}
                        />
                        <Textarea
                          name="responseHeaders"
                          defaultValue={Object.entries(
                            r.route.responseHeaders as Record<string, string>
                          )
                            .map(([k, v]) => `${k}=${v}`)
                            .join("\n")}
                        />
                        <Textarea
                          name="redirects"
                          defaultValue={(
                            r.route.redirects as Array<{
                              from: string;
                              to: string;
                              code?: number;
                            }>
                          )
                            .map(
                              (item) =>
                                `${item.from} ${item.to} ${item.code || 308}`
                            )
                            .join("\n")}
                        />
                        <Button className="w-full">Save & reload</Button>
                      </form>
                    </Card>
                  </details>
                  <form
                    action={deleteRouteAction.bind(
                      null,
                      project.id,
                      r.route.id
                    )}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete route"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Card className="mt-5 p-5">
        <h3 className="font-semibold">DNS setup</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Point each route domain at a cluster node using an A/AAAA record, or
          a CNAME to your cluster ingress hostname. Bower does not change DNS.
        </p>
      </Card>
    </div>
  );
}
