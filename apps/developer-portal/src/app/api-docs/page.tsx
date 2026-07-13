import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API documentation",
  description:
    "Bounded public API documentation based on verified PulseGate runtime contracts.",
};

const publicEndpoints = [
  {
    id: "gateway-health",
    group: "Platform health",
    method: "GET",
    path: "/health",
    title: "API Gateway health",
    summary:
      "Checks whether the API Gateway process is available and responding.",
    authentication: [
      "No API key is required.",
      "No bearer token is required.",
    ],
    behavior: [
      "Returns the API Gateway service name, status, and an ISO timestamp.",
      "Returns an x-request-id response header.",
      "Applies the Gateway security response headers.",
    ],
    request:
      "curl.exe -i https://pulsegate-public-demo-api.onrender.com/health",
    response: `{
  "service": "api-gateway",
  "status": "ok",
  "timestamp": "<ISO-8601 timestamp>"
}`,
    headers: ["x-request-id"],
  },
  {
    id: "product-service-health",
    group: "Downstream health",
    method: "GET",
    path: "/api/product-service/health",
    title: "Product Service health through PulseGate",
    summary:
      "Proxies the Product Service health response through the Gateway.",
    authentication: [
      "No API key is required.",
      "No bearer token is required.",
    ],
    behavior: [
      "Forwards the Product Service health payload.",
      "Uses the configured downstream timeout.",
      "Does not apply the current product-route rate limit.",
      "Reports x-cache as BYPASS.",
    ],
    request:
      "curl.exe -i https://pulsegate-public-demo-api.onrender.com/api/product-service/health",
    response: null,
    headers: [
      "x-request-id",
      "x-response-time-ms",
      "x-cache",
    ],
  },
  {
    id: "list-products",
    group: "Product API",
    method: "GET",
    path: "/api/products",
    title: "List products",
    summary:
      "Forwards an authenticated product-list request to Product Service.",
    authentication: [
      "Send the API key in the x-api-key request header.",
      "Send a valid bearer token in the Authorization request header.",
      "Both credentials are required by the current static route policy.",
    ],
    behavior: [
      "Forwards the successful JSON body from Product Service.",
      "The current static policy enables a 30-second response cache.",
      "The current static policy applies route rate limiting.",
      "Database-backed API keys can also be subject to usage-plan quotas.",
      "The successful response schema remains downstream-owned and is not frozen by this static reference.",
    ],
    request:
      'curl.exe -i https://pulsegate-public-demo-api.onrender.com/api/products -H "x-api-key: <your-api-key>" -H "Authorization: Bearer <your-bearer-token>"',
    response: null,
    headers: [
      "x-request-id",
      "x-response-time-ms",
      "x-cache",
      "x-ratelimit-limit",
      "x-ratelimit-remaining",
      "x-ratelimit-reset",
      "retry-after on a rate-limit rejection",
    ],
  },
] as const;

const documentedErrors = [
  {
    status: "401",
    code: "API_KEY_MISSING",
    meaning: "The protected route requires an API key.",
  },
  {
    status: "403",
    code: "API_KEY_INVALID",
    meaning: "The supplied API key could not be verified.",
  },
  {
    status: "401",
    code: "JWT_TOKEN_MISSING",
    meaning: "The protected route requires a bearer token.",
  },
  {
    status: "403",
    code: "JWT_TOKEN_INVALID",
    meaning: "The supplied bearer token could not be verified.",
  },
  {
    status: "429",
    code: "TOO_MANY_REQUESTS",
    meaning: "The route-level rate limit has been exceeded.",
  },
  {
    status: "429",
    code: "QUOTA_EXCEEDED",
    meaning:
      "A database-backed API key has exhausted its current usage-plan quota.",
  },
  {
    status: "404",
    code: "ROUTE_NOT_FOUND",
    meaning: "No active runtime route matches the request.",
  },
  {
    status: "4xx / 502",
    code: "DOWNSTREAM_HTTP_ERROR",
    meaning:
      "Preserves a downstream 4xx status and maps a downstream 5xx status to 502.",
  },
  {
    status: "502",
    code: "DOWNSTREAM_INVALID_RESPONSE",
    meaning: "The downstream service returned an invalid JSON response.",
  },
  {
    status: "503",
    code: "DOWNSTREAM_SERVICE_UNAVAILABLE",
    meaning: "The downstream service could not be reached.",
  },
  {
    status: "504",
    code: "DOWNSTREAM_TIMEOUT",
    meaning: "The downstream request exceeded its configured timeout.",
  },
] as const;

