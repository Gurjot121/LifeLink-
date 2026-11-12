-- Package specification
CREATE OR REPLACE PACKAGE PKG_USER AS

    PROCEDURE REGISTER_USER (
        p_username IN VARCHAR2,
        p_password IN VARCHAR2,
        p_role IN VARCHAR2,
        p_user_id OUT NUMBER
    );

    PROCEDURE LOGIN_USER (
        p_username IN VARCHAR2,
        p_password IN VARCHAR2,
        p_user_id OUT NUMBER,
        p_role OUT VARCHAR2
    );

END PKG_USER;
/

-- Package body
CREATE OR REPLACE PACKAGE BODY PKG_USER AS

    PROCEDURE REGISTER_USER (
        p_username IN VARCHAR2,
        p_password IN VARCHAR2,
        p_role IN VARCHAR2,
        p_user_id OUT NUMBER
    )
    IS
    BEGIN
        INSERT INTO USERS (username, password, role)
        VALUES (p_username, p_password, p_role)
        RETURNING user_id INTO p_user_id;
    END REGISTER_USER;


    PROCEDURE LOGIN_USER (
        p_username IN VARCHAR2,
        p_password IN VARCHAR2,
        p_user_id OUT NUMBER,
        p_role OUT VARCHAR2
    )
    IS
    BEGIN
        SELECT user_id, role
        INTO p_user_id, p_role
        FROM USERS
        WHERE username = p_username
        AND password = p_password;
    END LOGIN_USER;

END PKG_USER;
/