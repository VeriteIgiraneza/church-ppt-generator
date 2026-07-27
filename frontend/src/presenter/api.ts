import type { Deck } from "./types/slides";
import type { PlanSummary, ServicePlan, ValidationResponse } from "./types/plan";

/**
 * Derived from the current page rather than hardcoded to localhost.
 *
 * This matters: when the phone remote loads this app over the hotspot, the
 * hostname is the laptop's LAN address, and a hardcoded "localhost" would
 * make the phone try to reach itself. Set VITE_API_BASE_URL in a .env file
 * to override.
 */
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ??
  `${window.location.protocol}//${window.location.hostname}:8000`;

const BASE = `${API_BASE_URL}/api/presenter`;

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const data = await response.json();
      detail = data.detail ?? detail;
    } catch {
      // not JSON — keep statusText
    }
    throw new Error(detail);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// ----- plans -----

export function listPlans(): Promise<PlanSummary[]> {
  return request<PlanSummary[]>("/plans");
}

export function getPlan(planId: string): Promise<ServicePlan> {
  return request<ServicePlan>(`/plans/${encodeURIComponent(planId)}`);
}

export function createPlan(body: {
  id?: string;
  label?: string;
  copy_from?: string;
}): Promise<ServicePlan> {
  return request<ServicePlan>("/plans", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function savePlan(plan: ServicePlan): Promise<ServicePlan> {
  return request<ServicePlan>(`/plans/${encodeURIComponent(plan.id)}`, {
    method: "PUT",
    body: JSON.stringify(plan),
  });
}

export function deletePlan(planId: string): Promise<void> {
  return request<void>(`/plans/${encodeURIComponent(planId)}`, {
    method: "DELETE",
  });
}

// ----- validation + compilation -----

export function validatePlan(planId: string): Promise<ValidationResponse> {
  return request<ValidationResponse>(
    `/plans/${encodeURIComponent(planId)}/validate`
  );
}

export function compilePlan(planId: string): Promise<Deck> {
  return request<Deck>(`/plans/${encodeURIComponent(planId)}/compile`, {
    method: "POST",
  });
}

/** Compile without saving — used for live preview while editing. */
export function compileDraft(plan: ServicePlan): Promise<Deck> {
  return request<Deck>("/compile", {
    method: "POST",
    body: JSON.stringify(plan),
  });
}