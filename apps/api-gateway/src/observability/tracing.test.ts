import {
  ROOT_CONTEXT,
  SpanKind,
  TraceFlags,
  propagation,
  trace,
  type Context,
  type Span,
} from "@opentelemetry/api";
import {
  AlwaysOnSampler,
  type ReadableSpan,
  type SpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createInMemoryTracingRuntime,
  createTracingRuntime,
} from "./tracing.js";

const REMOTE_TRACE_ID =
  "4bf92f3577b34da6a3ce929d0e0e4736";

const REMOTE_PARENT_SPAN_ID =
  "00f067aa0ba902b7";

const REMOTE_TRACEPARENT =
  `00-${REMOTE_TRACE_ID}-${REMOTE_PARENT_SPAN_ID}-01`;

describe("tracing runtime", () => {
  it("defaults to always-off recording while preserving valid propagation context", async () => {
    const runtime =
      createTracingRuntime({
        serviceName: "api-gateway",
      });

    const span =
      runtime.tracer.startSpan(
        "GET /health",
        {
          kind: SpanKind.SERVER,
        },
        ROOT_CONTEXT,
      );

    expect(span.isRecording()).toBe(false);

    const spanContext =
      span.spanContext();

    expect(spanContext.traceId).toMatch(
      /^[0-9a-f]{32}$/,
    );

    expect(spanContext.spanId).toMatch(
      /^[0-9a-f]{16}$/,
    );

    expect(spanContext.traceFlags).toBe(
      TraceFlags.NONE,
    );

    const outgoingHeaders =
      runtime.injectContext(
        runtime.contextWithSpan(
          ROOT_CONTEXT,
          span,
        ),
      );

    expect(
      outgoingHeaders.traceparent,
    ).toBe(
      `00-${spanContext.traceId}-${spanContext.spanId}-00`,
    );

    expect(
      outgoingHeaders,
    ).not.toHaveProperty("baggage");

    span.end();

    await expect(
      runtime.forceFlush(),
    ).resolves.toBeUndefined();

    await expect(
      runtime.shutdown(),
    ).resolves.toBeUndefined();

    await expect(
      runtime.shutdown(),
    ).resolves.toBeUndefined();
  });

  it("extracts W3C trace context, preserves the trace id, and never propagates baggage", async () => {
    const {
      runtime,
      exporter,
    } =
      createInMemoryTracingRuntime(
        "api-gateway",
      );

    const parentContext =
      runtime.extractContext({
        TraceParent:
          REMOTE_TRACEPARENT,
        TraceState:
          "vendor=value",
        baggage:
          "credential=must-not-propagate",
      });

    const extractedParent =
      trace.getSpanContext(
        parentContext,
      );

    expect(extractedParent).toMatchObject({
      traceId: REMOTE_TRACE_ID,
      spanId: REMOTE_PARENT_SPAN_ID,
      traceFlags: TraceFlags.SAMPLED,
      isRemote: true,
    });

    const span =
      runtime.tracer.startSpan(
        "GET /api/*",
        {
          kind: SpanKind.SERVER,
        },
        parentContext,
      );

    const spanContext =
      span.spanContext();

    expect(spanContext.traceId).toBe(
      REMOTE_TRACE_ID,
    );

    expect(spanContext.spanId).not.toBe(
      REMOTE_PARENT_SPAN_ID,
    );

    const outgoingHeaders =
      runtime.injectContext(
        runtime.contextWithSpan(
          parentContext,
          span,
        ),
      );

    expect(
      outgoingHeaders.traceparent,
    ).toBe(
      `00-${REMOTE_TRACE_ID}-${spanContext.spanId}-01`,
    );

    expect(
      outgoingHeaders.tracestate,
    ).toBe("vendor=value");

    expect(
      outgoingHeaders,
    ).not.toHaveProperty("baggage");

    span.end();
    await runtime.forceFlush();

    const finishedSpans =
      exporter.getFinishedSpans();

    expect(finishedSpans).toHaveLength(1);
    expect(finishedSpans[0]?.name).toBe(
      "GET /api/*",
    );
    expect(
      finishedSpans[0]
        ?.spanContext()
        .traceId,
    ).toBe(REMOTE_TRACE_ID);

    await runtime.shutdown();
  });

  it("treats malformed trace context as absent", async () => {
    const {
      runtime,
      exporter,
    } =
      createInMemoryTracingRuntime(
        "api-gateway",
      );

    const parentContext =
      runtime.extractContext({
        traceparent:
          "malformed-client-value",
        tracestate:
          "vendor=value",
      });

    expect(
      trace.getSpanContext(
        parentContext,
      ),
    ).toBeUndefined();

    const span =
      runtime.tracer.startSpan(
        "GET __unmatched__",
        {
          kind: SpanKind.SERVER,
        },
        parentContext,
      );

    expect(
      span.spanContext().traceId,
    ).not.toBe(REMOTE_TRACE_ID);

    span.end();
    await runtime.forceFlush();

    expect(
      exporter.getFinishedSpans(),
    ).toHaveLength(1);

    await runtime.shutdown();
  });

  it("does not inject baggage even when baggage exists in the local context", async () => {
    const runtime =
      createTracingRuntime({
        serviceName: "api-gateway",
      });

    const baggage =
      propagation.createBaggage({
        credential: {
          value:
            "must-not-propagate",
        },
      });

    const baggageContext =
      propagation.setBaggage(
        ROOT_CONTEXT,
        baggage,
      );

    const span =
      runtime.tracer.startSpan(
        "GET /health",
        {
          kind: SpanKind.SERVER,
        },
        baggageContext,
      );

    const outgoingHeaders =
      runtime.injectContext(
        runtime.contextWithSpan(
          baggageContext,
          span,
        ),
      );

    expect(
      outgoingHeaders,
    ).not.toHaveProperty("baggage");

    expect(
      outgoingHeaders,
    ).toHaveProperty("traceparent");

    span.end();
    await runtime.shutdown();
  });

  it("contains lifecycle failures and reports them through the bounded callback", async () => {
    const lifecycleCalls: string[] = [];

    const failingProcessor:
      SpanProcessor = {
        onStart(
          _span: Span,
          _parentContext: Context,
        ) {},

        onEnd(
          _span: ReadableSpan,
        ) {},

        async forceFlush() {
          throw new Error(
            "flush unavailable",
          );
        },

        async shutdown() {
          throw new Error(
            "shutdown unavailable",
          );
        },
      };

    const runtime =
      createTracingRuntime({
        serviceName: "api-gateway",
        sampler:
          new AlwaysOnSampler(),
        spanProcessors: [
          failingProcessor,
        ],
        onLifecycleError(operation) {
          lifecycleCalls.push(operation);
        },
      });

    await expect(
      runtime.forceFlush(),
    ).resolves.toBeUndefined();

    await expect(
      runtime.shutdown(),
    ).resolves.toBeUndefined();

    await expect(
      runtime.shutdown(),
    ).resolves.toBeUndefined();

    expect(lifecycleCalls).toEqual([
      "forceFlush",
      "shutdown",
    ]);
  });

  it("rejects unbounded or malformed service names", () => {
    expect(() =>
      createTracingRuntime({
        serviceName:
          "API Gateway with spaces",
      }),
    ).toThrow(
      "Tracing service name must be a bounded kebab-case identifier.",
    );

    expect(() =>
      createTracingRuntime({
        serviceName:
          "a".repeat(65),
      }),
    ).toThrow(
      "Tracing service name must be a bounded kebab-case identifier.",
    );
  });
});
