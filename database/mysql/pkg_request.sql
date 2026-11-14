USE lifelink;

-- Remove the procedures from my earlier guess (they are replaced by your group's design)
DROP PROCEDURE IF EXISTS create_request;
DROP PROCEDURE IF EXISTS respond_to_request;
DROP PROCEDURE IF EXISTS select_response;
DROP PROCEDURE IF EXISTS complete_request;
DROP PROCEDURE IF EXISTS cancel_request;
DROP PROCEDURE IF EXISTS get_open_requests;

-- CREATE_REQUEST
DROP PROCEDURE IF EXISTS pkg_request_create_request;
DELIMITER //
CREATE PROCEDURE pkg_request_create_request(
    IN  p_requester_id   INT,
    IN  p_blood_group_id INT,
    IN  p_units_required INT,
    IN  p_city           VARCHAR(50),
    IN  p_urgency        VARCHAR(20),
    OUT p_request_id     INT
)
BEGIN
    DECLARE EXIT HANDLER FOR 1452
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20006,
            MESSAGE_TEXT = 'Invalid requester or blood group.';
    DECLARE EXIT HANDLER FOR 3819
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20007,
            MESSAGE_TEXT = 'Invalid units or urgency value.';

    INSERT INTO BLOOD_REQUESTS (requester_id, blood_group_id, units_required, city, urgency)
    VALUES (p_requester_id, p_blood_group_id, p_units_required, p_city, p_urgency);

    SET p_request_id = LAST_INSERT_ID();
END //
DELIMITER ;

-- VIEW_REQUESTS (open requests in the organisation's city)
-- Oracle returned a SYS_REFCURSOR; MySQL simply returns the result set.
DROP PROCEDURE IF EXISTS pkg_request_view_requests;
DELIMITER //
CREATE PROCEDURE pkg_request_view_requests(
    IN p_org_id INT
)
BEGIN
    SELECT r.request_id,
           r.blood_group_id,
           b.blood_group_name,
           r.units_required,
           r.city,
           r.urgency,
           r.request_status
    FROM BLOOD_REQUESTS r
    JOIN BLOOD_GROUPS b ON r.blood_group_id = b.blood_group_id
    WHERE r.city = (SELECT city FROM ORGANISATIONS WHERE org_id = p_org_id)
      AND r.request_status = 'OPEN';
END //
DELIMITER ;

-- RESPOND_TO_REQUEST (insert a response, or update it if the org already responded)
DROP PROCEDURE IF EXISTS pkg_request_respond_to_request;
DELIMITER //
CREATE PROCEDURE pkg_request_respond_to_request(
    IN p_request_id      INT,
    IN p_org_id          INT,
    IN p_units_offered   INT,
    IN p_response_status VARCHAR(20),
    IN p_message         VARCHAR(255)
)
BEGIN
    DECLARE v_count      INT;
    DECLARE v_req_status VARCHAR(20);
    DECLARE v_req_bg     INT;
    DECLARE v_org_status VARCHAR(20);
    DECLARE v_stock      INT DEFAULT 0;
    DECLARE v_units      INT;
    DECLARE EXIT HANDLER FOR 1452
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20008,
            MESSAGE_TEXT = 'Invalid request or organisation.';
    DECLARE EXIT HANDLER FOR 3819
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20009,
            MESSAGE_TEXT = 'Invalid units or response status.';

    IF p_response_status NOT IN ('ACCEPTED', 'PARTIAL', 'DECLINED')
       OR (p_response_status <> 'DECLINED' AND p_units_offered <= 0) THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20009,
            MESSAGE_TEXT = 'Invalid units or response status.';
    END IF;

    SET v_req_status = (SELECT request_status  FROM BLOOD_REQUESTS WHERE request_id = p_request_id);
    SET v_req_bg     = (SELECT blood_group_id  FROM BLOOD_REQUESTS WHERE request_id = p_request_id);
    SET v_org_status = (SELECT verification_status FROM ORGANISATIONS WHERE org_id = p_org_id);

    IF v_req_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20023,
            MESSAGE_TEXT = 'Request not found.';
    ELSEIF v_org_status IS NULL OR v_org_status <> 'APPROVED' THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20024,
            MESSAGE_TEXT = 'Organisation is not approved.';
    ELSEIF v_req_status <> 'OPEN' THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20025,
            MESSAGE_TEXT = 'Request is no longer open.';
    END IF;

    IF p_response_status = 'DECLINED' THEN
        SET v_units = 0;
    ELSE
        SET v_units = p_units_offered;
        SET v_stock = COALESCE((SELECT units_available FROM INVENTORY
                                WHERE org_id = p_org_id AND blood_group_id = v_req_bg), 0);
        IF v_units > v_stock THEN
            SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20026,
                MESSAGE_TEXT = 'Units offered exceed available stock.';
        END IF;
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM REQUEST_RESPONSES
    WHERE request_id = p_request_id AND org_id = p_org_id;

    IF v_count = 0 THEN
        INSERT INTO REQUEST_RESPONSES (request_id, org_id, units_offered, response_status, message)
        VALUES (p_request_id, p_org_id, v_units, p_response_status, p_message);
    ELSE
        UPDATE REQUEST_RESPONSES
        SET units_offered = v_units, response_status = p_response_status, message = p_message
        WHERE request_id = p_request_id AND org_id = p_org_id;
    END IF;
END //
DELIMITER ;

-- UPDATE_REQUEST_STATUS
DROP PROCEDURE IF EXISTS pkg_request_update_request_status;
DELIMITER //
CREATE PROCEDURE pkg_request_update_request_status(
    IN p_request_id INT,
    IN p_new_status VARCHAR(20)
)
BEGIN
    DECLARE v_count INT;
    DECLARE EXIT HANDLER FOR 3819
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20010,
            MESSAGE_TEXT = 'Invalid request status.';

    SELECT COUNT(*) INTO v_count FROM BLOOD_REQUESTS WHERE request_id = p_request_id;

    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20003,
            MESSAGE_TEXT = 'Request not found.';
    END IF;

    UPDATE BLOOD_REQUESTS
    SET request_status = p_new_status
    WHERE request_id = p_request_id;
END //
DELIMITER ;

-- VIEW_MY_REQUESTS: requester's own requests
DROP PROCEDURE IF EXISTS pkg_request_view_my_requests;
DELIMITER //
CREATE PROCEDURE pkg_request_view_my_requests(IN p_requester_id INT)
BEGIN
    SELECT r.request_id, b.blood_group_name, r.units_required, r.city,
           r.urgency, r.request_status, r.selected_response_id
    FROM BLOOD_REQUESTS r
    JOIN BLOOD_GROUPS b ON r.blood_group_id = b.blood_group_id
    WHERE r.requester_id = p_requester_id
    ORDER BY r.request_id DESC;
END //
DELIMITER ;

-- VIEW_RESPONSES: all responses to one request
DROP PROCEDURE IF EXISTS pkg_request_view_responses;
DELIMITER //
CREATE PROCEDURE pkg_request_view_responses(IN p_request_id INT)
BEGIN
    SELECT rr.response_id, rr.org_id, o.org_name, o.org_type, o.city,
           rr.units_offered, rr.response_status, rr.message
    FROM REQUEST_RESPONSES rr
    JOIN ORGANISATIONS o ON rr.org_id = o.org_id
    WHERE rr.request_id = p_request_id
    ORDER BY rr.response_id;
END //
DELIMITER ;

-- SELECT_RESPONSE: requester picks one accepted/partial response
DROP PROCEDURE IF EXISTS pkg_request_select_response;
DELIMITER //
CREATE PROCEDURE pkg_request_select_response(
    IN p_request_id  INT,
    IN p_response_id INT
)
BEGIN
    DECLARE v_req_status  VARCHAR(20);
    DECLARE v_resp_status VARCHAR(20);
    DECLARE EXIT HANDLER FOR NOT FOUND
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20027,
            MESSAGE_TEXT = 'Request or response not found.';
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN ROLLBACK; RESIGNAL; END;

    SELECT request_status INTO v_req_status
    FROM BLOOD_REQUESTS WHERE request_id = p_request_id;

    SELECT response_status INTO v_resp_status
    FROM REQUEST_RESPONSES
    WHERE response_id = p_response_id AND request_id = p_request_id;

    IF v_req_status <> 'OPEN' THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20028,
            MESSAGE_TEXT = 'Request is not open.';
    ELSEIF v_resp_status NOT IN ('ACCEPTED', 'PARTIAL') THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20029,
            MESSAGE_TEXT = 'Only accepted or partial responses can be selected.';
    END IF;

    START TRANSACTION;
    UPDATE REQUEST_RESPONSES SET response_status = 'SELECTED'
    WHERE response_id = p_response_id;
    UPDATE BLOOD_REQUESTS
    SET selected_response_id = p_response_id, request_status = 'MATCHED'
    WHERE request_id = p_request_id;
    COMMIT;
END //
DELIMITER ;

-- COMPLETE_REQUEST: blood handed over -> reduce stock, close request (one transaction)
DROP PROCEDURE IF EXISTS pkg_request_complete_request;
DELIMITER //
CREATE PROCEDURE pkg_request_complete_request(IN p_response_id INT)
BEGIN
    DECLARE v_request_id INT;
    DECLARE v_org_id     INT;
    DECLARE v_units      INT;
    DECLARE v_bg         INT;
    DECLARE EXIT HANDLER FOR NOT FOUND
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 20030,
            MESSAGE_TEXT = 'No selected response found with this id.';
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN ROLLBACK; RESIGNAL; END;

    SELECT rr.request_id, rr.org_id, rr.units_offered, br.blood_group_id
    INTO v_request_id, v_org_id, v_units, v_bg
    FROM REQUEST_RESPONSES rr
    JOIN BLOOD_REQUESTS br ON rr.request_id = br.request_id
    WHERE rr.response_id = p_response_id AND rr.response_status = 'SELECTED';

    START TRANSACTION;
    CALL pkg_blood_reduce_stock(v_org_id, v_bg, v_units);
    UPDATE REQUEST_RESPONSES SET response_status = 'COMPLETED'
    WHERE response_id = p_response_id;
    UPDATE BLOOD_REQUESTS SET request_status = 'FULFILLED'
    WHERE request_id = v_request_id;
    COMMIT;
END //
DELIMITER ;