import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "@/contexts/i18n";
import Submit from "@/pages/submit";
import { Toaster } from "@/components/ui/toaster";

const requestUploadMock = vi.fn();
const createComplaintMock = vi.fn();
const addEvidenceMock = vi.fn();

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({
    isSignedIn: true,
    isLoaded: true,
    user: { id: 1, role: "citizen" },
    role: "citizen",
    isOfficer: false,
    isAdmin: false,
    isSuperAdmin: false,
    departmentId: null,
    districtId: null,
  }),
}));

vi.mock("@workspace/api-client-react", () => ({
  useListDepartments: () => ({ data: [{ id: 1, name: "Revenue Department", nameTa: null }] }),
  useListComplaintCategories: () => ({ data: [{ id: 1, name: "Bribery", nameTa: null }] }),
  useListDistricts: () => ({ data: [{ id: 1, name: "Chennai", nameTa: null }] }),
  useListTaluks: () => ({ data: [] }),
  getListTaluksQueryKey: (params: unknown) => ["taluks", params],
  useRequestUploadUrl: () => ({ mutateAsync: requestUploadMock }),
  useCreateComplaint: () => ({ mutateAsync: createComplaintMock, isPending: false }),
  useAddEvidence: () => ({ mutateAsync: addEvidenceMock }),
  useAiClassifyComplaint: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ suggestions: [] }),
  }),
}));

function makeFile(name: string) {
  return new File(["test-file-content"], name, { type: "image/png" });
}

function getFileInput(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]');
  if (!input) throw new Error("file input not found");
  return input as HTMLInputElement;
}

async function selectOption(user: ReturnType<typeof userEvent.setup>, triggerIndex: number, optionText: string) {
  const triggers = screen.getAllByRole("combobox");
  await user.click(triggers[triggerIndex]);
  const option = await screen.findByRole("option", { name: optionText });
  await user.click(option);
}

async function goToEvidenceStep(user: ReturnType<typeof userEvent.setup>) {
  // Step 1: department (required)
  await selectOption(user, 0, "Revenue Department");
  await user.click(screen.getByRole("button", { name: /next/i }));
  // Step 2: district (required)
  await selectOption(user, 0, "Chennai");
  await user.click(screen.getByRole("button", { name: /next/i }));
  // Step 3: all optional
  await user.click(screen.getByRole("button", { name: /next/i }));
  // Step 4: title + description required for Next
  await user.type(screen.getByPlaceholderText("Report Title"), "Evidence retry automated test");
  await user.type(
    screen.getByPlaceholderText("Detailed Description"),
    "This is an automated regression test of the evidence upload retry flow behavior.",
  );
}

