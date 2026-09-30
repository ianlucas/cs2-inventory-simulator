-- DropTable
DROP TABLE "EconomyPriceSyncState";

-- Every stored price repeats one frozen upstream snapshot per day; the economy
-- price loader inserts it once, dated 2026-08-02.
TRUNCATE TABLE "EconomyPrice";
