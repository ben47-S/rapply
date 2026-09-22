-- CreateTable
CREATE TABLE "ReminderItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "reminderId" TEXT NOT NULL,

    CONSTRAINT "ReminderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReminderItem_reminderId_idx" ON "ReminderItem"("reminderId");

-- AddForeignKey
ALTER TABLE "ReminderItem" ADD CONSTRAINT "ReminderItem_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
