import { ApplicationRecord, JobInfo } from "../types";

const $ = (id: string) => document.getElementById(id)!;

function show(id: string) {
  $(id).classList.remove("hidden");
}
function hide(id: string) {
  $(id).classList.add("hidden");
}

function sendToBackground<T>(message: Record<string, unknown>): Promise<T> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: T) => resolve(response));
  });
}

async function getCurrentTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getJobInfoFromTab(
  tabId: number,
): Promise<JobInfo | null> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "GET_JOB_INFO",
    });
    return response?.data || null;
  } catch {
    return null;
  }
}

function renderApplications(records: ApplicationRecord[]) {
  const list = $("applications-list");
  list.innerHTML = "";

  for (const record of records) {
    const card = document.createElement("div");
    card.className = "application-card";
    card.innerHTML = `
      <div class="app-title">${escapeHtml(record.jobTitle)}</div>
      ${record.salary ? `<div class="app-salary">${escapeHtml(record.salary)}</div>` : ""}
      <div class="app-meta">
        <span>${escapeHtml(record.dateApplied)}</span>
        <span>${escapeHtml(record.status)}</span>
      </div>
      ${record.notes ? `<div class="app-meta">${escapeHtml(record.notes)}</div>` : ""}
    `;
    list.appendChild(card);
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showError(message: string) {
  $("error-message").textContent = message;
  show("error");
}

// --- Settings ---

function initSettings() {
  const settingsBtn = $("settings-btn");
  const settingsPanel = $("settings-panel");
  const saveBtn = $("save-settings");
  const input = $("spreadsheet-id") as HTMLInputElement;

  settingsBtn.addEventListener("click", () => {
    settingsPanel.classList.toggle("hidden");
    if (!settingsPanel.classList.contains("hidden")) {
      sendToBackground<{ spreadsheetId: string }>({
        type: "GET_SPREADSHEET_ID",
      }).then((res) => {
        input.value = res.spreadsheetId;
      });
    }
  });

  saveBtn.addEventListener("click", () => {
    const id = input.value.trim();
    if (!id) return;
    sendToBackground({ type: "SET_SPREADSHEET_ID", spreadsheetId: id }).then(
      () => {
        settingsPanel.classList.add("hidden");
        init(); // re-run main flow
      },
    );
  });
}

// --- Main flow ---

async function init() {
  hide("loading");
  hide("no-job");
  hide("job-detected");
  hide("already-applied");
  hide("not-applied");
  hide("added");
  hide("error");

  show("loading");

  const tab = await getCurrentTab();
  if (!tab?.id) {
    hide("loading");
    show("no-job");
    return;
  }

  const jobInfo = await getJobInfoFromTab(tab.id);
  hide("loading");

  if (!jobInfo) {
    show("no-job");
    return;
  }

  $("job-title").textContent = jobInfo.jobTitle;
  $("job-company").textContent = jobInfo.company;
  if (jobInfo.salary) {
    $("job-salary").textContent = jobInfo.salary;
    show("job-salary");
  }
  show("job-detected");

  // Check spreadsheet
  const result = await sendToBackground<{
    data: ApplicationRecord[];
    error?: string;
  }>({
    type: "CHECK_APPLICATION",
    company: jobInfo.company,
  });

  if (result.error) {
    if (result.error === "NO_SPREADSHEET_ID") {
      showError("Set your Spreadsheet ID in settings first.");
      $("settings-panel").classList.remove("hidden");
    } else {
      showError(result.error);
    }
    return;
  }

  if (result.data.length > 0) {
    show("already-applied");
    renderApplications(result.data);
  } else {
    show("not-applied");

    const addBtn = $("add-btn") as HTMLButtonElement;
    const btnLabel = addBtn.querySelector(".btn-label")!;
    const btnSpinner = addBtn.querySelector(".btn-spinner")!;

    addBtn.onclick = async () => {
      addBtn.disabled = true;
      btnLabel.textContent = "Adding...";
      btnSpinner.classList.remove("hidden");

      const addResult = await sendToBackground<{
        success: boolean;
        error?: string;
      }>({
        type: "ADD_APPLICATION",
        data: jobInfo,
      });

      if (addResult.success) {
        hide("not-applied");
        show("added");
      } else {
        showError(addResult.error || "Failed to add application");
        addBtn.disabled = false;
        btnLabel.textContent = "Add to Tracker";
        btnSpinner.classList.add("hidden");
      }
    };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initSettings();
  init();
});
