CREATE TABLE `betterff`.`authors` (
    `id` INT NOT NULL, 
    `name` VARCHAR(64) NOT NULL, 
    PRIMARY KEY (`id`)
) ENGINE = InnoDB;

CREATE TABLE `betterff`.`stories` (
    `id` INT NOT NULL, 
    `title` VARCHAR(128) NOT NULL, 
    `authorId` INT NOT NULL,
    `description` VARCHAR(2048) NOT NULL, 
    `fandom` VARCHAR(64) NULL, 
    `rated` VARCHAR(3) NOT NULL,
    `genres` VARCHAR(64) DEFAULT NULL, 
    `chapters` INT NOT NULL, 
    `words` INT NOT NULL, 
    `reviews` INT DEFAULT NULL, 
    `favs` INT DEFAULT NULL, 
    `follows` INT DEFAULT NULL, 
    `updated` DATETIME DEFAULT NULL, 
    `published` DATETIME NOT NULL,
    `pairings` VARCHAR(128) DEFAULT NULL,
    `characters` VARCHAR(128) DEFAULT NULL,
    `completed` BOOLEAN NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`authorId`) REFERENCES `betterff`.`authors`(`id`)
) ENGINE = InnoDB;
