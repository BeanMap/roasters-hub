import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    roaster: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/slug", () => ({
  generateUniqueSlug: vi.fn(),
}));


vi.mock("@/lib/email", () => ({
  sendNewRegistrationNotification: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";
import { sendNewRegistrationNotification } from "@/lib/email";
import { createRoasterRegistration } from "@/actions/roaster.actions";

const mockRevalidatePath = vi.mocked(revalidatePath);
const mockCreate = db.roaster.create as unknown as ReturnType<typeof vi.fn>;
const mockGenerateSlug = vi.mocked(generateUniqueSlug);
const mockSendNotification = vi.mocked(sendNewRegistrationNotification);
const mockAuth = vi.mocked(auth);

type AuthResult = Awaited<ReturnType<typeof auth>>;

function makeFormData(data: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      for (const v of value) fd.append(key, v);
    } else {
      fd.set(key, value);
    }
  }
  return fd;
}

const validData = {
  name: "Rocket Roasters",
  city: "Warsaw",
  country: "Poland",
  description: "",
  website: "",
  email: "",
  instagram: "",
  shopUrl: "",
};

describe("createRoasterRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateSlug.mockResolvedValue("rocket-roasters-warsaw");
    mockCreate.mockResolvedValue({
      slug: "rocket-roasters-warsaw",
    });
    mockAuth.mockResolvedValue({ userId: null } as unknown as AuthResult);
  });

  it("returns validation error when name is missing", async () => {
    const fd = makeFormData({ city: "Warsaw", country: "Poland" });
    const result = await createRoasterRegistration(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Validation failed");
      expect(result.fieldErrors).toHaveProperty("name");
    }
  });

  it("returns validation error when name is too short", async () => {
    const fd = makeFormData({ name: "A", city: "Warsaw", country: "Poland" });
    const result = await createRoasterRegistration(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toHaveProperty("name");
    }
  });

  it("returns validation error when city is missing", async () => {
    const fd = makeFormData({ name: "Rocket Roasters", country: "Poland" });
    const result = await createRoasterRegistration(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toHaveProperty("city");
    }
  });

  it("returns validation error when country is missing", async () => {
    const fd = makeFormData({ name: "Rocket Roasters", city: "Warsaw" });
    const result = await createRoasterRegistration(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toHaveProperty("country");
    }
  });

  it("returns error when isOwner is true but user is not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null } as unknown as AuthResult);
    const fd = makeFormData({ ...validData, isOwner: "true" });
    const result = await createRoasterRegistration(fd);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("signed in");
  });

  it("returns success with slug on valid data (suggestion)", async () => {
    const fd = makeFormData({ ...validData, isOwner: "false" });
    const result = await createRoasterRegistration(fd);

    expect(result).toEqual({
      success: true,
      data: { slug: "rocket-roasters-warsaw" },
    });
  });

  it("returns success with slug on valid data (owner)", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" } as unknown as AuthResult);
    const fd = makeFormData({ ...validData, isOwner: "true" });
    const result = await createRoasterRegistration(fd);

    expect(result).toEqual({
      success: true,
      data: { slug: "rocket-roasters-warsaw" },
    });
  });

  it("calls generateUniqueSlug with name and city", async () => {
    const fd = makeFormData(validData);
    await createRoasterRegistration(fd);

    expect(mockGenerateSlug).toHaveBeenCalledWith(
      "Rocket Roasters",
      "Warsaw",
    );
  });

  it("calls db.roaster.create with correct fields", async () => {
    const fd = makeFormData(validData);
    await createRoasterRegistration(fd);

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Rocket Roasters",
        slug: "rocket-roasters-warsaw",
        city: "Warszawa",
        country: "Poland",
        countryCode: "PL",
      }),
    });
  });

  it("creates as owner with ownerId set", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" } as unknown as AuthResult);
    mockCreate.mockResolvedValue({ slug: "rocket-roasters-warsaw" });

    const fd = makeFormData({ ...validData, isOwner: "true" });
    await createRoasterRegistration(fd);

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Rocket Roasters",
        ownerId: "user_1",
      }),
    });
  });

  it("calls revalidatePath for /admin/pending", async () => {
    const fd = makeFormData(validData);
    await createRoasterRegistration(fd);

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/pending");
  });

  it("calls sendNewRegistrationNotification with name, city, country", async () => {
    const fd = makeFormData(validData);
    await createRoasterRegistration(fd);

    expect(mockSendNotification).toHaveBeenCalledWith({
      name: "Rocket Roasters",
      city: "Warsaw",
      country: "Poland",
    });
  });

  it("does not call db.roaster.create when validation fails", async () => {
    const fd = makeFormData({ city: "Warsaw", country: "Poland" });
    await createRoasterRegistration(fd);

    expect(mockCreate).not.toHaveBeenCalled();
  });
});
