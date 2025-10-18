-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ingredients" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "tags" JSONB NOT NULL,
    "servings" INTEGER,
    "prepMinutes" INTEGER,
    "cookMinutes" INTEGER,
    "imagePath" TEXT,
    "sourceUrl" TEXT,
    "ownerId" TEXT,
    "ownerName" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Recipe" ("cookMinutes", "createdAt", "description", "id", "imagePath", "ingredients", "prepMinutes", "servings", "sourceUrl", "steps", "tags", "title", "updatedAt") SELECT "cookMinutes", "createdAt", "description", "id", "imagePath", "ingredients", "prepMinutes", "servings", "sourceUrl", "steps", "tags", "title", "updatedAt" FROM "Recipe";
DROP TABLE "Recipe";
ALTER TABLE "new_Recipe" RENAME TO "Recipe";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
