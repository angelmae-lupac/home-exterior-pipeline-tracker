-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "notes" TEXT,
    "estimateQuantity" DOUBLE PRECISION,
    "estimateRate" DOUBLE PRECISION,
    "estimateTotal" DOUBLE PRECISION,
    "scheduledDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
