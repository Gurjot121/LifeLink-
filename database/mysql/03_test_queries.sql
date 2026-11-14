USE lifelink;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE REQUEST_RESPONSES;
TRUNCATE TABLE BLOOD_REQUESTS;
TRUNCATE TABLE INVENTORY;
TRUNCATE TABLE BLOOD_GROUPS;
TRUNCATE TABLE ORGANISATIONS;
TRUNCATE TABLE USERS;
SET FOREIGN_KEY_CHECKS = 1;

USE lifelink;

CALL pkg_user_register_user('newuser', 'pass123', 'REQUESTER', @uid);
SELECT @uid AS new_user_id;                         -- expect 7

CALL pkg_user_login_user('newuser', 'pass123', @uid, @role);
SELECT @uid AS user_id, @role AS role;              -- expect 7, REQUESTER

CALL pkg_user_verify_organisation(3, 'APPROVED');
SELECT org_id, org_name, verification_status
FROM ORGANISATIONS WHERE org_id = 3;                -- expect APPROVED

USE lifelink;

CALL pkg_blood_check_stock(1, 1, @u);
SELECT @u AS units;                                 -- expect 10

CALL pkg_blood_update_stock(1, 1, 12);
CALL pkg_blood_check_stock(1, 1, @u);
SELECT @u AS units;                                 -- expect 12

CALL pkg_blood_reduce_stock(1, 1, 2);
CALL pkg_blood_check_stock(1, 1, @u);
SELECT @u AS units;                                 -- expect 10

CALL pkg_blood_search_blood('A+', 'Chandigarh');    -- expect Helping Hands NGO, 10

USE lifelink;

CALL pkg_request_create_request(3, 7, 2, 'Mohali', 'URGENT', @rid);
SELECT @rid AS request_id;                          -- expect 3

CALL pkg_request_view_requests(2);                  -- expect request 3 (Mohali)
CALL pkg_request_view_requests(1);                  -- expect request 1 (Chandigarh)

CALL pkg_request_respond_to_request(@rid, 2, 2, 'ACCEPTED', 'Ready to give 2 units');
CALL pkg_request_respond_to_request(@rid, 2, 1, 'PARTIAL', 'Only 1 unit left');
SELECT * FROM REQUEST_RESPONSES WHERE request_id = @rid;
                                                    -- expect ONE row: PARTIAL, 1 unit

CALL pkg_request_update_request_status(@rid, 'MATCHED');
SELECT request_id, request_status
FROM BLOOD_REQUESTS WHERE request_id = @rid;        -- expect MATCHED

CALL pkg_request_view_requests(2);                  -- expect empty (request 3 no longer OPEN)

USE lifelink;

CALL pkg_user_register_user('ngo3', 'ngo123', 'ORGANISATION', @uid);
SELECT @uid AS new_user_id;                         -- 8 or higher (failed inserts use up IDs)

CALL pkg_user_register_organisation(@uid, 'Red Drop NGO', 'NGO', 'Ludhiana', @oid);
SELECT @oid AS new_org_id;                          -- 4 or higher

CALL pkg_user_get_org_id(@uid, @found);
SELECT @found AS org_id;                            -- same as @oid

CALL pkg_user_view_pending_organisations();         -- expect Red Drop NGO listed

CALL pkg_user_verify_organisation(@oid, 'APPROVED');
CALL pkg_user_view_pending_organisations();         -- expect Red Drop NGO gone

USE lifelink;

CALL pkg_blood_list_blood_groups();                 -- 8 rows, A+ to O-
CALL pkg_blood_add_stock(1, 2, 5);                  -- org 1 has no A- row: creates it with 5
CALL pkg_blood_add_stock(1, 2, 3);                  -- adds to existing row
CALL pkg_blood_view_inventory(1);                   -- expect A+ 10, A- 8, B+ 8, O+ 15

USE lifelink;

CALL pkg_request_view_my_requests(2);               -- expect request 1, OPEN
CALL pkg_request_view_responses(1);                 -- expect response 1, ACCEPTED, 4 units

CALL pkg_request_select_response(1, 1);
SELECT request_id, request_status, selected_response_id
FROM BLOOD_REQUESTS WHERE request_id = 1;           -- expect MATCHED, 1

CALL pkg_request_complete_request(1);
SELECT request_status FROM BLOOD_REQUESTS WHERE request_id = 1;   -- expect FULFILLED
SELECT response_status FROM REQUEST_RESPONSES WHERE response_id = 1;   -- expect COMPLETED
CALL pkg_blood_check_stock(1, 1, @u);
SELECT @u AS units;                                 -- expect 6 (10 minus 4)