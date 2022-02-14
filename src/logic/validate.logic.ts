export class Validate {
    //валидация дат начала и конца бронирования
    async validateDate(connection: any, dateStart: Date, dateEnd: Date): Promise<boolean> {
        //получаем длительность бронирования в днях
        const difference = (dateEnd.getTime() - dateStart.getTime()) / (1000 * 3600 * 24);
        //дата окончания меньше даты начала?
        if (difference < 0) {
            return false;
        }
        try {
            //получаем максимальный срок бронирования из таблицы настроек
            const maxBookingDaysResponse = await connection.query(
                'SELECT max_booking_days FROM settings WHERE max_booking_days IS NOT NULL'
            );
            const maxBookingDays = maxBookingDaysResponse.rows[0].max_booking_days;
            //длительность бронирования больше максимального срока?
            if ((difference + 1) > maxBookingDays) {
                return false;
            }
            //получаем дни недели, когда бронирование не может быть начато или завершено
            const excludedBookingDaysResponse = await connection.query(
                'SELECT excluded_booking_days FROM settings'
            );
            const excludedBookingDays = excludedBookingDaysResponse.rows;
            //попадают ли даты начала и конца бронирования в исключённые дни недели?
            let decision = true;
            excludedBookingDays.forEach((excludedBookingDay) => {
                if (excludedBookingDay === dateEnd.getDay() || excludedBookingDay === dateStart.getDay()) {
                    decision = false;
                }
            });
            return decision;
        } catch (error) {
            return false
        }
    }
    //проверка наличия такого Id машины в таблице машин
    async validateCarId(connection: any, carId: number): Promise<boolean> {
        let decision = true;
        try {
            //выбираем id машин из таблицы cars, которые равны carId
            const isCarIdinCarsResponse = await connection.query(
                `SELECT id FROM cars WHERE id = ${carId}`
            );
            const isCarIdinCars = isCarIdinCarsResponse.rows;
            //есть ли carId в списке?
            if (isCarIdinCars.length === 0) {
                decision = false;
            };
            return decision;
        } catch (error) {
            return false
        }
    }
}
