CREATE DATABASE IF NOT EXISTS lifelink;
USE lifelink;

-- USERS table
CREATE TABLE USERS (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    CHECK (role IN ('ADMIN', 'REQUESTER', 'ORGANISATION'))
);

-- ORGANISATIONS table
CREATE TABLE ORGANISATIONS (
    org_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    org_name VARCHAR(100) NOT NULL,
    org_type VARCHAR(20) NOT NULL,
    city VARCHAR(50) NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    CHECK (org_type IN ('NGO', 'HOSPITAL')),
    CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- BLOOD_GROUPS table
CREATE TABLE BLOOD_GROUPS (
    blood_group_id INT AUTO_INCREMENT PRIMARY KEY,
    blood_group_name VARCHAR(5) NOT NULL UNIQUE
);

-- INVENTORY table
CREATE TABLE INVENTORY (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    blood_group_id INT NOT NULL,
    units_available INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES ORGANISATIONS(org_id),
    FOREIGN KEY (blood_group_id) REFERENCES BLOOD_GROUPS(blood_group_id),
    UNIQUE (org_id, blood_group_id),
    CHECK (units_available >= 0)
);

-- BLOOD_REQUESTS table
CREATE TABLE BLOOD_REQUESTS (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    blood_group_id INT NOT NULL,
    units_required INT NOT NULL,
    city VARCHAR(50) NOT NULL,
    urgency VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    request_status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    selected_response_id INT,
    FOREIGN KEY (requester_id) REFERENCES USERS(user_id),
    FOREIGN KEY (blood_group_id) REFERENCES BLOOD_GROUPS(blood_group_id),
    CHECK (units_required > 0),
    CHECK (urgency IN ('NORMAL', 'URGENT', 'EMERGENCY')),
    CHECK (request_status IN ('OPEN', 'MATCHED', 'IN_PROGRESS', 'FULFILLED', 'CANCELLED'))
);

-- REQUEST_RESPONSES table
CREATE TABLE REQUEST_RESPONSES (
    response_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    org_id INT NOT NULL,
    units_offered INT NOT NULL DEFAULT 0,
    response_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    message VARCHAR(255),
    FOREIGN KEY (request_id) REFERENCES BLOOD_REQUESTS(request_id),
    FOREIGN KEY (org_id) REFERENCES ORGANISATIONS(org_id),
    UNIQUE (request_id, org_id),
    CHECK (units_offered >= 0),
    CHECK (response_status IN ('PENDING', 'ACCEPTED', 'PARTIAL', 'DECLINED', 'SELECTED', 'COMPLETED'))
);

-- Adding the selected response relationship
ALTER TABLE BLOOD_REQUESTS
ADD FOREIGN KEY (selected_response_id)
REFERENCES REQUEST_RESPONSES(response_id);