-- Package specification
CREATE OR REPLACE PACKAGE PKG_BLOOD AS

    PROCEDURE CHECK_STOCK (
        p_org_id IN NUMBER,
        p_blood_group_id IN NUMBER,
        p_units_available OUT NUMBER
    );

    PROCEDURE UPDATE_STOCK (
        p_org_id IN NUMBER,
        p_blood_group_id IN NUMBER,
        p_new_units IN NUMBER
    );

    PROCEDURE REDUCE_STOCK (
        p_org_id IN NUMBER,
        p_blood_group_id IN NUMBER,
        p_units_to_reduce IN NUMBER
    );

END PKG_BLOOD;
/

-- Package body
CREATE OR REPLACE PACKAGE BODY PKG_BLOOD AS

    PROCEDURE CHECK_STOCK (
        p_org_id IN NUMBER,
        p_blood_group_id IN NUMBER,
        p_units_available OUT NUMBER
    )
    IS
    BEGIN
        SELECT units_available
        INTO p_units_available
        FROM INVENTORY
        WHERE org_id = p_org_id
        AND blood_group_id = p_blood_group_id;
    END CHECK_STOCK;


    PROCEDURE UPDATE_STOCK (
        p_org_id IN NUMBER,
        p_blood_group_id IN NUMBER,
        p_new_units IN NUMBER
    )
    IS
    BEGIN
        UPDATE INVENTORY
        SET units_available = p_new_units,
            last_updated = CURRENT_TIMESTAMP
        WHERE org_id = p_org_id
        AND blood_group_id = p_blood_group_id;

        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20001, 'Inventory record not found.');
        END IF;
    END UPDATE_STOCK;


    PROCEDURE REDUCE_STOCK (
        p_org_id IN NUMBER,
        p_blood_group_id IN NUMBER,
        p_units_to_reduce IN NUMBER
    )
    IS
    BEGIN
        UPDATE INVENTORY
        SET units_available = units_available - p_units_to_reduce,
            last_updated = CURRENT_TIMESTAMP
        WHERE org_id = p_org_id
        AND blood_group_id = p_blood_group_id
        AND units_available >= p_units_to_reduce;

        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20002, 'Insufficient stock or inventory record not found.');
        END IF;
    END REDUCE_STOCK;

END PKG_BLOOD;
/