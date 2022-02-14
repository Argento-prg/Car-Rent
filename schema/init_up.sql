--Car Table
CREATE TABLE cars (
    id SERIAL,
    license_plate VARCHAR(20),
    PRIMARY KEY (id)
);

--Booking Table
CREATE TABLE booking (
    id SERIAL,
    date_start DATE,
    date_end DATE,
    price INT,
    car_id INT,
    FOREIGN KEY (car_id) REFERENCES cars (id)
);

--Tariff Table
CREATE TABLE tariff (
    min_days INT,
    discount INT
);

--Settings Table
CREATE TABLE settings (
    max_booking_days INT,
    booking_interval INT,
    excluded_booking_days INT,
    base_price INT
);


