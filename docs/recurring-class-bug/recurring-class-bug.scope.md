# recurring-class-bug.scope.md

**Feature/Issue:** Recurring Class Booking Bug
**Last Updated:** 2025-11-10

---

## What IS in scope
- All code and logic related to booking recurring classes (biweekly, weekly, monthly)
- API endpoints for class scheduling
- Google Calendar integration logic
- Error handling for recurrence rules
- Logging and error reporting for class booking
- UI components that trigger recurring class creation

## What is NOT in scope
- One-time class booking (single event)
- Non-recurring class logic
- Payment, enrollment, or unrelated features
- Google OAuth setup (unless recurrence logic is affected)

## Critical areas to pay attention to
- Recurrence rule validation (daysOfWeek required for biweekly)
- API payload structure for recurring classes
- Google Calendar API request formatting
- Error propagation and logging (see logs/proderror.txt)
- UI form validation for recurrence options

## Interconnected features
- GoogleCalendar (API integration)
- ClassService (backend logic)
- API (route handlers)
- Teacher dashboard (UI triggers)

## Files to reference
- logs/proderror.txt (error logs)
- app/teacher/classes/page.tsx (UI)
- lib/services/google/google-calendar.service.ts (API integration)
- lib/services/class.service.ts (backend logic)

---
