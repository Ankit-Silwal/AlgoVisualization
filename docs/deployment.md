# Deployment and operations

## Local setup

Follow README. Docker Compose binds PostgreSQL to 127.0.0.1:5437 with a named volume. The bundled credentials are local-development defaults. `docker compose down` preserves data; do not use -v unless deleting the database is intended.

Build the runner image, set RUNNER_ENABLED=true, and run `npm run worker` separately from Next.js. Accounts and queue admission require the database and applied migrations.

## Production layout

Use a Linux web host behind HTTPS, a PostgreSQL service, and one dedicated Linux runner host. The web host/container must not receive a Docker socket. Worker processes can share the runner host; stale-container cleanup does not coordinate across multiple hosts.

Provided files:

- Dockerfile: multistage Node 24 build, Next.js standalone runtime, non-root web process.
- compose.production.yaml: read-only web filesystem, loopback port 3000, dropped capabilities, bounded resources.
- deploy/Caddyfile: HTTPS reverse proxy, request size bound, forwarded-address overwrite, HSTS.
- deploy/algovisual-worker.service: dedicated-user worker with restart/shutdown behavior.

These are deployable templates. This repository's local Windows/Docker checks do not establish a tested public Linux/gVisor installation. Supply your domain, credentials, host provisioning, and backups.

## Database and web

1. Provision PostgreSQL, configure its required TLS connection parameters, and restrict network access to the web and runner hosts.
2. Create an ignored `.env.production` containing DATABASE_URL, APP_ORIGIN (e.g. https://algo.example.com), and REGISTRATION_ENABLED. Start with registration disabled except during controlled account creation. The application currently has no email verification, invitation flow, or password recovery.
3. In a trusted checkout with Node/npm installed, run npm ci and npm run db:migrate with DATABASE_URL exported. Do not copy local development env files onto production hosts; the CLI/worker loads .env.local before .env.
4. Start the web service:

```sh
docker compose --env-file .env.production -f compose.production.yaml up -d --build
```

The production Compose file enables execution admission; jobs remain unavailable until a worker is online. Set RUNNER_ENABLED=false for a web deployment with modeling/accounts only. Prisma Client is generated during image build; migrations run separately before rollout.

Install Caddy and use deploy/Caddyfile with ALGO_DOMAIN set to your domain. Point DNS at the web host, open ports 80/443, and ensure only the proxy can reach loopback port 3000. The proxy overwrites X-Forwarded-For, which makes TRUST_PROXY=true appropriate for this supplied layout. APP_ORIGIN must match the browser's HTTPS origin. Consult the official [reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy) and [request body](https://caddyserver.com/docs/caddyfile/directives/request_body) documentation for your installed Caddy version.

## Isolated worker

On a dedicated Linux runner host:

1. Install Docker, Node 24/npm, and gVisor's runsc using the official [Docker quick start](https://gvisor.dev/docs/user_guide/quick_start/docker/). Register the runtime, restart Docker, and validate a container with --runtime=runsc. Review gVisor's [security architecture](https://gvisor.dev/docs/architecture_guide/security/).
2. Check out the same release under /opt/algovisual; run npm ci and npm run runner:build. The runner image bundles Node 22, Python 3, Java 17, and GCC/C17.
3. Create an algovisual-worker service account with access to the Docker daemon and the checkout. Docker daemon access is privileged: dedicate this host to execution and keep application/database secrets out of submitted containers.
4. Create /etc/algovisual/worker.env with the worker's DATABASE_URL. Restrict file permissions to the service account/root. Install the supplied service into /etc/systemd/system, confirm /usr/bin/npm and the working directory, then enable it:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now algovisual-worker
sudo journalctl -u algovisual-worker -f
```

The service sets NODE_ENV=production and RUNNER_RUNTIME=runsc. Production workers refuse to start without that runtime setting. Registration still must be validated on the host; setting a variable does not install isolation.

Each execution container has no network or host mounts, UID/GID 65534, read-only root, dropped capabilities, no-new-privileges, one CPU, 384 MiB RAM/no extra swap, 64 PIDs, bounded tmpfs, file-size/output limits, compilation and execution deadlines. Cancellation and watchdogs remove the named container. User source travels over stdin, never through host shell interpolation. Only the worker has Docker access.

## Operating the service

- Apply migrations before starting new web/worker releases. Keep versions aligned.
- Back up PostgreSQL with your provider's snapshot/PITR facilities and verify restoration. Experiments are persistent; queue results expire after 24 hours.
- Monitor worker heartbeat age, QUEUED backlog, failure rates, Docker disk use, database capacity, and per-account quotas.
- Review container image/toolchain patches regularly; rebuild and replace runners after updates.
- Shutdown waits for aborted active jobs. Interrupted jobs are failed after their 120-second lease expires; users can rerun them.
- Disable registrations or execution using env flags during maintenance; restart affected services.
- Authentication and quotas are built in, but production still needs host/network maintenance, TLS, backups, and operational monitoring.

## Troubleshooting

- Database unavailable: verify DATABASE_URL, docker compose ps, and migrations.
- No worker online: start npm run worker and check heartbeat/database connectivity.
- Missing runner image: npm run runner:build on the worker host.
- Production worker refuses startup: install/test runsc and verify the service environment.
- Java submission errors: full programs use Main; method mode uses Solution and a supported signature.
- Wrong answer for search: use the expected index and sorted input for binary search.
- Unexpected timings: startup/noise dominates small cases; use repeated representative inputs.
- Unexpected complexity: review low-confidence suggestions and manually set case models.
