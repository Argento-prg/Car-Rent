import { DatesDto } from './dto/repository/dates-repository-dto';
import { TariffDto } from './dto/repository/tariff-repository-dto';
import { CarsDto } from './dto/repository/cars-repository-dto';

export class Repository {
    constructor(private conn: any) { }
    //получаем интервал времени между бронированиями из таблицы настроек
    async getSettingsInterval(): Promise<number> {
        const intervalResponse = await this.conn.query(
            'SELECT booking_interval FROM settings WHERE booking_interval IS NOT NULL'
        );
        const interval = intervalResponse.rows[0].booking_interval;
        return interval
    }
    //получаем даты бронирования по id машины
    async getDatesByCarId(carId: number): Promise<DatesDto[]> {
        const datesResponse = await this.conn.query(
            `SELECT date_start, date_end FROM booking WHERE car_id = ${carId} ORDER BY date_start`
        );
        const datesRows = datesResponse.rows;
        const dates: DatesDto[] = []
        datesRows.forEach((dateRow) => {
            dates.push(new DatesDto(
                dateRow.date_start,
                dateRow.date_end
            ))
        })
        return dates
    }
    //получаем базовую стоимость бронирования из таблицы настроек
    async getSettingsBasePrice(): Promise<number> {
        const baseResponse = await this.conn.query(
            'SELECT base_price FROM settings WHERE base_price IS NOT NULL'
        );
        const base_price = baseResponse.rows[0].base_price;
        return base_price
    }
    //получаем тарифы бронирования
    async getTariff(): Promise<TariffDto[]> {
        const tariffResponse = await this.conn.query(
            'SELECT min_days, discount FROM tariff'
        );
        const tariffRows = tariffResponse.rows;
        const tariff: TariffDto[] = []
        tariffRows.forEach((tariffRow) => {
            tariff.push(new TariffDto(
                tariffRow.min_days,
                tariffRow.discount
            ))
        })
        return tariff
    }
    //получаем список всех машин
    async getAllCars(): Promise<CarsDto[]> {
        const carsResponse = await this.conn.query(
            'SELECT id, license_plate FROM cars'
        );
        const carsRows = carsResponse.rows;
        const cars: CarsDto[] = []
        carsRows.forEach((carsRow) => {
            cars.push(new CarsDto(
                carsRow.id,
                carsRow.license_plate
            ))
        })
        return cars
    }
    //получаем максимальную длительность бронирования из таблицы настроек
    async getSettingsMaxBookingDays(): Promise<number> {
        const maxBookingDaysResponse = await this.conn.query(
            'SELECT max_booking_days FROM settings WHERE max_booking_days IS NOT NULL'
        );
        const maxBookingDays = maxBookingDaysResponse.rows[0].max_booking_days;
        return maxBookingDays
    }
    //получаем исключённые дни бронирования из таблицы настроек
    async getSettingsExcludedBookingDays(): Promise<number[]> {
        const excludedBookingDaysResponse = await this.conn.query(
            'SELECT excluded_booking_days FROM settings'
        );
        const excludedBookingDaysRows = excludedBookingDaysResponse.rows;
        const excludedBookingDays: number[] = []
        excludedBookingDaysRows.forEach((excludedBookingDaysRow) => {
            excludedBookingDays.push(excludedBookingDaysRow.excluded_booking_days)
        })
        return excludedBookingDays
    }
    //получаем число машин, соответствующих id машины
    async getCountCarById(carId: number): Promise<number> {
        const isCarIdinCarsResponse = await this.conn.query(
            `SELECT id FROM cars WHERE id = ${carId}`
        );
        const isCarIdinCars = isCarIdinCarsResponse.rows;
        return isCarIdinCars.length
    }
    //создание записи бронирования
    async createBooking(dateStart: Date, dateEnd: Date, price: number, carId: number): Promise<boolean> {
        let status = true
        try {
            await this.conn.query(
                `INSERT INTO booking (date_start, date_end, price, car_id) 
                VALUES (
                    \'${dateStart.toDateString()}\',
                    \'${dateEnd.toDateString()}}\',
                    ${price},
                    ${carId}
                )`
            )
        } catch (error) {
            status = false
        }
        return status
    }
}