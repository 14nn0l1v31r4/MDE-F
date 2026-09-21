import { beforeEach, describe, expect, it } from "vitest";
import { clearAccessToken, readAccessToken, writeAccessToken } from "../auth/storage";

describe("auth storage", () => {
  beforeEach(() => sessionStorage.clear());

  it("stores and reads only the access token", () => {
    writeAccessToken("jwt-token");
    expect(readAccessToken()).toBe("jwt-token");
  });

  it("clears the access token on logout", () => {
    writeAccessToken("jwt-token");
    clearAccessToken();
    expect(readAccessToken()).toBeNull();
  });

  it("treats a blank token as missing", () => {
    sessionStorage.setItem("mde.auth.v1", "   ");
    expect(readAccessToken()).toBeNull();
  });
});
