# Expense Tracker

A modern, mobile-first expense tracking application designed for speed, simplicity, and clear visibility into your spending habits. Built with React, Node.js, Express, and PostgreSQL.

## Features

- **Fast Expense Logging**: Quick add button for rapid entry, plus a dedicated "Common Spend" feature for frequently bought items (like coffee or transport) that you can log with a single click.
- **Recurring Expenses**: Set up monthly bills (rent, subscriptions) and log them with one click. They automatically hide once paid for the month.
- **Category Budgeting**: Set monthly budgets for different categories and track your actual spend against them.
- **Visual Dashboards**: See your daily spend in a bar chart and your category breakdowns in a vibrant pie chart.
- **Wishlist**: Save items you want to buy later. When you're ready, convert them directly into expenses.
- **Multi-Currency Support**: Choose your preferred currency from the settings.
- **Mobile-First Design**: Clean, sharp, modern UI optimized for use on your phone.

---

## Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Recharts (for data visualization).
- **Backend**: Node.js, Express, TypeScript, Zod (for validation).
- **Database**: PostgreSQL with Prisma ORM.
- **Deployment**: Fully containerized using Docker and Docker Compose (Nginx for frontend, Node for API, Postgres for DB).

---

## Prerequisites

To run this application locally, you need to have the following installed on your machine:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

---

## Installation & Setup

1. **Clone or download the repository** to your local machine.
2. **Open a terminal** and navigate to the root directory of the project (where the `docker-compose.yml` file is located).
3. **Start the application** using Docker Compose:

```bash
docker compose up --build
```

*Note: The first time you run this, it will take a few minutes to download the necessary Docker images, install dependencies, and build the frontend and backend.*

4. **Access the application**:
   - Open your web browser and go to: `http://localhost:8081`
   - Only the **web** container is published to your machine. The API and database are internal to Docker; the Vite dev server proxies `/api` to the API service, so the app works through that single URL.

5. **Stopping the application**:
   - Press `Ctrl+C` in the terminal where Docker Compose is running.
   - Or, run `docker compose down` in another terminal window.

---

## How to Use the App

### 1. Initial Setup (Settings Page)
When you first open the app, head to the **Settings** page (using the bottom navigation bar).
- **Set Currency**: Choose your preferred currency from the dropdown.
- **Create Categories**: Add categories for your spending (e.g., "Food", "Transport", "Bills").
- **Set Budgets**: Enter a monthly budget amount next to each category and click "Save budget".

### 2. Setting up Recurring & Common Spends
Also on the Settings page, you can set up templates for quick logging.
- **Recurring Expenses**: Add items like "Rent" or "Netflix". These appear on your dashboard. Once you log them for the current month, they are marked as "Done" and disabled to prevent double-charging.
- **Common Spends**: Check the "Common spend" box for things you buy often (like "Coffee" or "Train ticket"). These get a special `COMMON` tag on the dashboard and *never* disable—you can click them as many times as you want to quickly log those expenses.

### 3. Logging Expenses
There are three ways to log an expense:
1. **Quick Add**: Click the `+ Add` button at the top right of the Dashboard. Select a category, enter a name, amount, and optional note.
2. **Recurring/Common Section**: On the Dashboard, click any item in the "Recurring / Common" grid. Confirm the amount and click "Log Expense".
3. **From Wishlist**: On the Wishlist page, click "Purchased" on any item to convert it into an actual expense.

### 4. Viewing Your Data
- **Dashboard**: Shows your total budget vs. actual spend, a bar chart of your daily spending, and a pie chart breaking down your spend by category.
- **Expenses Page**: Shows a detailed, day-by-day list of all transactions for the selected month. You can edit or delete expenses here.

### 5. Managing Months
Use the month selector at the very top of the screen (e.g., `< March 2026 >`) to navigate back and forth in time. The dashboard, expenses list, and recurring status will automatically update to reflect the selected month.

---

## Development Guide

If you want to modify the code:

### Project Structure
- `/frontend`: React application (Vite).
- `/backend`: Node.js/Express API.
- `/backend/prisma`: Database schema and migrations.
- `/docs`: Internal documentation (API specs, entity models).

### Hot Reloading
The `docker-compose.yml` is configured for local development. When you run `docker compose up`, it mounts your local directories into the containers. 
- Any changes you make to the `/frontend` code will automatically hot-reload in your browser.
- Any changes you make to the `/backend` code will automatically restart the Express server.

### Database Migrations
If you modify the `backend/prisma/schema.prisma` file, you need to create a migration.
1. Open a terminal inside the `backend` folder.
2. Run the migration command:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expenses" npx prisma migrate dev --name your_migration_name
```
*(Ensure your Docker containers are running so the database is accessible).*

### Running Tests
Integration tests are located in the `/tests` folder. They test the API endpoints against a real database.
To run them:
```bash
cd backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expenses" npm run test
```
*(Warning: The test script resets the database before running. Do not run tests against your production database).*