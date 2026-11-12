-- 1. Check all six tables

SELECT * FROM USERS;

SELECT * FROM ORGANISATIONS;

SELECT * FROM BLOOD_GROUPS;

SELECT * FROM INVENTORY;

SELECT * FROM BLOOD_REQUESTS;

SELECT * FROM REQUEST_RESPONSES;


-- 2. Check organisation details with login information

SELECT
    u.username,
    o.org_name,
    o.org_type,
    o.city,
    o.verification_status
FROM USERS u
JOIN ORGANISATIONS o
ON u.user_id = o.user_id;


-- 3. Check blood inventory with organisation and blood group

SELECT
    o.org_name,
    o.city,
    b.blood_group_name,
    i.units_available
FROM INVENTORY i
JOIN ORGANISATIONS o
ON i.org_id = o.org_id
JOIN BLOOD_GROUPS b
ON i.blood_group_id = b.blood_group_id;


-- 4. Check blood requests with requester details

SELECT
    r.request_id,
    u.username,
    b.blood_group_name,
    r.units_required,
    r.city,
    r.urgency,
    r.request_status
FROM BLOOD_REQUESTS r
JOIN USERS u
ON r.requester_id = u.user_id
JOIN BLOOD_GROUPS b
ON r.blood_group_id = b.blood_group_id;


-- 5. Check responses received by organisations

SELECT
    rr.response_id,
    rr.request_id,
    o.org_name,
    rr.units_offered,
    rr.response_status,
    rr.message
FROM REQUEST_RESPONSES rr
JOIN ORGANISATIONS o
ON rr.org_id = o.org_id;


-- 6. Test PKG_USER login procedure

DECLARE
    v_user_id NUMBER;
    v_role VARCHAR2(20);
BEGIN
    PKG_USER.LOGIN_USER(
        'admin1',
        'admin123',
        v_user_id,
        v_role
    );

    DBMS_OUTPUT.PUT_LINE('User ID: ' || v_user_id);
    DBMS_OUTPUT.PUT_LINE('Role: ' || v_role);
END;
/


-- 7. Test PKG_BLOOD stock checking procedure

DECLARE
    v_units NUMBER;
BEGIN
    PKG_BLOOD.CHECK_STOCK(
        1,
        1,
        v_units
    );

    DBMS_OUTPUT.PUT_LINE('Available units: ' || v_units);
END;
/