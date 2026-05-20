import * as adminService from "./admin.service.js";

const sendXlsx = (res, buffer, filename) => {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${filename}`
  );

  return res.send(buffer);
};

/* =========================
   DASHBOARD
========================= */

export const getDashboardStats = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await adminService.getDashboardStats();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardActivity = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await adminService.getActivityFeed();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================
   REPORTS
========================= */

export const exportStudentsReport = async (
  req,
  res,
  next
) => {
  try {
    const file =
      await adminService.exportStudentsBySection(
        req.query.section_id
      );

    return sendXlsx(
      res,
      file,
      "students_report.xlsx"
    );
  } catch (error) {
    next(error);
  }
};

export const exportFacultyReport = async (
  req,
  res,
  next
) => {
  try {
    const file =
      await adminService.exportFacultyReport();

    return sendXlsx(
      res,
      file,
      "faculty_report.xlsx"
    );
  } catch (error) {
    next(error);
  }
};

export const exportEnrollmentReport = async (
  req,
  res,
  next
) => {
  try {
    const file =
      await adminService.exportEnrollmentReport();

    return sendXlsx(
      res,
      file,
      "enrollment_report.xlsx"
    );
  } catch (error) {
    next(error);
  }
};