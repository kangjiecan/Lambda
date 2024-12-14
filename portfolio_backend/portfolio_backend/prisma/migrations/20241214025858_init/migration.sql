-- DropForeignKey
ALTER TABLE `Media` DROP FOREIGN KEY `Media_postId_fkey`;

-- AlterTable
ALTER TABLE `Media` MODIFY `postId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
