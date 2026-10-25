# Enterprise Intake and Analytics Workbench

Next.js Pages Router application for change-request intake, approval workflow
visualization, reporting, and SLA calendar views.

## Getting started

Install dependencies and run the development server:

```sh
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to the API origin when the service is not hosted at
the same origin. The application expects `GET /reporting` to return a list of
change requests and `POST /intake` to accept a new request. API errors are
shown in the relevant page.

Without `NEXT_PUBLIC_API_URL`, the app runs in browser-local demo mode with
sample change requests. Demo submissions are saved in the browser's local
storage and are not sent to a backend.

## Routes

- `/intake/new` — multi-step, Zod-validated change-request form with secure
  draft saving.
- `/reporting` — nested filters, virtualized results, analytics, XLSX and PDF
  exports.
- `/calendar` — request SLA due-date calendar.

The Redux store is created per Pages Router application instance. Reporting
records and filters use the shared contracts in `types/reporting.types.ts`;
intake schema definitions are in `types/schema.types.ts`.
