-- CreateTable
CREATE TABLE "RecurringSubcategory" (
    "id" TEXT NOT NULL,
    "recurringExpenseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringSubcategory_recurringExpenseId_idx" ON "RecurringSubcategory"("recurringExpenseId");

-- AddForeignKey
ALTER TABLE "RecurringSubcategory" ADD CONSTRAINT "RecurringSubcategory_recurringExpenseId_fkey" FOREIGN KEY ("recurringExpenseId") REFERENCES "RecurringExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "recurringSubcategoryId" TEXT;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recurringSubcategoryId_fkey" FOREIGN KEY ("recurringSubcategoryId") REFERENCES "RecurringSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
