import { JobInfo } from "../types";

function extractJobInfo(): JobInfo | null {
  const companySelectors = [
    "[data-testid='organisation-name']",
    "[data-test-id='organisation-name']",
    "h2 a[href*='/company/']",
    ".css-1x9zltl",
    "h2",
  ];

  const titleSelectors = [
    "[data-testid='offer-title']",
    "[data-test-id='offer-title']",
    "h1",
  ];

  const salarySelectors = [
    "[data-testid='section-salary']",
    "[data-test-id='section-salary']",
    "[data-testid='salary']",
    "[data-test-id='salary']",
    "span[class*='salary']",
    "div[class*='salary']",
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
    platform: "justjoinit",
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
