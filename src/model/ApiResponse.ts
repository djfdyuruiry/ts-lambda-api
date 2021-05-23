/**
 * Response to aAWS Lambda HTTP request event. Used for testing.
 */
export class ApiResponse {
  /**
   * HTTP response headers as a map.
   */
  public headers: object;

  /**
   * HTTP response headers with multiple value as a map.
   */
  public multiValueHeaders: {
    [header: string]: (string | number | boolean)[];
  };

  /**
   * HTTP response code (201, 400, 500 etc.)
   */
  public statusCode: number;

  /**
   * HTTP response body, potentially Base64 encoded.
   */
  public body: string;

  /**
   * Is the `body` property Base64 encoded?
   */
  public isBase64Encoded: boolean;
}
