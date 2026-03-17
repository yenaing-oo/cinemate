CREATE TABLE "WatchPartyParticipant" (
    "id" TEXT NOT NULL,
    "watchPartyId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchPartyParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WatchPartyParticipant_watchPartyId_userId_key"
ON "WatchPartyParticipant"("watchPartyId", "userId");

CREATE INDEX "WatchPartyParticipant_userId_createdAt_idx"
ON "WatchPartyParticipant"("userId", "createdAt");

CREATE INDEX "WatchPartyParticipant_watchPartyId_createdAt_idx"
ON "WatchPartyParticipant"("watchPartyId", "createdAt");

ALTER TABLE "WatchPartyParticipant"
ADD CONSTRAINT "WatchPartyParticipant_watchPartyId_fkey"
FOREIGN KEY ("watchPartyId") REFERENCES "WatchParty"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WatchPartyParticipant"
ADD CONSTRAINT "WatchPartyParticipant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
