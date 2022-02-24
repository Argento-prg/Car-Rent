import { Inject, Injectable } from '@nestjs/common'
import { PG_CONNECTION } from './db/constants'
import { ReqSchemaDto } from './dto/request/schema-request-dto'
import { ResReportDto } from './dto/response/report-response-dto'
import { ResAvailabilityDto } from './dto/response/availability-response-dto'
import { ResPriceDto } from './dto/response/price-response-dto'
import { ResCreateDto } from './dto/response/create-response-dto'
import { Repository } from './app.repository'

@Injectable()
export class AppService {
    readonly repos: Repository

    constructor(@Inject(PG_CONNECTION) private conn: any) { 
        this.repos = new Repository(conn)
    }
    //проверка дат
    private async validateDate(dateStart: Date, dateEnd: Date): Promise<boolean> {
        //получаем длительность бронирования в днях
        const difference = (dateEnd.getTime() - dateStart.getTime()) / (1000 * 3600 * 24);
        //дата окончания меньше даты начала?
        if (difference < 0) {
            return false
        }
        try {
            //получаем максимальный срок бронирования из таблицы настроек
            const maxBookingDays = await this.repos.getSettingsMaxBookingDays();
            //длительность бронирования больше максимального срока?
            if ((difference + 1) > maxBookingDays) {
                return false
            }
            //получаем дни недели, когда бронирование не может быть начато или завершено
            const excludedBookingDays = await this.repos.getSettingsExcludedBookingDays();
            //попадают ли даты начала и конца бронирования в исключённые дни недели?
            let decision = true
            excludedBookingDays.forEach((excludedBookingDay) => {
                if (excludedBookingDay === dateEnd.getDay() || excludedBookingDay === dateStart.getDay()) {
                    decision = false
                }
            })
            return decision
        } catch (error) {
            return false
        }
    }
    //проверка наличия такого Id машины в таблице машин
    private async validateCarId(carId: number): Promise<boolean> {
        let decision = true
        try {
            //выбираем id машин из таблицы cars, которые равны carId
            const carsCount = await this.repos.getCountCarById(carId)
            //есть ли carId в списке?
            if (carsCount === 0) {
                decision = false
            }
            return decision;
        } catch (error) {
            return false
        }
    }
    //проверить доступность автомобиля в выбранные даты
    private async checkAvailabilityCar(date_start: Date, date_end: Date, carId: number): Promise<boolean> {
        const dateStart = new Date(date_start)
        const dateEnd = new Date(date_end)
        try {
            //получаем интервал между бронированиями
            const interval = await this.repos.getSettingsInterval()
            //учитываем интервал в датах
            dateStart.setDate(dateStart.getDate() - interval)
            dateEnd.setDate(dateEnd.getDate() + interval)
            //получаем пересечения временных интервалов бронирования
            const dates = await this.repos.getDatesByCarId(carId)
            //проверка пересечений интервалов
            let isCollision = true
            dates.forEach((date) => {
                const leftCondition = (dateStart.getTime() - date.start.getTime()) > 0
                const rightCondition = (dateEnd.getTime() - date.end.getTime()) < 0
                if (!(leftCondition || rightCondition)) {
                    isCollision = false
                }
            })
            return isCollision
        } catch (error) {
            return false
        }
    }
    //получить финальную цену бронирования
    private async getFinalPrice(dateStart: Date, dateEnd: Date): Promise<number> {
        //разница в днях (1000*3600*24 - перевод миллисекунд в дни)
        const deltaDate = (dateEnd.getTime() - dateStart.getTime()) / (1000 * 3600 * 24)
        try {
            //получаем базовую цену из таблицы настроек
            const base_price = await this.repos.getSettingsBasePrice()
            //получаем тарифы из таблицы тарифов
            const tariff = await this.repos.getTariff()
            //считаем сумму за период
            let sum = 0;
            for (let i = 1; i <= (deltaDate + 1); i++) {
                let discount = 0
                //выбираем подходящую скидку
                tariff.forEach((tarif) => {
                    if (i >= tarif.min_days) {
                        discount = tarif.discount
                    }
                });
                sum += (base_price * (1 - discount / 100))
            }
            return sum
        } catch (error) {
            return 0
        }
    }

