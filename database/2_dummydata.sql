-- USERS
INSERT INTO USERS (user_id, username, password, role)
VALUES (1, 'admin1', 'admin123', 'ADMIN');

INSERT INTO USERS (user_id, username, password, role)
VALUES (2, 'requester1', 'user123', 'REQUESTER');

INSERT INTO USERS (user_id, username, password, role)
VALUES (3, 'requester2', 'user123', 'REQUESTER');

INSERT INTO USERS (user_id, username, password, role)
VALUES (4, 'ngo1', 'ngo123', 'ORGANISATION');

INSERT INTO USERS (user_id, username, password, role)
VALUES (5, 'hospital1', 'hospital123', 'ORGANISATION');

INSERT INTO USERS (user_id, username, password, role)
VALUES (6, 'ngo2', 'ngo123', 'ORGANISATION');


-- ORGANISATIONS
INSERT INTO ORGANISATIONS
(org_id, user_id, org_name, org_type, city, verification_status)
VALUES (1, 4, 'Helping Hands NGO', 'NGO', 'Chandigarh', 'APPROVED');

INSERT INTO ORGANISATIONS
(org_id, user_id, org_name, org_type, city, verification_status)
VALUES (2, 5, 'City Care Hospital', 'HOSPITAL', 'Mohali', 'APPROVED');

INSERT INTO ORGANISATIONS
(org_id, user_id, org_name, org_type, city, verification_status)
VALUES (3, 6, 'Life Saver Foundation', 'NGO', 'Ludhiana', 'PENDING');


-- BLOOD GROUPS
INSERT INTO BLOOD_GROUPS (blood_group_id, blood_group_name)
VALUES (1, 'A+');

INSERT INTO BLOOD_GROUPS (blood_group_id, blood_group_name)
VALUES (2, 'A-');

INSERT INTO BLOOD_GROUPS (blood_group_id, blood_group_name)
VALUES (3, 'B+');

INSERT INTO BLOOD_GROUPS (blood_group_id, blood_group_name)
VALUES (4, 'B-');

INSERT INTO BLOOD_GROUPS (blood_group_id, blood_group_name)
VALUES (5, 'AB+');

INSERT INTO BLOOD_GROUPS (blood_group_id, blood_group_name)
VALUES (6, 'AB-');

INSERT INTO BLOOD_GROUPS (blood_group_id, blood_group_name)
VALUES (7, 'O+');

INSERT INTO BLOOD_GROUPS (blood_group_id, blood_group_name)
VALUES (8, 'O-');


-- INVENTORY
INSERT INTO INVENTORY
(inventory_id, org_id, blood_group_id, units_available)
VALUES (1, 1, 1, 10);

INSERT INTO INVENTORY
(inventory_id, org_id, blood_group_id, units_available)
VALUES (2, 1, 3, 8);

INSERT INTO INVENTORY
(inventory_id, org_id, blood_group_id, units_available)
VALUES (3, 1, 7, 15);

INSERT INTO INVENTORY
(inventory_id, org_id, blood_group_id, units_available)
VALUES (4, 2, 1, 5);

INSERT INTO INVENTORY
(inventory_id, org_id, blood_group_id, units_available)
VALUES (5, 2, 5, 7);

INSERT INTO INVENTORY
(inventory_id, org_id, blood_group_id, units_available)
VALUES (6, 2, 7, 12);

INSERT INTO INVENTORY
(inventory_id, org_id, blood_group_id, units_available)
VALUES (7, 3, 3, 6);

INSERT INTO INVENTORY
(inventory_id, org_id, blood_group_id, units_available)
VALUES (8, 3, 8, 4);


-- BLOOD REQUESTS
INSERT INTO BLOOD_REQUESTS
(request_id, requester_id, blood_group_id, units_required, city, urgency, request_status)
VALUES (1, 2, 1, 4, 'Chandigarh', 'URGENT', 'OPEN');

INSERT INTO BLOOD_REQUESTS
(request_id, requester_id, blood_group_id, units_required, city, urgency, request_status)
VALUES (2, 3, 3, 10, 'Ludhiana', 'NORMAL', 'OPEN');


-- REQUEST RESPONSES
INSERT INTO REQUEST_RESPONSES
(response_id, request_id, org_id, units_offered, response_status, message)
VALUES (1, 1, 1, 4, 'ACCEPTED', 'We can provide 4 units.');

INSERT INTO REQUEST_RESPONSES
(response_id, request_id, org_id, units_offered, response_status, message)
VALUES (2, 2, 3, 6, 'PARTIAL', 'We can provide 6 units.');

COMMIT;