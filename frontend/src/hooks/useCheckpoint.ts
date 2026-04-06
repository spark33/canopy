"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function useCheckpoint() {
  const [resolving, setResolving] = useState<string | null>(null);

  async function resolve(checkpointId: string, resolution: string, userInput?: string) {
    setResolving(checkpointId);
    try {
      await api.resolveCheckpoint(checkpointId, { resolution, user_input: userInput });
    } finally {
      setResolving(null);
    }
  }

  return { resolve, resolving };
}
