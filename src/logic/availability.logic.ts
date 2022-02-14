export class Availability {
    //проверить доступность машины для бронирования
    async checkAvailabilityCar(connection: any, date_start: Date, date_end: Date, carId: number): Promise<boolean> {
        const dateStart = new Date(date_start);
        const dateEnd = new Date(date_end)
        try {
            //получаем интервал между бронированиями
            const intervalResponse = await connection.query(
                'SELECT booking_interval FROM settings WHERE booking_interval IS NOT NULL'
            );
            const interval = intervalResponse.rows[0].booking_interval;
            //учитываем интервал в датах
            dateStart.setDate(dateStart.getDate() - interval);
            dateEnd.setDate(dateEnd.getDate() + interval);
            //получаем пересечения временных интервалов бронирования
            const datesResponse = await connection.query(
                `SELECT date_start, date_end FROM booking WHERE car_id = ${carId}`
            );
            const dates = datesResponse.rows;
            //проверка пересечений интервалов
            let isCollision = true;
            dates.forEach((date) => {
                const leftCondition = (dateStart.getTime() - date.date_end.getTime()) > 0;
                const rightCondition = (dateEnd.getTime() - date.date_start.getTime()) < 0;
                if (!(leftCondition || rightCondition)) {
                    isCollision = false;
                }
            });
            return isCollision;
        } catch (error) {
            return false
        }
    }
}
