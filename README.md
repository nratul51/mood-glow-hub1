# Daily Vibe Check

Build a mobile-friendly web app called "Check In Hub" — a stress/burnout 

tracking wellness tool. This is a general wellness app, NOT a medical or 

diagnostic tool. Follow these constraints strictly.

CORE FEATURES:

1. Daily check-in form with:

   - Mood/energy rating (1-5 scale, emoji-based)

   - Sleep hours (number input)

   - Stress tags (multi-select: work, social, physical, sleep, other)

   - Optional free-text note

   - Store each entry with today's date, persisted per-user so history 

     builds over time

2. Daily reminder notification:

   - Send a push/browser notification at 9:00 PM local time reminding 

     the user to complete their daily check-in if they haven't yet

   - Simple, friendly copy — e.g. "How was your day? Take 30 seconds 

     to check in."

   - Include a settings toggle to turn this on/off and adjust the time

3. Dashboard status indicator (color state, NOT a diagnostic score):

   - Track a rolling "state" based on recent check-ins, not a single day

   - If the last 3 consecutive days all show low mood/energy ratings 

     (below a defined threshold), the dashboard's visual theme shifts 

     to a warm red/amber tone — framed purely as "your recent check-ins 

     have trended lower" (NOT "you are burned out" or any clinical label)

   - The shift back to normal should be gradual, not instant: after the 

     low-trend state is triggered, it takes 2-4 consecutive good days 

     to fade the color back to the calm/normal state — implement this 

     as a gradual interpolation (e.g., color intensity decreases 

     incrementally with each good day) rather than an instant snap-back

   - Label this indicator neutrally in the UI, e.g. "Recent Trend" — 

     never "Burnout Alert," "Warning," or similar clinical/alarming language

   - Include a short explanatory tooltip: "This reflects your recent 

     check-in patterns, not a diagnosis."

4. Weekly pattern summary (AI-generated):

   - Analyze the user's last 7-14 days of check-ins

   - Reflect back observed patterns in the user's own data 

     (e.g., "Your stress ratings were higher on days following under 

     6 hours of sleep")

   - Suggest general lifestyle nudges only (short walk, breathing 

     exercise, earlier bedtime, screen-time break)

   - NEVER diagnose, label, or suggest a medical/psychological condition

   - NEVER recommend medication or supplements

   - Frame everything as "your logged data shows..." not "you have..."

5. Trend view:

   - Simple line/bar chart of mood, energy, and sleep over the past 

     2-4 weeks

   - No clinical scoring or risk scores — just raw trend visualization

REQUIRED SAFETY ELEMENTS:

- Show a disclaimer on first use and in settings: "Check In Hub is for 

  general wellness tracking only. It is not a substitute for 

  professional medical or mental health care. If you're in crisis, 

  please contact a mental health professional or crisis line."

- All AI-generated text and dashboard states must stay observational/

  reflective — never interpretive of a health condition, never alarming 

  or clinical in tone.

DESIGN:

- Clean, calm aesthetic (soft colors, minimal UI, generous whitespace)

- Mobile-first, single-column layout

- Fast daily check-in (under 30 seconds to complete)

- Dashboard color transitions should feel smooth and gentle, not jarring

Build this as one complete pass — check-in form, notification setting, 

color-state dashboard logic, weekly AI summary, and trend chart — to 

minimize back-and-forth revisions.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/799c8c05-a0aa-438a-ac8f-1ba0215224fa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
