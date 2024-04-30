-- SQLite
CREATE TABLE IF NOT EXISTS `author` (
    `id` INT NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `fandom` (
    `id` INT NOT NULL,
    `name` VARCHAR(512) NOT NULL,
    `category` VARCHAR(32) NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `character` (
    `id` INT AUTO_INCREMENT NOT NULL,
    `fandom_id` INT NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`fandom_id`) REFERENCES `fandom`(`id`),
    UNIQUE (`fandom_id`, `name`)
);

CREATE TABLE IF NOT EXISTS `story` (
    `id` INT NOT NULL,
    `title` VARCHAR(128) NOT NULL,
    `author_id` INT NOT NULL,
    `fandom_id` INT NOT NULL,
    `xfandom_id` INT,
    `description` VARCHAR(2048) NOT NULL,
    `rating` VARCHAR(2) NOT NULL,
    `chapters` INT NOT NULL,
    `words` INT NOT NULL,
    `reviews` INT DEFAULT NULL,
    `favs` INT DEFAULT NULL,
    `follows` INT DEFAULT NULL,
    `updated` DATETIME DEFAULT NULL,
    `published` DATETIME NOT NULL,
    `completed` BOOLEAN NOT NULL,
    `genreA` VARCHAR(20),
    `genreB` VARCHAR(20),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`author_id`) REFERENCES `author`(`id`),
    FOREIGN KEY (`fandom_id`) REFERENCES `fandom`(`id`),
    FOREIGN KEY (`xfandom_id`) REFERENCES `fandom`(`id`)
);

CREATE TABLE IF NOT EXISTS `story_fandom` (
    `story_id` INT NOT NULL,
    `fandom_id` INT NOT NULL,
    PRIMARY KEY (`story_id`, `fandom_id`),
    FOREIGN KEY (`story_id`) REFERENCES `story`(`id`),
    FOREIGN KEY (`fandom_id`) REFERENCES `fandom`(`id`)
);

CREATE TABLE IF NOT EXISTS `story_character` (
    `story_id` INT NOT NULL,
    `character_id` INT NOT NULL,
    `pairing` INT DEFAULT(0) NOT NULL,
    PRIMARY KEY (`story_id`, `character_id`, `pairing`),
    FOREIGN KEY (`story_id`) REFERENCES `story`(`id`),
    FOREIGN KEY (`character_id`) REFERENCES `character`(`id`)
);

CREATE TABLE IF NOT EXISTS `community` (
    `id` INT NOT NULL,
    `name` varchar(64) NOT NULL,
    `founder_id` INT NOT NULL,
    `focus_id` INT NOT NULL,
    `start_date` DATETIME NOT NULL,
    `story_count` INT NOT NULL,
    `followers` INT NOT NULL,
    `description` VARCHAR(2048) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`founder_id`) REFERENCES `author`(`id`),
    FOREIGN KEY (`focus_id`) REFERENCES `fandom`(`id`)
);

CREATE TABLE IF NOT EXISTS `story_community` (
    `story_id` INT NOT NULL,
    `community_id` INT NOT NULL,
    PRIMARY KEY (`story_id`, `community_id`),
    FOREIGN KEY (`story_id`) REFERENCES `story`(`id`),
    FOREIGN KEY (`community_id`) REFERENCES `community`(`id`)
);

CREATE TABLE IF NOT EXISTS `community_author` (
    `community_id` INT NOT NULL,
    `author_id` INT NOT NULL,
    PRIMARY KEY (`community_id`, `author_id`),
    FOREIGN KEY (`community_id`) REFERENCES `community`(`id`),
    FOREIGN KEY (`author_id`) REFERENCES `author`(`id`)
);


INSERT OR IGNORE INTO `fandom` VALUES (0, 'All Categories', 'general');