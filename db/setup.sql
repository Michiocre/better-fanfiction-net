CREATE TABLE `betterff`.`author` (
    `id` INT NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB;

CREATE TABLE `betterff`.`genre` (
    `id` INT NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB;

CREATE TABLE `betterff`.`fandom` (
    `id` INT NOT NULL,
    `name` VARCHAR(288) NOT NULL,
    `category` VARCHAR(32) NOT NULL,
    `display` VARCHAR(288) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB;

CREATE TABLE `betterff`.`rating` (
    `id` INT AUTO_INCREMENT NOT NULL,
    `name` VARCHAR(2) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB;

INSERT INTO `betterff`.`rating` (name) VALUES ("K");
INSERT INTO `betterff`.`rating` (name) VALUES ("K+");
INSERT INTO `betterff`.`rating` (name) VALUES ("T");
INSERT INTO `betterff`.`rating` (name) VALUES ("M");

CREATE TABLE `betterff`.`character` (
    `id` INT AUTO_INCREMENT NOT NULL,
    `fandom_id` INT NOT NULL,
    `name` VARCHAR(32) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`fandom_id`) REFERENCES `betterff`.`fandom`(`id`)
) ENGINE = InnoDB;

CREATE TABLE `betterff`.`story` (
    `id` INT NOT NULL,
    `title` VARCHAR(128) NOT NULL,
    `author_id` INT NOT NULL,
    `fandom_id` INT NOT NULL,
    `description` VARCHAR(2048) NOT NULL,
    `rating_id` INT NOT NULL,
    `chapters` INT NOT NULL,
    `words` INT NOT NULL,
    `reviews` INT DEFAULT NULL,
    `favs` INT DEFAULT NULL,
    `follows` INT DEFAULT NULL,
    `updated` DATETIME DEFAULT NULL,
    `published` DATETIME NOT NULL,
    `completed` BOOLEAN NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`author_id`) REFERENCES `betterff`.`author`(`id`),
    FOREIGN KEY (`fandom_id`) REFERENCES `betterff`.`fandom`(`id`),
    FOREIGN KEY (`rating_id`) REFERENCES `betterff`.`rating`(`id`)
) ENGINE = InnoDB;

CREATE TABLE `betterff`.`story_genre` (
    `story_id` INT NOT NULL,
    `genre_id` INT NOT NULL,
    PRIMARY KEY (`story_id`, `genre_id`),
    FOREIGN KEY (`story_id`) REFERENCES `betterff`.`story`(`id`),
    FOREIGN KEY (`genre_id`) REFERENCES `betterff`.`genre`(`id`)
) ENGINE = InnoDB;

CREATE TABLE `betterff`.`story_fandom` (
    `story_id` INT NOT NULL,
    `fandom_id` INT NOT NULL,
    PRIMARY KEY (`story_id`, `fandom_id`),
    FOREIGN KEY (`story_id`) REFERENCES `betterff`.`story`(`id`),
    FOREIGN KEY (`fandom_id`) REFERENCES `betterff`.`fandom`(`id`)
) ENGINE = InnoDB;

CREATE TABLE `betterff`.`story_character` (
    `story_id` INT NOT NULL,
    `character_id` INT NOT NULL,
    `pairing` INT DEFAULT NULL,
    PRIMARY KEY (`story_id`, `character_id`),
    FOREIGN KEY (`story_id`) REFERENCES `betterff`.`story`(`id`),
    FOREIGN KEY (`character_id`) REFERENCES `betterff`.`character`(`id`)
) ENGINE = InnoDB;
