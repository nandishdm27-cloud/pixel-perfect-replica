# My Calculator

A focused, responsive calculator for everyday math. It combines a clean keypad with keyboard support and a session-only history of recent calculations.

## Features

- Addition, subtraction, multiplication, and division with correct order of operations
- Decimal, percentage, positive/negative, clear, backspace, and equals controls
- Keyboard shortcuts for numbers, operators, Enter, Backspace, and Escape
- Graceful division-by-zero and invalid-input messages
- Clickable calculation history with a clear-history action
- Responsive desktop, tablet, and mobile layout
- Optional light theme

## Technologies

- TanStack Start
- React 19 and TypeScript
- TanStack Router
- Tailwind CSS v4 and semantic CSS design tokens
- Lucide React icons

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

## How to use

Click the keypad or use your keyboard to enter an expression. Press `Enter` or `=` to calculate, `Backspace` to remove the last character, and `Escape` to clear the current expression. Recent results are available in the history panel for the duration of the current session.