import "server-only";
import type { NimcResult } from "@/lib/types";

export async function verifyNinWithNimc(nin: string): Promise<NimcResult> {
  const apiUrl = process.env.NIMC_API_URL;
  const apiKey = process.env.NIMC_API_KEY;

  if (!apiUrl || !apiKey) {
    return mockNimcResult(nin);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ nin }),
      signal: controller.signal
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        status: "not_verified",
        reasonCode: String(payload.reasonCode ?? payload.code ?? response.status),
        rawPayload: payload
      };
    }

    if (payload.verified === true || payload.status === "verified") {
      return {
        status: "verified",
        identity: {
          fullName: String(payload.fullName ?? payload.name ?? ""),
          dateOfBirth: String(payload.dateOfBirth ?? payload.dob ?? ""),
          gender: String(payload.gender ?? "")
        },
        rawPayload: payload
      };
    }

    return {
      status: "not_verified",
      reasonCode: String(payload.reasonCode ?? "NO_MATCH"),
      rawPayload: payload
    };
  } catch {
    return { status: "service_unavailable", reasonCode: "NIMC_UNAVAILABLE" };
  } finally {
    clearTimeout(timeout);
  }
}

function mockNimcResult(nin: string): NimcResult {
  if (nin.endsWith("0000")) {
    return { status: "service_unavailable", reasonCode: "MOCK_TIMEOUT" };
  }

  if (Number(nin.at(-1)) % 2 === 0) {
    return {
      status: "verified",
      identity: {
        fullName: "Mock Beneficiary",
        dateOfBirth: "1988-04-12",
        gender: "Female"
      },
      rawPayload: { provider: "mock", nin, verified: true }
    };
  }

  return {
    status: "not_verified",
    reasonCode: "MOCK_NO_MATCH",
    rawPayload: { provider: "mock", nin, verified: false }
  };
}
