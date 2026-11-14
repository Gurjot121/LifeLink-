USE lifelink;

-- Remove the earlier versions I gave you (different behaviour, now replaced)
DROP PROCEDURE IF EXISTS check_stock;
DROP PROCEDURE IF EXISTS update_stock;
DROP FUNCTION  IF EXISTS fn_check_stock;

-- CHECK_STOCK
DROP PROCEDURE IF EXISTS pkg_blood_check_stock;
DELIMITER //
CREATE PROCEDURE pkg_blood_check_stock(
    IN  p_org_id          INT,
    IN  p_blood_group_id  INT,
    OUT p_units_available INT
)
BEGIN
    DECLARE EXIT HANDLER FOR NOT FOUND
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20011,
            MESSAGE_TEXT = 'Inventory record not found.';

    SELECT units_available INTO p_units_available
    FROM INVENTORY
    WHERE org_id = p_org_id
      AND blood_group_id = p_blood_group_id;
END //
DELIMITER ;

-- UPDATE_STOCK (sets the stock to an exact new value)
DROP PROCEDURE IF EXISTS pkg_blood_update_stock;
DELIMITER //
CREATE PROCEDURE pkg_blood_update_stock(
    IN p_org_id         INT,
    IN p_blood_group_id INT,
    IN p_new_units      INT
)
BEGIN
    DECLARE v_count INT;

    IF p_new_units < 0 THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20004,
            MESSAGE_TEXT = 'Units cannot be negative.';
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM INVENTORY
    WHERE org_id = p_org_id AND blood_group_id = p_blood_group_id;

    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20001,
            MESSAGE_TEXT = 'Inventory record not found.';
    END IF;

    UPDATE INVENTORY
    SET units_available = p_new_units,
        last_updated = CURRENT_TIMESTAMP
    WHERE org_id = p_org_id
      AND blood_group_id = p_blood_group_id;
END //
DELIMITER ;

-- REDUCE_STOCK
DROP PROCEDURE IF EXISTS pkg_blood_reduce_stock;
DELIMITER //
CREATE PROCEDURE pkg_blood_reduce_stock(
    IN p_org_id           INT,
    IN p_blood_group_id   INT,
    IN p_units_to_reduce  INT
)
BEGIN
    IF p_units_to_reduce <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20005,
            MESSAGE_TEXT = 'Units to reduce must be greater than zero.';
    END IF;

    UPDATE INVENTORY
    SET units_available = units_available - p_units_to_reduce,
        last_updated = CURRENT_TIMESTAMP
    WHERE org_id = p_org_id
      AND blood_group_id = p_blood_group_id
      AND units_available >= p_units_to_reduce;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20002,
            MESSAGE_TEXT = 'Insufficient stock or inventory record not found.';
    END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS search_blood;
DROP PROCEDURE IF EXISTS pkg_blood_search_blood;
DELIMITER //
CREATE PROCEDURE pkg_blood_search_blood(
    IN p_blood_group_name VARCHAR(5),
    IN p_city             VARCHAR(50)
)
BEGIN
    SELECT o.org_id, o.org_name, o.org_type, o.city,
           b.blood_group_name, i.units_available
    FROM INVENTORY i
    JOIN ORGANISATIONS o ON i.org_id = o.org_id
    JOIN BLOOD_GROUPS  b ON i.blood_group_id = b.blood_group_id
    WHERE b.blood_group_name = p_blood_group_name
      AND o.city = p_city
      AND o.verification_status = 'APPROVED'
      AND i.units_available > 0
    ORDER BY i.units_available DESC;
END //
DELIMITER ;

USE lifelink;

-- ADD_STOCK: adds units, creating the inventory row if the org has none for that group
DROP PROCEDURE IF EXISTS pkg_blood_add_stock;
DELIMITER //
CREATE PROCEDURE pkg_blood_add_stock(
    IN p_org_id         INT,
    IN p_blood_group_id INT,
    IN p_units          INT
)
BEGIN
    DECLARE EXIT HANDLER FOR 1452
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20022,
            MESSAGE_TEXT = 'Invalid organisation or blood group.';

    IF p_units <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20021,
            MESSAGE_TEXT = 'Units to add must be greater than zero.';
    END IF;

    INSERT INTO INVENTORY (org_id, blood_group_id, units_available)
    VALUES (p_org_id, p_blood_group_id, p_units)
    ON DUPLICATE KEY UPDATE
        units_available = units_available + p_units,
        last_updated = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- VIEW_INVENTORY: an organisation's full stock
DROP PROCEDURE IF EXISTS pkg_blood_view_inventory;
DELIMITER //
CREATE PROCEDURE pkg_blood_view_inventory(IN p_org_id INT)
BEGIN
    SELECT b.blood_group_id, b.blood_group_name, i.units_available, i.last_updated
    FROM INVENTORY i
    JOIN BLOOD_GROUPS b ON i.blood_group_id = b.blood_group_id
    WHERE i.org_id = p_org_id
    ORDER BY b.blood_group_id;
END //
DELIMITER ;

-- LIST_BLOOD_GROUPS: for dropdowns
DROP PROCEDURE IF EXISTS pkg_blood_list_blood_groups;
DELIMITER //
CREATE PROCEDURE pkg_blood_list_blood_groups()
BEGIN
    SELECT blood_group_id, blood_group_name FROM BLOOD_GROUPS ORDER BY blood_group_id;
END //
DELIMITER ;