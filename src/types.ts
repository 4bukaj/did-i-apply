export interface JobInfo {
  company: string;
  jobTitle: string;
  salary: string;
  url: string;
  platform: "linkedin" | "justjoinit";
}

export interface ApplicationRecord {
  company: string;
  jobTitle: string;
  salary: string;
  url: string;
  dateApplied: string;
  status: string;
  notes: string;
}
