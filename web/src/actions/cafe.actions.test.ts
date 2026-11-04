import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    cafe: { create: vi.fn(), update: vi.fn() },
    userProfile: { update: vi.fn() },
  },
}));
vi.mock("@/lib/slug", () => ({ generateUniqueCafeSlug: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendNewRegistrationNotification: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn(),
  requireCafeOwner: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { generateUniqueCafeSlug } from "@/lib/slug";
import { requireAdmin } from "@/lib/auth";
import { createCafe, verifyCafe, rejectCafe } from "@/actions/cafe.actions";

const mockCreate = db.cafe.create as unknown as ReturnType<typeof vi.fn>;
const mockUpdate = db.cafe.update as unknown as ReturnType<typeof vi.fn>;
const mockUserUpdate = db.userProfile.update as unknown as ReturnType<typeof vi.fn>;
const mockSlug = vi.mocked(generateUniqueCafeSlug);
const mockRequireAdmin = vi.mocked(requireAdmin);
const mockRevalidatePath = vi.mocked(revalidatePath);
const mockAuth = vi.mocked(auth);

type AuthResult = Awaited<ReturnType<typeof auth>>;

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.set(k, v);
  return fd;
}

const validData = {
  name: "Brew Lab",
  city: "Warsaw",
  country: "Poland",
  description: "",
  address: "Main Street 42",
  lat: "",
  lng: "",
  website: "",
  instagram: "",
  phone: "",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSlug.mockResolvedValue("brew-lab");
});

describe("createCafe", () => {
  it("returns fieldError when name is too short", async () => {
    const fd = makeFormData({ ...validData, name: "X" });
    const result = await createCafe(fd);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors?.name).toBeDefined();
  });

  it("returns error when isOwner is true but user is not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null } as unknown as AuthResult);
    const fd = makeFormData({ ...validData, isOwner: "true" });
    const result = await createCafe(fd);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("signed in");
  });

  it("creates cafe as owner, updates userProfile, revalidates /cafes", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" } as unknown as AuthResult);
    mockCreate.mockResolvedValue({ id: "cafe_1", slug: "brew-lab" });
    mockUserUpdate.mockResolvedValue({});
    mockUpdate.mockResolvedValue({});

    const fd = makeFormData({ ...validData, isOwner: "true" });
    const result = await createCafe(fd);

    expect(result.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: "user_123" },
      data: { role: "CAFE" },
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "cafe_1" },
      data: { ownerId: "user_123" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cafes");
  });

  it("creates PENDING cafe as suggestion, no owner, revalidates /admin/cafes", async () => {
    mockAuth.mockResolvedValue({ userId: null } as unknown as AuthResult);
    mockCreate.mockResolvedValue({ slug: "brew-lab" });

    const fd = makeFormData({ ...validData, isOwner: "false" });
    const result = await createCafe(fd);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ slug: "brew-lab" });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING",
          name: "Brew Lab",
        }),
      })
    );
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/cafes");
  });

  it("stores parsed openingHours JSON", async () => {
    mockAuth.mockResolvedValue({ userId: null } as unknown as AuthResult);
    mockCreate.mockResolvedValue({ slug: "test" });
    const hours = JSON.stringify({ mon: { open: "08:00", close: "18:00" }, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null });
    const fd = makeFormData({ ...validData, openingHours: hours });
    await createCafe(fd);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          openingHours: { mon: { open: "08:00", close: "18:00" }, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null },
        }),
      })
    );
  });

  it("stores parsed services from comma-separated string", async () => {
    mockAuth.mockResolvedValue({ userId: null } as unknown as AuthResult);
    mockCreate.mockResolvedValue({ slug: "test" });

    const fd = makeFormData({ ...validData, services: "Wi-Fi, Workspace, Dog friendly" });
    const result = await createCafe(fd);

    expect(result.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          services: ["Wi-Fi", "Workspace", "Dog friendly"],
        }),
      })
    );
  });
});

describe("verifyCafe", () => {
  it("returns error when requireAdmin throws", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("Forbidden"));
    const result = await verifyCafe("cafe_1");
    expect(result.success).toBe(false);
  });

  it("sets VERIFIED, revalidates cafes + map", async () => {
    mockRequireAdmin.mockResolvedValue("admin_1");
    mockUpdate.mockResolvedValue({ slug: "brew-lab" });

    const result = await verifyCafe("cafe_1");

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "cafe_1" },
      data: { status: "VERIFIED", verifiedAt: expect.any(Date) },
      select: { slug: true },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cafes");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cafes/brew-lab");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/map");
  });
});

describe("rejectCafe", () => {
  it("sets REJECTED with reason", async () => {
    mockRequireAdmin.mockResolvedValue("admin_1");
    mockUpdate.mockResolvedValue({ slug: "brew-lab" });

    const result = await rejectCafe("cafe_1", "Incomplete information");

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "cafe_1" },
      data: {
        status: "REJECTED",
        rejectedAt: expect.any(Date),
        rejectedReason: "Incomplete information",
      },
      select: { slug: true },
    });
  });
});
