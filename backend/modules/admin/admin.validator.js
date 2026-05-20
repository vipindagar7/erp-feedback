// backend/modules/admin/admin.validator.js
import { z } from "zod";

export const activityQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v) : 20))
    .pipe(z.number().min(1).max(100)),
});

/**
 * validate(schema, source)
 *
 * IMPORTANT: Express does not allow reassigning req.query (it's a getter).
 * So we attach the parsed result to req.validated instead, and read from
 * req.validated in controllers — never mutate req.query/req.body/req.params.
 *
 * Usage in controller:  const { limit } = req.validated ?? req.query;
 */
export const validate = (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: result.error.flatten(),
      });
    }
    // req.query is read-only in Express — use req.validated for query params.
    // req.params and req.body are writable — update them directly so existing
    // controller code that reads req.params.formId / req.body.x still works.
    if (source === "query") {
      req.validated = { ...(req.validated ?? {}), ...result.data };
    } else {
      // Safely overwrite writable sources
      Object.assign(req[source], result.data);
      req.validated = { ...(req.validated ?? {}), ...result.data };
    }
    next();
  };