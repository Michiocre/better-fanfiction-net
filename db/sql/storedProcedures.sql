DELIMITER $$
DROP PROCEDURE IF EXISTS saveFandom$$
CREATE PROCEDURE saveFandom (IN _id INT, IN _name VARCHAR(512), IN _category VARCHAR(32))
BEGIN
    INSERT INTO `fandom` (`id`, `name`, `category`) 
		VALUES(_id, _name, _category)
	ON DUPLICATE KEY UPDATE
		`name`=_name, 
    `category`=_category;
END$$

DROP PROCEDURE IF EXISTS saveAuthor$$
CREATE PROCEDURE saveAuthor (IN _id INT, IN _name VARCHAR(64))
BEGIN
    INSERT INTO `author` (`id`, `name`) 
		VALUES(_id, _name)
	ON DUPLICATE KEY UPDATE
		`name`=_name;
END$$

DROP PROCEDURE IF EXISTS saveCharacter$$
CREATE PROCEDURE saveCharacter (IN _name VARCHAR(64), IN _fandom_id INT, IN _xfandom_id INT)
BEGIN
	INSERT IGNORE INTO `character` (`name`, `fandom_id`) 
			VALUES(_name, _fandom_id);
	IF (_xfandom_id IS NOT NULL) THEN
		INSERT IGNORE INTO `character` (`name`, `fandom_id`) 
			VALUES(_name, _xfandom_id);
	END IF;
END$$

DROP PROCEDURE IF EXISTS saveCommunity$$
CREATE PROCEDURE saveCommunity (IN _id INT, IN _name varchar(64), IN _founder_id INT, IN _focus_id INT, IN _start_date datetime, IN _story_count INT, IN _followers INT, IN _description varchar(2048))
BEGIN
	INSERT INTO `community` (`id`, `name`, `founder_id`, `focus_id`, `start_date`, `story_count`, `followers`, `description`) 
			VALUES(_id, _name, _founder_id, _focus_id, _start_date, _story_count, _followers, _description)
	ON DUPLICATE KEY UPDATE
		`name`=_name, `founder_id`=_founder_id, `focus_id`=_focus_id, `start_date`=start_date, `story_count`=_story_count, `followers`=_followers, `description`=_description;
END$$

DROP PROCEDURE IF EXISTS saveCommunityAuthor$$
CREATE PROCEDURE saveCommunityAuthor (IN _community_id INT, IN _author_id INT)
BEGIN
	INSERT IGNORE INTO `community_author` (`community_id`, `author_id`) 
			VALUES(_community_id, _author_id);
END$$