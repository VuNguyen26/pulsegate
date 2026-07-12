import {
  ROOT_CONTEXT,
  trace,
  type Context,
  type Span,
  type TextMapGetter,
  type TextMapSetter,
  type Tracer,
} from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import {
  AlwaysOffSampler,
  AlwaysOnSampler,
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
  type Sampler,
  type SpanProcessor,
} from "@opentelemetry/sdk-trace-base";

export type IncomingTraceHeaders = Readonly<
  Record<string, string | string[] | undefined>
>;

export type OutgoingTraceHeaders = Record<string, string>;

export type TracingLifecycleOperation =
  | "forceFlush"
  | "shutdown";

export type TracingLifecycleErrorHandler = (
  operation: TracingLifecycleOperation,
  error: unknown,
) => void;

export type TracingRuntime = {
  tracer: Tracer;
  extractContext: (
    headers: IncomingTraceHeaders,
    baseContext?: Context,
  ) => Context;
  injectContext: (
    context: Context,
    carrier?: OutgoingTraceHeaders,
  ) => OutgoingTraceHeaders;
  contextWithSpan: (
    parentContext: Context,
    span: Span,
  ) => Context;
  forceFlush: () => Promise<void>;
  shutdown: () => Promise<void>;
};

type CreateTracingRuntimeOptions = {
  serviceName: string;
  sampler?: Sampler;
  spanProcessors?: readonly SpanProcessor[];
  onLifecycleError?: TracingLifecycleErrorHandler;
};

const SERVICE_NAME_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const incomingHeaderGetter: TextMapGetter<
  IncomingTraceHeaders
> = {
  keys(carrier) {
    return Object.keys(carrier);
  },

  get(carrier, requestedKey) {
    const normalizedRequestedKey =
      requestedKey.toLowerCase();

    for (const [headerName, headerValue] of
      Object.entries(carrier)) {
      if (
        headerName.toLowerCase() ===
        normalizedRequestedKey
      ) {
        return headerValue;
      }
    }

    return undefined;
  },
};

const outgoingHeaderSetter: TextMapSetter<
  OutgoingTraceHeaders
> = {
  set(carrier, key, value) {
    carrier[key.toLowerCase()] = value;
  },
};

function assertServiceName(serviceName: string): void {
  if (
    serviceName.length === 0 ||
    serviceName.length > 64 ||
    !SERVICE_NAME_PATTERN.test(serviceName)
  ) {
    throw new Error(
      "Tracing service name must be a bounded kebab-case identifier.",
    );
  }
}

export function createTracingRuntime(
  options: CreateTracingRuntimeOptions,
): TracingRuntime {
  assertServiceName(options.serviceName);

  const provider =
    new BasicTracerProvider({
      sampler:
        options.sampler ?? new AlwaysOffSampler(),
      spanProcessors: [
        ...(options.spanProcessors ?? []),
      ],
    });

  const tracer = provider.getTracer(
    `pulsegate.${options.serviceName}`,
    "1.0.0",
  );

  const propagator =
    new W3CTraceContextPropagator();

  let shutdownPromise: Promise<void> | undefined;

  const runLifecycleOperation = async (
    operation: TracingLifecycleOperation,
    action: () => Promise<void>,
  ): Promise<void> => {
    try {
      await action();
    } catch (error) {
      options.onLifecycleError?.(
        operation,
        error,
      );
    }
  };

  return {
    tracer,

    extractContext(
      headers,
      baseContext = ROOT_CONTEXT,
    ) {
      return propagator.extract(
        baseContext,
        headers,
        incomingHeaderGetter,
      );
    },

    injectContext(
      context,
      carrier = {},
    ) {
      propagator.inject(
        context,
        carrier,
        outgoingHeaderSetter,
      );

      return carrier;
    },

    contextWithSpan(parentContext, span) {
      return trace.setSpan(
        parentContext,
        span,
      );
    },

    async forceFlush() {
      if (shutdownPromise) {
        await shutdownPromise;
        return;
      }

      await runLifecycleOperation(
        "forceFlush",
        () => provider.forceFlush(),
      );
    },

    shutdown() {
      shutdownPromise ??=
        runLifecycleOperation(
          "shutdown",
          () => provider.shutdown(),
        );

      return shutdownPromise;
    },
  };
}

export function createInMemoryTracingRuntime(
  serviceName: string,
): {
  runtime: TracingRuntime;
  exporter: InMemorySpanExporter;
} {
  const exporter =
    new InMemorySpanExporter();

  const runtime =
    createTracingRuntime({
      serviceName,
      sampler: new AlwaysOnSampler(),
      spanProcessors: [
        new SimpleSpanProcessor(exporter),
      ],
    });

  return {
    runtime,
    exporter,
  };
}
