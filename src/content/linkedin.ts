import { JobInfo } from "../types";

function extractJobInfo(): JobInfo | null {
  const companySelectors = [
    ".job-details-jobs-unified-top-card__company-name a",
    ".job-details-jobs-unified-top-card__company-name",
    ".jobs-unified-top-card__company-name a",
    ".jobs-unified-top-card__company-name",
    ".artdeco-entity-lockup__subtitle a",
    ".artdeco-entity-lockup__subtitle",
    '[data-tracking-control-name="public_jobs_topcard-org-name"]',
  ];

  const titleSelectors = [
    ".job-details-jobs-unified-top-card__job-title h1",
    ".job-details-jobs-unified-top-card__job-title",
    ".jobs-unified-top-card__job-title",
    ".top-card-layout__title",
    "h1.t-24",
    "h1",
  ];

  const salarySelectors = [
    ".job-details-jobs-unified-top-card__job-insight--highlight span",
    ".salary-main-rail__data-body",
    ".compensation__salary",
    "#SALARY .mt2",
  ];

  let company: string | null = null;
  let jobTitle: string | null = null;
  let salary: string | null = null;

  for (const selector of companySelectors) {
    const el =
      document.querySelector(selector);
    const text =
      el?.textContent?.trim();
    if (text) {
      company = text;
      break;
    }
  }

  for (const selector of titleSelectors) {
    const el =
      document.querySelector(selector);
    const text =
      el?.textContent?.trim();
    if (text) {
      jobTitle = text;
      break;
    }
  }

  for (const selector of salarySelectors) {
    const el =
      document.querySelector(selector);
    const text =
      el?.textContent?.trim();
    if (text) {
      salary = text;
      break;
    }
  }

  if (!company) return null;

  return {
    company,
    jobTitle:
      jobTitle || "Unknown Position",
    salary: salary || "",
    url: globalThis.location.href,
    platform: "linkedin",
  };
}

chrome.runtime.onMessage.addListener(
  (message, _sender, sendResponse) => {
    if (
      message.type === "GET_JOB_INFO"
    ) {
      sendResponse({
        data: extractJobInfo(),
      });
    }
    return true;
  },
);
