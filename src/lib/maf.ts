import type { MafClient } from "@maf/client";

const isResult = (
  result: unknown
): result is { Ok: unknown } | { Err: string } => {
  return (
    (typeof result === "object" &&
      result &&
      (("Ok" in result && typeof result.Ok !== "undefined") ||
        ("Err" in result && typeof result.Err === "string"))) ||
    false
  );
};

export const rpc = async <T>(
  client: MafClient,
  method: string,
  ...args: unknown[]
) => {
  const result = await client.rpc(method, ...args);
  if (!isResult(result)) return result;

  if ("Err" in result) {
    throw new Error(result.Err);
  }

  return result.Ok as T;
};
