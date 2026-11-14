USE lifelink;

-- Remove the procedures from my earlier guess
DROP PROCEDURE IF EXISTS register_user;
DROP PROCEDURE IF EXISTS login_user;

-- REGISTER_USER
DROP PROCEDURE IF EXISTS pkg_user_register_user;
DELIMITER //
CREATE PROCEDURE pkg_user_register_user(
    IN  p_username VARCHAR(50),
    IN  p_password VARCHAR(255),
    IN  p_role     VARCHAR(20),
    OUT p_user_id  INT
)
BEGIN
    DECLARE EXIT HANDLER FOR 1062
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20012,
            MESSAGE_TEXT = 'Username already exists.';
    DECLARE EXIT HANDLER FOR 3819
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20013,
            MESSAGE_TEXT = 'Invalid role.';

    INSERT INTO USERS (username, password, role)
    VALUES (p_username, p_password, p_role);

    SET p_user_id = LAST_INSERT_ID();
END //
DELIMITER ;

-- LOGIN_USER
DROP PROCEDURE IF EXISTS pkg_user_login_user;
DELIMITER //
CREATE PROCEDURE pkg_user_login_user(
    IN  p_username VARCHAR(50),
    IN  p_password VARCHAR(255),
    OUT p_user_id  INT,
    OUT p_role     VARCHAR(20)
)
BEGIN
    DECLARE EXIT HANDLER FOR NOT FOUND
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20014,
            MESSAGE_TEXT = 'Invalid username or password.';

    SELECT user_id, role INTO p_user_id, p_role
    FROM USERS
    WHERE username = p_username
      AND password = p_password;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS verify_organisation;
DROP PROCEDURE IF EXISTS pkg_user_verify_organisation;
DELIMITER //
CREATE PROCEDURE pkg_user_verify_organisation(
    IN p_org_id INT,
    IN p_status VARCHAR(20)
)
BEGIN
    DECLARE v_count INT;
    DECLARE EXIT HANDLER FOR 3819
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20015,
            MESSAGE_TEXT = 'Invalid verification status.';

    SELECT COUNT(*) INTO v_count FROM ORGANISATIONS WHERE org_id = p_org_id;
    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20016,
            MESSAGE_TEXT = 'Organisation not found.';
    END IF;

    UPDATE ORGANISATIONS SET verification_status = p_status WHERE org_id = p_org_id;
END //
DELIMITER ;

USE lifelink;

-- REGISTER_ORGANISATION: second step of organisation sign-up (status starts PENDING)
DROP PROCEDURE IF EXISTS pkg_user_register_organisation;
DELIMITER //
CREATE PROCEDURE pkg_user_register_organisation(
    IN  p_user_id  INT,
    IN  p_org_name VARCHAR(100),
    IN  p_org_type VARCHAR(20),
    IN  p_city     VARCHAR(50),
    OUT p_org_id   INT
)
BEGIN
    DECLARE v_role VARCHAR(20);
    DECLARE EXIT HANDLER FOR 1062
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20018,
            MESSAGE_TEXT = 'Organisation already registered for this user.';
    DECLARE EXIT HANDLER FOR 3819
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20019,
            MESSAGE_TEXT = 'Invalid organisation type.';

    SET v_role = (SELECT role FROM USERS WHERE user_id = p_user_id);
    IF v_role IS NULL OR v_role <> 'ORGANISATION' THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20017,
            MESSAGE_TEXT = 'User not found or is not an organisation account.';
    END IF;

    INSERT INTO ORGANISATIONS (user_id, org_name, org_type, city)
    VALUES (p_user_id, p_org_name, p_org_type, p_city);

    SET p_org_id = LAST_INSERT_ID();
END //
DELIMITER ;

-- GET_ORG_ID: after login, find which organisation this user owns
DROP PROCEDURE IF EXISTS pkg_user_get_org_id;
DELIMITER //
CREATE PROCEDURE pkg_user_get_org_id(
    IN  p_user_id INT,
    OUT p_org_id  INT
)
BEGIN
    DECLARE EXIT HANDLER FOR NOT FOUND
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20020,
            MESSAGE_TEXT = 'No organisation found for this user.';

    SELECT org_id INTO p_org_id FROM ORGANISATIONS WHERE user_id = p_user_id;
END //
DELIMITER ;

-- VIEW_PENDING_ORGANISATIONS: admin screen
DROP PROCEDURE IF EXISTS pkg_user_view_pending_organisations;
DELIMITER //
CREATE PROCEDURE pkg_user_view_pending_organisations()
BEGIN
    SELECT o.org_id, u.username, o.org_name, o.org_type, o.city
    FROM ORGANISATIONS o
    JOIN USERS u ON o.user_id = u.user_id
    WHERE o.verification_status = 'PENDING'
    ORDER BY o.org_id;
END //
DELIMITER ;