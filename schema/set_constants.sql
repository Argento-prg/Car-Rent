--fill cars
INSERT INTO cars (license_plate) 
VALUES 
        ('e102ch'),
        ('b170mm'),
        ('c423co'),
        ('x777xx'),
        ('h283tx');
--fill tariff
INSERT INTO tariff (min_days, discount)
VALUES
        (1, 0),
        (5, 5),
        (10, 10),
        (18, 15);
--fill settings
INSERT INTO settings (max_booking_days, booking_interval, excluded_booking_days, base_price)
VALUES
        (30, 3, 6, 1000),
        (null, null, 0, null);
