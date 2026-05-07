import { z } from "zod";
import { CERTIFICATIONS, ROAST_STYLES } from "./certifications";

// --- ActionResult: standardowy typ zwrotny dla Server Actions ---

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// --- Zod Schemas ---

const httpUrl = z
  .string()
  .url("Invalid URL")
  .refine((val) => /^https?:\/\//.test(val), "URL must use http or https");

export const CreateRoasterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(2000).optional().or(z.literal("")),
  country: z.string().min(2, "Country is required").max(60),
  city: z.string().min(2, "City is required").max(100),
  website: httpUrl.optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  instagram: z
    .string()
    .regex(/^@?[a-zA-Z0-9._]{1,30}$/, "Invalid Instagram handle")
    .optional()
    .or(z.literal("")),
  shopUrl: httpUrl.optional().or(z.literal("")),
  certifications: z.array(z.enum(CERTIFICATIONS)).max(10).default([]),
  origins: z.array(z.string().min(2).max(50)).max(20).default([]),
  roastStyles: z.array(z.enum(ROAST_STYLES)).max(5).default([]),
  address: z.string().max(300).optional().or(z.literal("")),
  lat: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  lng: z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
  openingHours: z.string().optional().or(z.literal("")),
});

export type CreateRoasterInput = z.infer<typeof CreateRoasterSchema>;

export const UpdateRoasterSchema = z.object({
  description: z.string().max(2000).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  lat: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  lng: z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
  website: httpUrl.optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  instagram: z
    .string()
    .regex(/^@?[a-zA-Z0-9._]{1,30}$/, "Invalid Instagram handle")
    .optional()
    .or(z.literal("")),
  shopUrl: httpUrl.optional().or(z.literal("")),
  certifications: z.array(z.enum(CERTIFICATIONS)).max(10).default([]),
  origins: z.array(z.string().min(2).max(50)).max(20).default([]),
  roastStyles: z.array(z.enum(ROAST_STYLES)).max(5).default([]),
});

export type UpdateRoasterInput = z.infer<typeof UpdateRoasterSchema>;

export const CreateReviewSchema = z.object({
  roasterId: z.string().min(1, "Roaster ID is required"),
  authorName: z.string().min(2, "Name must be at least 2 characters").max(100),
  rating: z.coerce.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  comment: z.string().max(2000).optional().or(z.literal("")),
});

export const CreateCafeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(2000).optional().or(z.literal("")),
  country: z.string().min(2, "Country is required").max(60),
  city: z.string().min(2, "City is required").max(100),
  address: z.string().min(3, "Address is required").max(200),
  lat: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  lng: z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
  website: httpUrl.optional().or(z.literal("")),
  instagram: z
    .string()
    .regex(/^@?[a-zA-Z0-9._]{1,30}$/, "Invalid Instagram handle")
    .optional()
    .or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  openingHours: z.string().optional().or(z.literal("")),
  services: z.string().optional().or(z.literal("")),
});

export type CreateCafeInput = z.infer<typeof CreateCafeSchema>;

export const UpdateCafeSchema = z.object({
  description: z.string().max(2000).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  lat: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  lng: z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
  website: httpUrl.optional().or(z.literal("")),
  instagram: z
    .string()
    .regex(/^@?[a-zA-Z0-9._]{1,30}$/, "Invalid Instagram handle")
    .optional()
    .or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  openingHours: z.string().optional().or(z.literal("")),
});

export type UpdateCafeInput = z.infer<typeof UpdateCafeSchema>;

export const CreateCafeReviewSchema = z.object({
  cafeId: z.string().min(1, "Cafe ID is required"),
  authorName: z.string().min(2, "Name must be at least 2 characters").max(100),
  rating: z.coerce.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  comment: z.string().max(2000).optional().or(z.literal("")),
});

export type CreateCafeReviewInput = z.infer<typeof CreateCafeReviewSchema>;