    //получаем количество дней предыдущего месяца
    private daysInMonth(year: number, month: number): number {
        return new Date(year, month, 0).getDate()
    }

    //получить статистику по одной машине
    private async getStatisticbyCarId(carId: number): Promise<number> {
        try {
            //получили даты для машины с id = carId
            const dateInfo = await this.repos.getDatesByCarId(carId)
            //считаем статистику
            //сумма долей по каждому месяцу
            let sum = 0
            //номер последнего месяца (начальное значение -1)
            //чтобы не учитывать один и тот же месяц несколько раз подряд
            let lastMonth = -1
            //число месяцев для усреднения загруженности автомобилей
            let countMonth = 0
            dateInfo.forEach((date) => {
                if (date.start.getMonth() !== date.end.getMonth()) {
                    //если случилось так, что запись была сделана в период с января по март
                    //то есть все шансы пропустить февраль
                    if ((date.end.getMonth() - date.start.getMonth()) === 2) {
                        //число дней в январе
                        const daysJan = this.daysInMonth(date.start.getFullYear(), date.start.getMonth() + 1)
                        //число дней, которые забронированы в январе
                        const janPart =  daysJan - date.start.getDate() + 1
                        //добавляем долю января к сумме
                        sum += (janPart / daysJan)
                        
                        if (date.start.getMonth() !== lastMonth) {
                            countMonth++
                        }
                        //прибавляем февраль
                        sum += 1
                        countMonth++
                        //учитываем долю марта
                        const daysMar = this.daysInMonth(date.end.getFullYear(), date.end.getMonth() + 1);
                        const marPart = date.end.getDate()
                        sum += (marPart / daysMar)
                        countMonth++
                        lastMonth = date.end.getMonth()
                    } else {
                        //начало и конец записи находятся в соседних месяцах
                        //получаем часть предыдущего месяца
                        const prevMonthDays = this.daysInMonth(date.start.getFullYear(), date.start.getMonth() + 1)
                        const prevPart = prevMonthDays - date.start.getDate() + 1
                        sum += (prevPart / prevMonthDays)
                        if (lastMonth !== date.start.getMonth()) {
                            countMonth++
                        }
                        //получаем часть следующего месяца
                        const nextMonthDays = this.daysInMonth(date.end.getFullYear(), date.end.getMonth() + 1)
                        const nextPart = date.end.getDate()
                        sum += (nextPart / nextMonthDays)
                        countMonth++;
                        lastMonth = date.end.getMonth()
                    }
                } else {
                    //самый простой случай, когда начало и конец аренды в одном месяце
                    //считаем число дней аренды
                    const delta = (date.end.getTime() - date.start.getTime()) / (1000 * 3600 * 24) + 1
                    //считаем число дней в месяце
                    const daysOfMonth = this.daysInMonth(date.end.getFullYear(), date.end.getMonth() + 1)
                    //складываем долю этого месяца с общей суммой
                    sum += (delta / daysOfMonth)
                    //если месяц поменялся, то увеличиваем счётчик месяцев
                    if (lastMonth !== date.end.getMonth()) {
                        lastMonth = date.end.getMonth()
                        countMonth++
                    }
                }
                
            })
            const busyness = sum / countMonth * 100

            return busyness
        } catch (error) {
            return 0
        }
    }

