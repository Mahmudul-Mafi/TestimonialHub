import { z } from "zod";

/**
 * Public testimonial submission schema.
 *
 * Validated server-side at the API boundary. The schema is the source of
 * truth for what the public submission endpoint accepts. The client form
 * performs UI-level validation for friendlier errors but never replaces
 * this check.
 *
 * `rating` is an integer in [1, 5]. Non-integer, missing, zero, negative,
 * and > 5 values are rejected by Zod before any DB write.
 */
export const submissionSchema = z.object({
  submitterName: z.string().min(1).max(120),
  submitterEmail: z.string().email().max(254),
  company: z.string().max(120).nullable().optional(),
  role: z.string().max(120).nullable().optional(),
  body: z.string().min(10).max(2000),
  rating: z.number().int().min(1).max(5),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
