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