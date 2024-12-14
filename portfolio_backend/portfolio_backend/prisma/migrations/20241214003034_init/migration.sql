/*
  Warnings:

  - Made the column `postId` on table `Media` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Media` DROP FOREIGN KEY `Media_postId_fkey`;

-- AlterTable
ALTER TABLE `Media` MODIFY `postId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
