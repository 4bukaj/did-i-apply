# Did I Apply?

Chrome extension that checks whether you've already applied to a company when browsing job offers on LinkedIn or justjoin.it. Uses a Google Spreadsheet as the data store.

## Setup

### 1. Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable the **Google Sheets API**:
   - Go to **APIs & Services > Library**
   - Search for "Google Sheets API" and enable it
4. Create OAuth credentials:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth client ID**
   - Application type: **Chrome Extension**
   - Enter your extension ID (you'll get this after loading the unpacked extension once)
   - Copy the **Client ID**
5. Configure the OAuth consent screen:
   - Go to **APIs & Services > OAuth consent screen**
   - Set up as **External** (or Internal if using Google Workspace)
   - Add the scope: `https://www.googleapis.com/auth/spreadsheets`
   - Add yourself as a test user

### 2. Google Spreadsheet

1. Create a new Google Spreadsheet
2. Name the first sheet tab **Applications** (case-sensitive)
3. Add these headers in row 1:

   | A | B | C | D | E | F |
   |---|---|---|---|---|---|
   | Company | Job Title | URL | Date Applied | Status | Notes |

4. Copy the spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/{THIS_IS_THE_ID}/edit`

### 3. Build & Install the Extension

```bash
npm install
npm run build
```

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `dist/` folder
4. Note your **Extension ID** — go back to Google Cloud Console and update the OAuth client ID with it
5. Update `dist/manifest.json` — replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID
   - (Or update `public/manifest.json` and rebuild)

### 4. Configure

1. Click the extension icon in Chrome toolbar
2. Click the gear icon to open settings
3. Paste your Spreadsheet ID and save

## Usage

1. Browse to a job offer on **LinkedIn** or **justjoin.it**
2. Click the extension icon
3. The extension extracts the company name and job title from the page
4. It checks your spreadsheet for previous applications to that company
5. If found: shows your previous application details
6. If not found: click **Add to Tracker** to log it

## Development

```bash
npm run dev    # watch mode — rebuilds on file changes
npm run build  # production build
```

The built extension goes into the `dist/` folder. After rebuilding, reload the extension in `chrome://extensions/`.
