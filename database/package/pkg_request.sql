-- Package specification
CREATE OR REPLACE PACKAGE PKG_REQUEST AS

    PROCEDURE CREATE_REQUEST (
        p_requester_id IN NUMBER,
        p_blood_group_id IN NUMBER,
        p_units_required IN NUMBER,
        p_city IN VARCHAR2,
        p_urgency IN VARCHAR2,
        p_request_id OUT NUMBER
    );

    PROCEDURE VIEW_REQUESTS (
        p_org_id IN NUMBER,
        p_requests OUT SYS_REFCURSOR
    );

    PROCEDURE RESPOND_TO_REQUEST (
        p_request_id IN NUMBER,
        p_org_id IN NUMBER,
        p_units_offered IN NUMBER,
        p_response_status IN VARCHAR2,
        p_message IN VARCHAR2
    );

    PROCEDURE UPDATE_REQUEST_STATUS (
        p_request_id IN NUMBER,
        p_new_status IN VARCHAR2
    );

END PKG_REQUEST;
/

-- Package body
CREATE OR REPLACE PACKAGE BODY PKG_REQUEST AS

    PROCEDURE CREATE_REQUEST (
        p_requester_id IN NUMBER,
        p_blood_group_id IN NUMBER,
        p_units_required IN NUMBER,
        p_city IN VARCHAR2,
        p_urgency IN VARCHAR2,
        p_request_id OUT NUMBER
    )
    IS
    BEGIN
        INSERT INTO BLOOD_REQUESTS (
            requester_id,
            blood_group_id,
            units_required,
            city,
            urgency
        )
        VALUES (
            p_requester_id,
            p_blood_group_id,
            p_units_required,
            p_city,
            p_urgency
        )
        RETURNING request_id INTO p_request_id;
    END CREATE_REQUEST;


    PROCEDURE VIEW_REQUESTS (
        p_org_id IN NUMBER,
        p_requests OUT SYS_REFCURSOR
    )
    IS
    BEGIN
        OPEN p_requests FOR
            SELECT
                r.request_id,
                r.blood_group_id,
                b.blood_group_name,
                r.units_required,
                r.city,
                r.urgency,
                r.request_status
            FROM BLOOD_REQUESTS r
            JOIN BLOOD_GROUPS b
                ON r.blood_group_id = b.blood_group_id
            WHERE r.city = (
                SELECT city
                FROM ORGANISATIONS
                WHERE org_id = p_org_id
            )
            AND r.request_status = 'OPEN';
    END VIEW_REQUESTS;


    PROCEDURE RESPOND_TO_REQUEST (
        p_request_id IN NUMBER,
        p_org_id IN NUMBER,
        p_units_offered IN NUMBER,
        p_response_status IN VARCHAR2,
        p_message IN VARCHAR2
    )
    IS
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
        FROM REQUEST_RESPONSES
        WHERE request_id = p_request_id
        AND org_id = p_org_id;

        IF v_count = 0 THEN
            INSERT INTO REQUEST_RESPONSES (
                request_id,
                org_id,
                units_offered,
                response_status,
                message
            )
            VALUES (
                p_request_id,
                p_org_id,
                p_units_offered,
                p_response_status,
                p_message
            );
        ELSE
            UPDATE REQUEST_RESPONSES
            SET units_offered = p_units_offered,
                response_status = p_response_status,
                message = p_message
            WHERE request_id = p_request_id
            AND org_id = p_org_id;
        END IF;
    END RESPOND_TO_REQUEST;


    PROCEDURE UPDATE_REQUEST_STATUS (
        p_request_id IN NUMBER,
        p_new_status IN VARCHAR2
    )
    IS
    BEGIN
        UPDATE BLOOD_REQUESTS
        SET request_status = p_new_status
        WHERE request_id = p_request_id;

        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20003, 'Request not found.');
        END IF;
    END UPDATE_REQUEST_STATUS;

END PKG_REQUEST;
/