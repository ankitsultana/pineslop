export interface PinotQueryRequest {
  sql: string;
  queryOptions?: Record<string, string>;
}

export interface PinotDataSchema {
  columnDataTypes: string[];
  columnNames: string[];
}

export interface PinotResultTable {
  dataSchema: PinotDataSchema;
  rows: unknown[][];
}

export interface PinotQueryResponse {
  exceptions: Array<{
    errorCode?: number;
    message?: string;
  }>;
  minConsumingFreshnessTimeMs: number;
  numConsumingSegmentsQueried: number;
  numDocsScanned: number;
  numEntriesScannedInFilter: number;
  numEntriesScannedPostFilter: number;
  numGroupsLimitReached: boolean;
  numSegmentsMatched: number;
  numSegmentsProcessed: number;
  numSegmentsQueried: number;
  numServersQueried: number;
  numServersResponded: number;
  resultTable: PinotResultTable;
  segmentStatistics: unknown[];
  timeUsedMs: number;
  totalDocs: number;
  traceInfo: Record<string, unknown>;
}

export class PinotQueryError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public exceptions?: PinotQueryResponse["exceptions"]
  ) {
    super(message);
    this.name = "PinotQueryError";
  }
}

export interface PinotQueryResponseWrapper {
  response: PinotQueryResponse | null,
  error: PinotQueryError | null,
}

export interface TimeSeriesMetric {
  [key: string]: string;
}

export type TimeSeriesValue = [number, string];

export interface TimeSeriesResult {
  metric: TimeSeriesMetric;
  values: TimeSeriesValue[];
}

export interface TimeSeriesData {
  resultType: "matrix" | "vector" | "scalar" | "string";
  result: TimeSeriesResult[];
}

export interface TimeSeriesQueryResponse {
  status: "success" | "error";
  data?: TimeSeriesData;
  errorType?: string;
  error?: string;
}

export interface TimeSeriesQueryResponseWrapper {
  response: TimeSeriesQueryResponse | null;
  error: PinotQueryError | null;
}

/**
 * Executes a SQL query against Apache Pinot
 * @param sql The SQL query to execute
 * @returns Promise with the query response
 * @throws PinotQueryError if the query fails
 */
export async function executePinotQuery(
  sql: string,
  timeoutMs?: number,
): Promise<PinotQueryResponseWrapper> {
  const requestBody: PinotQueryRequest = { sql };

  if (typeof timeoutMs === "number" && Number.isFinite(timeoutMs) && timeoutMs > 0) {
    requestBody.queryOptions = {
      ...(requestBody.queryOptions ?? {}),
      timeoutMs: String(Math.floor(timeoutMs)),
    };
  }

  try {
    const response = await fetch("http://127.0.0.1:9000/sql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Handle HTTP error status codes (400, 500, etc.)
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      // Try to parse error response body if available
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If JSON parsing fails, use the default error message
      }

      return {
        error: new PinotQueryError(errorMessage, response.status),
        response: null,
      };
    }

    const data: PinotQueryResponse = await response.json();

    // Check for exceptions in the response
    if (data.exceptions && data.exceptions.length > 0) {
      const exceptionMessages = data.exceptions
        .map((ex) => ex.message || "Unknown error")
        .join("; ");
      return {
        error: new PinotQueryError(
          `Pinot query failed: ${exceptionMessages}`,
          undefined,
          data.exceptions
        ),
        response: null,
      };
    }

    return {
      response: data,
      error: null,
    };
  } catch (error) {
    // Return PinotQueryError in wrapper
    if (error instanceof PinotQueryError) {
      return {
        error: error,
        response: null,
      };
    }

    // Wrap other errors (network errors, etc.)
    if (error instanceof Error) {
      return {
        error: new PinotQueryError(
          `Failed to execute Pinot query: ${error.message}`
        ),
        response: null,
      };
    }

    return {
      error: new PinotQueryError("Failed to execute Pinot query: Unknown error"),
      response: null,
    };
  }
}

/**
 * Executes a time series query against Apache Pinot
 * @param query The PromQL query string
 * @param start Start time in epoch seconds
 * @param end End time in epoch seconds
 * @param step Step size in seconds
 * @param timeout Timeout in format "123ms"
 * @returns Promise with the time series query response
 */
export async function executeTimeSeriesQuery(
  query: string,
  start: number,
  end: number,
  step: number,
  timeout?: string,
): Promise<TimeSeriesQueryResponseWrapper> {
  try {
    const url = new URL("http://127.0.0.1:9000/timeseries/api/v1/query_range");
    url.searchParams.set("query", query);
    url.searchParams.set("start", String(Math.floor(start)));
    url.searchParams.set("end", String(Math.floor(end)));
    url.searchParams.set("step", String(Math.floor(step)));
    
    if (timeout) {
      url.searchParams.set("timeout", timeout);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Handle HTTP error status codes (400, 500, etc.)
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      // Try to parse error response body if available
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If JSON parsing fails, use the default error message
      }

      return {
        error: new PinotQueryError(errorMessage, response.status),
        response: null,
      };
    }

    const data: TimeSeriesQueryResponse = await response.json();

    // Check for error status in the response
    if (data.status === "error") {
      const errorMessage = data.error || data.errorType || "Unknown error";
      return {
        error: new PinotQueryError(
          `Time series query failed: ${errorMessage}`
        ),
        response: null,
      };
    }

    return {
      response: data,
      error: null,
    };
  } catch (error) {
    // Return PinotQueryError in wrapper
    if (error instanceof PinotQueryError) {
      return {
        error: error,
        response: null,
      };
    }

    // Wrap other errors (network errors, etc.)
    if (error instanceof Error) {
      return {
        error: new PinotQueryError(
          `Failed to execute time series query: ${error.message}`
        ),
        response: null,
      };
    }

    return {
      error: new PinotQueryError("Failed to execute time series query: Unknown error"),
      response: null,
    };
  }
}