    //получаем отчёт по загруженности машины
    async getReport(): Promise<ResReportDto[]> {
        //получаем машины
        const carsInfo = await this.repos.getAllCars();
        //получаем статистику и записываем в отчёт
        const reports: ResReportDto[] = []
        for (let i = 0; i < carsInfo.length; i++) {
            const busyness = await this.getStatisticbyCarId(carsInfo[i].id)
            const report = new ResReportDto(busyness,  carsInfo[i].license_plate)
            reports.push(report)
        }
        return reports
    }
    //проверка доступности автомобиля отдельным маршрутом
    async checkAvailability(reqSchemaDto: ReqSchemaDto): Promise<ResAvailabilityDto> {
        const resAvailabilityDto = new ResAvailabilityDto()
        //на всякий случай приводим полученные даты к типу Date
        const dateStart = new Date(reqSchemaDto.date_start)
        const dateEnd = new Date(reqSchemaDto.date_end)
        //также приводим car_id к числу
        const carId = Number(reqSchemaDto.car_id)
        //валидация carId
        if (!(await this.validateCarId(carId))) {
            resAvailabilityDto.isAvailable = false
            resAvailabilityDto.message = 'Неправильный id машины';
            resAvailabilityDto.status = false
            return resAvailabilityDto;
        }
        //валидация дат
        if (!(await this.validateDate(dateStart, dateEnd))) {
            resAvailabilityDto.isAvailable = false
            resAvailabilityDto.message = 'Неправильные даты'
            resAvailabilityDto.status = false
            return resAvailabilityDto
        }
        //проверка доступности бронирования машины в выбранные даты
        const result = await this.checkAvailabilityCar(dateStart, dateEnd, carId);
        resAvailabilityDto.isAvailable = result
        resAvailabilityDto.message = ''
        resAvailabilityDto.status = true
        return resAvailabilityDto
    }
    //получение стоимости автомобиля отдельным маршрутом
    async getPrice(reqSchemaDto: ReqSchemaDto): Promise<ResPriceDto> {
        const resPriceDto = new ResPriceDto()
        //на всякий случай приводим полученные даты к типу Date
        const dateStart = new Date(reqSchemaDto.date_start)
        const dateEnd = new Date(reqSchemaDto.date_end)
        //валидация дат
        if (!(await this.validateDate(dateStart, dateEnd))) {
            resPriceDto.message = 'Неправильные даты'
            resPriceDto.price = 0
            resPriceDto.status = false
            return resPriceDto
        }
        //получаем общую стоимость аренды
        const price = await this.getFinalPrice(dateStart, dateEnd)
        resPriceDto.message = ''
        resPriceDto.price = price
        resPriceDto.status = true
        return resPriceDto
    }

    //создание сессии бронирования автомобиля
    async createSession(reqSchemaDto: ReqSchemaDto): Promise<ResCreateDto> {
        const resCreateDto = new ResCreateDto()
        //на всякий случай приводим полученные даты к типу Date
        const dateStart = new Date(reqSchemaDto.date_start)
        const dateEnd = new Date(reqSchemaDto.date_end)
        //также приводим car_id к числу
        const carId = Number(reqSchemaDto.car_id)
        //валидация carId
        if (!(await this.validateCarId(carId))) {
            resCreateDto.message = 'Неправильный id мащины'
            resCreateDto.status = false
            return resCreateDto
        }
        //валидация дат
        if (!(await this.validateDate(dateStart, dateEnd))) {
            resCreateDto.message = 'Неправильные даты'
            resCreateDto.status = false;
            return resCreateDto
        }
        //проверка доступности бронирования машины в выбранные даты
        if (!(await this.checkAvailabilityCar(dateStart, dateEnd, carId))) {
            resCreateDto.message = 'В выбранные даты машина недоступна'
            resCreateDto.status = false
            return resCreateDto
        }
        //получаем общую стоимость аренды
        const price = await this.getFinalPrice(dateStart, dateEnd)
        try {
            //вставляем данные в таблицу
            resCreateDto.status = await this.repos.createBooking(dateStart, dateEnd, price, carId)
            resCreateDto.message = ''
            return resCreateDto
        } catch (error) {
            resCreateDto.message = error.message
            resCreateDto.status = false
            return resCreateDto
        }
    }
}
