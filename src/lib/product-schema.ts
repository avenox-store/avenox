import { z } from "zod";

export const productBase = z.object({
  title: z.string().trim().min(3).max(250),
  description_bullets: z.array(z.string().trim().min(1).max(500)).max(10),
  price: z.number().nonnegative(),
  mrp: z.number().nonnegative(),
  stock: z.number().int().min(0),
  images: z.array(z.string().url()).max(10),
  category_id: z.string().uuid().nullable(),
  is_active: z.boolean(),
});
export const productCreate = productBase.partial({ is_active: true })
  .refine((d) => d.price <= d.mrp, { message: "price must be <= mrp", path: ["price"] });
export const productPatch = productBase.partial().strict();
