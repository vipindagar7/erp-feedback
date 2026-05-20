import { Router } from "express";
import multer from "multer";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import {
  validate, sectionListSchema, createSectionSchema, updateSectionSchema,
  assignSubjectSchema, updateSectionSubjectSchema, validatePromote, validateMultiPromote, validateStatus, validateCounts,
} from "../shared/shared.validator.js";
import * as c from "./section.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const ADMIN = ["ADMIN", "SUPER_ADMIN"];

// Templates
router.get("/template", authenticate, authorize(...ADMIN), c.downloadTemplate);
router.get("/subject-template", authenticate, authorize(...ADMIN), c.downloadSubjectTemplate);

// Bulk uploads
router.post("/bulk-upload", authenticate, authorize(...ADMIN), upload.single("file"), c.bulkUpload);
router.post("/bulk-assign-subjects", authenticate, authorize(...ADMIN), upload.single("file"), c.bulkAssignSubjects);

// CRUD
router.get("/", authenticate, validate(sectionListSchema, "query"), c.getAll);
router.get("/:id", authenticate, c.getById);
router.post("/", authenticate, authorize(...ADMIN), validate(createSectionSchema), c.create);
router.patch("/:id", authenticate, authorize(...ADMIN), validate(updateSectionSchema), c.update);
router.delete("/:id", authenticate, authorize(...ADMIN), c.remove);

// Subject assignment
router.post("/:id/subjects", authenticate, authorize(...ADMIN), validate(assignSubjectSchema), c.assignSubject);
router.patch("/:id/subjects/:subject_id", authenticate, authorize(...ADMIN), validate(updateSectionSubjectSchema), c.updateSubjectAssignment);
router.delete("/:id/subjects/:subject_id", authenticate, authorize(...ADMIN), c.removeSubject);

// Promote single section
router.post(
  "/:id/promote",
  authenticate,
  authorize(...ADMIN),
  // validate(validatePromote),
  c.promoteSectionController
);

// Promote multiple sections
router.post(
  "/promote-multiple",
  authenticate,
  authorize(...ADMIN),
  // validate(validateMultiPromote),
  c.promoteMultipleSectionsController
);

// Set status for all students
router.patch(
  "/:id/bulk-status",
  authenticate,
  authorize(...ADMIN),
  // validate(validateStatus),
  c.setSectionStatusController
);

// Get student counts
router.post(
  "/student-counts",
  authenticate,
  authorize(...ADMIN),
  // validate(validateCounts),
  c.getSectionStudentCountsController
);



export default router;




