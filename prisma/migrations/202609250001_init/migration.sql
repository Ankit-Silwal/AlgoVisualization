CREATE TABLE "experiments" (
  "id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "data" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);
