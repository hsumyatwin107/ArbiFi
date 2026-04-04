-- CreateTable
CREATE TABLE "DisputeState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "disputeCreated" BOOLEAN NOT NULL DEFAULT false,
    "partyBJoined" BOOLEAN NOT NULL DEFAULT false,
    "evidenceA" TEXT NOT NULL DEFAULT '',
    "evidenceB" TEXT NOT NULL DEFAULT '',
    "aiResult" JSONB,
    "winner" TEXT NOT NULL DEFAULT ''
);