export default function ApiDocsPage() {
  return (
    <section className="page-stack docs-page">
      <header className="docs-hero">
        <p className="eyebrow">Public Demo v2.0.0</p>
        <h1>Public API documentation foundation.</h1>
        <p>
          This static reference documents only runtime contracts that are
          verified in the PulseGate source and automated tests. It does not
          expose operator-only management capabilities or claim that a full
          OpenAPI specification exists.
        </p>

        <div className="docs-status-row" aria-label="Documentation status">
          <span className="status-badge">Static reference</span>
          <span className="status-badge status-badge-muted">
            Verified contracts only
          </span>
        </div>
      </header>

      <aside className="boundary-note" aria-labelledby="docs-boundary-title">
        <h2 id="docs-boundary-title">Current documentation boundary</h2>
        <ul>
          <li>Three current public-facing GET contracts are documented.</li>
          <li>Runtime management and administrative operations are excluded.</li>
          <li>No API-key issuance or account workflow is exposed here.</li>
          <li>
            Dynamic routes must be explicitly published before they can become
            part of this public reference.
          </li>
        </ul>
      </aside>

      <div className="docs-layout">
        <nav className="docs-toc" aria-label="API documentation sections">
          <h2>On this page</h2>
          <ul>
            <li>
              <a href="#authentication">Authentication</a>
            </li>
            {publicEndpoints.map((endpoint) => (
              <li key={endpoint.id}>
                <a href={`#${endpoint.id}`}>
                  {endpoint.method} {endpoint.path}
                </a>
              </li>
            ))}
            <li>
              <a href="#errors">Error model</a>
            </li>
            <li>
              <a href="#request-identity">Request identity</a>
            </li>
            <li>
              <a href="#credential-safety">Credential safety</a>
            </li>
          </ul>
        </nav>

        <div className="endpoint-stack">
          <section
            className="docs-section"
            id="authentication"
            aria-labelledby="authentication-title"
          >
            <p className="section-kicker">Authentication</p>
            <h2 id="authentication-title">Route policy determines credentials.</h2>
            <p>
              Public health routes currently require no credentials. The
              protected product route requires both the default API-key header
              and a bearer token.
            </p>

            <dl className="definition-grid">
              <div>
                <dt>API-key header</dt>
                <dd>
                  <code>x-api-key: &lt;your-api-key&gt;</code>
                </dd>
              </div>
              <div>
                <dt>JWT header</dt>
                <dd>
                  <code>
                    Authorization: Bearer &lt;your-bearer-token&gt;
                  </code>
                </dd>
              </div>
            </dl>
          </section>

          {publicEndpoints.map((endpoint) => (
            <article
              className="endpoint-card"
              id={endpoint.id}
              key={endpoint.id}
            >
              <div className="endpoint-heading">
                <div>
                  <p className="section-kicker">{endpoint.group}</p>
                  <h2>{endpoint.title}</h2>
                </div>

                <div className="endpoint-contract">
                  <span className="method-badge">{endpoint.method}</span>
                  <code className="endpoint-path">{endpoint.path}</code>
                </div>
              </div>

              <p>{endpoint.summary}</p>

              <div className="endpoint-detail-grid">
                <section aria-label={`${endpoint.title} authentication`}>
                  <h3>Authentication</h3>
                  <ul>
                    {endpoint.authentication.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                <section aria-label={`${endpoint.title} behavior`}>
                  <h3>Verified behavior</h3>
                  <ul>
                    {endpoint.behavior.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </div>

              <section className="code-example" aria-label="Request example">
                <h3>Request example</h3>
                <pre tabIndex={0}>
                  <code>{endpoint.request}</code>
                </pre>
              </section>

              {endpoint.response ? (
                <section
                  className="code-example"
                  aria-label="Response shape example"
                >
                  <h3>Response shape</h3>
                  <pre tabIndex={0}>
                    <code>{endpoint.response}</code>
                  </pre>
                </section>
              ) : (
                <p className="contract-note">
                  No invented success body is shown. The response payload is
                  owned by the downstream service contract.
                </p>
              )}

              <section aria-label={`${endpoint.title} response headers`}>
                <h3>Relevant response headers</h3>
                <ul className="header-chip-list">
                  {endpoint.headers.map((header) => (
                    <li key={header}>
                      <code>{header}</code>
                    </li>
                  ))}
                </ul>
              </section>
            </article>
          ))}

          <section
            className="docs-section"
            id="errors"
            aria-labelledby="errors-title"
          >
            <p className="section-kicker">Error model</p>
            <h2 id="errors-title">Errors use one bounded envelope.</h2>
            <p>
              Authentication, routing, quota, rate-limit, and downstream
              failures include a stable code, a human-readable message, and the
              request identifier.
            </p>

            <div className="code-example">
              <pre tabIndex={0}>
                <code>{`{
  "error": {
    "code": "API_KEY_MISSING",
    "message": "API key is required",
    "requestId": "<request-id>"
  }
}`}</code>
              </pre>
            </div>

            <div

              className="error-table-wrapper"

              role="region"

              aria-label="HTTP error reference"

              tabIndex={0}

            >
              <table className="error-table">
                <thead>
                  <tr>
                    <th scope="col">HTTP</th>
                    <th scope="col">Code</th>
                    <th scope="col">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {documentedErrors.map((error) => (
                    <tr key={`${error.status}-${error.code}`}>
                      <td>{error.status}</td>
                      <td>
                        <code>{error.code}</code>
                      </td>
                      <td>{error.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            className="docs-section"
            id="request-identity"
            aria-labelledby="request-identity-title"
          >
            <p className="section-kicker">Request identity</p>
            <h2 id="request-identity-title">
              Preserve the request ID when investigating failures.
            </h2>
            <p>
              Clients may send a non-empty <code>x-request-id</code> header.
              PulseGate preserves that value. When the header is missing, the
              Gateway generates a UUID and returns it in the response.
            </p>
          </section>

          <section
            className="docs-section"
            id="credential-safety"
            aria-labelledby="credential-safety-title"
          >
            <p className="section-kicker">Credential safety</p>
            <h2 id="credential-safety-title">
              Treat API keys and bearer tokens as secrets.
            </h2>
            <ul>
              <li>Do not place credentials in URLs or query strings.</li>
              <li>Do not commit credentials to source control.</li>
              <li>Do not expose credentials in browser-rendered HTML.</li>
              <li>Send credentials only to the intended PulseGate endpoint.</li>
              <li>
                Self-service key issuance is not connected to this Portal.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}