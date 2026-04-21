import {
  ApplicationRecord,
  JobInfo,
} from "../types";

const SPREADSHEET_ID_KEY =
  "spreadsheetId";
const SHEET_NAME = "Applications";

function getAuthToken(): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      chrome.identity.getAuthToken(
        { interactive: true },
        (token) => {
          if (
            chrome.runtime.lastError
          ) {
            reject(
              new Error(
                chrome.runtime.lastError
                  .message,
              ),
            );
          } else if (token) {
            resolve(token);
          } else {
            reject(
              new Error(
                "No token received",
              ),
            );
          }
        },
      );
    },
  );
}

function getSpreadsheetId(): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      chrome.storage.sync.get(
        SPREADSHEET_ID_KEY,
        (result) => {
          if (
            result[SPREADSHEET_ID_KEY]
          ) {
            resolve(
              result[
                SPREADSHEET_ID_KEY
              ],
            );
          } else {
            reject(
              new Error(
                "NO_SPREADSHEET_ID",
              ),
            );
          }
        },
      );
    },
  );
}

async function checkApplication(
  company: string,
): Promise<ApplicationRecord[]> {
  const token = await getAuthToken();
  const spreadsheetId =
    await getSpreadsheetId();

  const range = `${SHEET_NAME}!A:G`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Sheets API error ${response.status}: ${text}`,
    );
  }

  const data = await response.json();
  const rows: string[][] =
    data.values || [];

  const normalizedCompany =
    company.toLowerCase();

  return rows
    .slice(1)
    .filter((row) =>
      row[0]
        ?.toLowerCase()
        .includes(normalizedCompany),
    )
    .map((row) => ({
      company: row[0] || "",
      jobTitle: row[1] || "",
      salary: row[2] || "",
      url: row[3] || "",
      dateApplied: row[4] || "",
      status: row[5] || "",
      notes: row[6] || "",
    }));
}

async function addApplication(
  jobInfo: JobInfo,
): Promise<void> {
  const token = await getAuthToken();
  const spreadsheetId =
    await getSpreadsheetId();

  const range = `${SHEET_NAME}!A:G`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type":
        "application/json",
    },
    body: JSON.stringify({
      values: [
        [
          jobInfo.company,
          jobInfo.jobTitle,
          jobInfo.salary,
          jobInfo.url,
          today,
          "Applied",
          "",
        ],
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Sheets API error ${response.status}: ${text}`,
    );
  }
}

async function ensureHeaderRow(): Promise<void> {
  const token = await getAuthToken();
  const spreadsheetId =
    await getSpreadsheetId();

  const range = `${SHEET_NAME}!A1:G1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return;

  const data = await response.json();
  if (
    data.values &&
    data.values.length > 0
  )
    return;

  await fetch(
    `${url}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        values: [
          [
            "Company",
            "Job Title",
            "Salary",
            "URL",
            "Date Applied",
            "Status",
            "Notes",
          ],
        ],
      }),
    },
  );
}

chrome.runtime.onMessage.addListener(
  (message, _sender, sendResponse) => {
    if (
      message.type ===
      "CHECK_APPLICATION"
    ) {
      checkApplication(message.company)
        .then((records) =>
          sendResponse({
            data: records,
          }),
        )
        .catch((err) =>
          sendResponse({
            data: [],
            error: err.message,
          }),
        );
      return true;
    }

    if (
      message.type === "ADD_APPLICATION"
    ) {
      ensureHeaderRow()
        .then(() =>
          addApplication(message.data),
        )
        .then(() =>
          sendResponse({
            success: true,
          }),
        )
        .catch((err) =>
          sendResponse({
            success: false,
            error: err.message,
          }),
        );
      return true;
    }

    if (
      message.type ===
      "GET_SPREADSHEET_ID"
    ) {
      chrome.storage.sync.get(
        SPREADSHEET_ID_KEY,
        (result) => {
          sendResponse({
            spreadsheetId:
              result[
                SPREADSHEET_ID_KEY
              ] || "",
          });
        },
      );
      return true;
    }

    if (
      message.type ===
      "SET_SPREADSHEET_ID"
    ) {
      chrome.storage.sync.set(
        {
          [SPREADSHEET_ID_KEY]:
            message.spreadsheetId,
        },
        () => {
          sendResponse({
            success: true,
          });
        },
      );
      return true;
    }

    return false;
  },
);
