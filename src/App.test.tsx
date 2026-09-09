import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "./api/client";
import { AuthProvider } from "./auth/AuthContext";
import { writeAccessToken } from "./auth/storage";
import App from "./App";

vi.mock("./api/client", () => ({
  getCurrentUser: vi.fn(),
  listDatasets: vi.fn(),
  uploadDataset: vi.fn(),
  previewDataset: vi.fn(),
  runStatistics: vi.fn(),
  runKMeans: vi.fn(),
  runDBSCAN: vi.fn(),
  runIsolationForest: vi.fn(),
  runAssociationRules: vi.fn(),
}));

const currentUser = {
  id: "1",
  email: "user@example.com",
  full_name: "User",
  role: "analyst",
  is_active: true,
  created_at: null,
};

function renderApp() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
}

describe("App authentication guard", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.mocked(api.listDatasets).mockResolvedValue([]);
  });

  it("shows login for anonymous users", async () => {
    renderApp();
    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.queryByText(/Sistema de Minera/)).not.toBeInTheDocument();
  });

  it("renders the platform without exposing the user role", async () => {
    writeAccessToken("jwt");
    vi.mocked(api.getCurrentUser).mockResolvedValue(currentUser);

    renderApp();

    expect(await screen.findByText(/Sistema de Minera/)).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.queryByText("analyst")).not.toBeInTheDocument();
  });
});
