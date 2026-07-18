CREATE TABLE "_harness_state" (
    "key" VARCHAR(64) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "_harness_state_pkey" PRIMARY KEY ("key")
);
