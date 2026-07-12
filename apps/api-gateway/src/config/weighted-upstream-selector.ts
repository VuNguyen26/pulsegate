import type { DownstreamRouteConfig } from "./downstream-routes.js";

export type WeightedRandomSource = () => number;

export function selectWeightedDownstreamUrl(
  route: DownstreamRouteConfig,
  randomSource: WeightedRandomSource = Math.random,
): string {
  const weightedUpstreams = route.weightedUpstreams;

  if (weightedUpstreams === undefined) {
    return route.downstreamUrl;
  }

  if (weightedUpstreams.length === 0) {
    throw new Error("Weighted upstream selection requires at least one upstream");
  }

  let totalWeight = 0;

  for (const upstream of weightedUpstreams) {
    if (!Number.isInteger(upstream.weight) || upstream.weight < 1) {
      throw new Error(
        "Weighted upstream selection requires positive integer weights",
      );
    }

    totalWeight += upstream.weight;
  }

  if (!Number.isSafeInteger(totalWeight) || totalWeight <= 0) {
    throw new Error("Weighted upstream total weight is invalid");
  }

  const randomValue = randomSource();

  if (
    !Number.isFinite(randomValue) ||
    randomValue < 0 ||
    randomValue >= 1
  ) {
    throw new Error(
      "Weighted upstream random source must return a number from 0 inclusive to 1 exclusive",
    );
  }

  let weightedPosition = randomValue * totalWeight;

  for (const upstream of weightedUpstreams) {
    weightedPosition -= upstream.weight;

    if (weightedPosition < 0) {
      return upstream.downstreamUrl;
    }
  }

  throw new Error("Weighted upstream selection did not resolve a target");
}