describe("evidence upload retry flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createComplaintMock.mockResolvedValue({ id: 42, complaintNumber: "CFT-TEST-0001" });
    addEvidenceMock.mockResolvedValue({ id: 1 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    );
  });

  it("shows error + Retry on failed upload, gates submit, recovers via retry, removal re-enables, and submits only successful files", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Submit />
      </I18nProvider>,
    );

    await goToEvidenceStep(user);

    // --- 1. Simulate upload failure (upload-URL endpoint fails) ---
    requestUploadMock.mockRejectedValueOnce(new Error("boom"));
    await user.upload(getFileInput(), makeFile("evidence-a.png"));

    const failedRow = (await screen.findByText("evidence-a.png")).closest("li")!;
    await within(failedRow).findByText("Upload failed");
    const retryButton = within(failedRow).getByRole("button", { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    // --- 2. Submit is gated while a failed upload exists ---
    await user.click(screen.getByRole("button", { name: /next/i }));
    const submitButton = screen.getByRole("button", { name: /submit report securely/i });
    expect(submitButton).toBeDisabled();
    expect(
      screen.getByText("Fix or remove failed uploads before submitting."),
    ).toBeInTheDocument();

    // --- 3. Retry succeeds: error clears, submission re-enabled ---
    await user.click(screen.getByRole("button", { name: /back/i }));
    requestUploadMock.mockResolvedValue({
      uploadURL: "https://storage.example/upload-a",
      objectPath: "/objects/uploads/a",
    });
    const rowA = screen.getByText("evidence-a.png").closest("li")!;
    await user.click(within(rowA).getByRole("button", { name: /retry/i }));
    await waitFor(() => {
      expect(screen.queryByText("Upload failed")).not.toBeInTheDocument();
    });
    // done state shows the file size instead of a Retry button
    const rowADone = screen.getByText("evidence-a.png").closest("li")!;
    expect(within(rowADone).queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
    expect(within(rowADone).getByText(/KB$/)).toBeInTheDocument();

    // --- 4. A second failed upload gates submit again; removing it re-enables ---
    requestUploadMock.mockRejectedValueOnce(new Error("boom again"));
    await user.upload(getFileInput(), makeFile("evidence-b.png"));
    const rowB = (await screen.findByText("evidence-b.png")).closest("li")!;
    await within(rowB).findByText("Upload failed");

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByRole("button", { name: /submit report securely/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /back/i }));
    const rowBAgain = screen.getByText("evidence-b.png").closest("li")!;
    // The remove button is the last button in the row (X icon)
    const rowBButtons = within(rowBAgain).getAllByRole("button");
    await user.click(rowBButtons[rowBButtons.length - 1]);
    expect(screen.queryByText("evidence-b.png")).not.toBeInTheDocument();

    // --- 5. Submit enabled again; only the successful file is attached ---
    await user.click(screen.getByRole("button", { name: /next/i }));
    const finalSubmit = screen.getByRole("button", { name: /submit report securely/i });
    expect(finalSubmit).toBeEnabled();
    expect(
      screen.queryByText("Fix or remove failed uploads before submitting."),
    ).not.toBeInTheDocument();

    await user.click(finalSubmit);

    await screen.findByText("Report Submitted");
    expect(createComplaintMock).toHaveBeenCalledTimes(1);
    expect(addEvidenceMock).toHaveBeenCalledTimes(1);
    expect(addEvidenceMock).toHaveBeenCalledWith({
      complaintId: 42,
      data: expect.objectContaining({
        fileUrl: "/objects/uploads/a",
        description: "evidence-a.png",
      }),
    });
  });
});

describe("evidence attach rejection (server-side 422 validation)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createComplaintMock.mockResolvedValue({ id: 43, complaintNumber: "CFT-TEST-0002" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    );
  });

  it("shows the destructive evidence-failure toast when the API rejects an attach with 422", async () => {
    // The API validates that the referenced object actually exists in storage
    // and rejects fake/half-uploaded references with 422. The portal must
    // surface this to the user instead of silently dropping the evidence.
    requestUploadMock.mockResolvedValue({
      uploadURL: "https://storage.example/upload-c",
      objectPath: "/objects/uploads/c",
    });
    addEvidenceMock.mockRejectedValue({
      status: 422,
      data: {
        error:
          "Evidence file not found in storage. Please re-upload the file and try again.",
      },
    });

    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Submit />
        <Toaster />
      </I18nProvider>,
    );

    await goToEvidenceStep(user);

    // Upload succeeds client-side (signed URL + PUT are fine)...
    await user.upload(getFileInput(), makeFile("evidence-c.png"));
    const rowC = (await screen.findByText("evidence-c.png")).closest("li")!;
    await within(rowC).findByText(/KB$/);

    // ...so submit is not gated.
    await user.click(screen.getByRole("button", { name: /next/i }));
    const submitButton = screen.getByRole("button", { name: /submit report securely/i });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    // Complaint itself is filed...
    await screen.findByText("Report Submitted");
    expect(addEvidenceMock).toHaveBeenCalledWith({
      complaintId: 43,
      data: expect.objectContaining({ fileUrl: "/objects/uploads/c" }),
    });

    // ...but the user is clearly told the evidence attach failed (422).
    const toastTitle = await screen.findByText(
      "Some files could not be attached. Your complaint was filed, but please re-submit evidence.",
    );
    // Rendered as a destructive (error) toast, not a neutral notice.
    const toastRoot = toastTitle.closest('[role="status"], li');
    expect(toastRoot).not.toBeNull();
    expect(toastRoot!.className).toMatch(/destructive/);
  });
});
