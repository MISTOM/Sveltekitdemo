/*
  Warnings:

  - You are about to alter the column `accountNumber` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `Int`.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `phoneNumber` VARCHAR(255) NULL,
    MODIFY `accountNumber` INTEGER NULL,
    MODIFY `bankName` VARCHAR(255) NULL,
    MODIFY `branchName` VARCHAR(255) NULL;
