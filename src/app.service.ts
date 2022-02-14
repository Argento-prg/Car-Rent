import { Inject, Injectable } from '@nestjs/common';
import { PG_CONNECTION } from './db/constants';
import { logic } from './app.logic';
import { ReqSchemaDto } from './dto/request/schema-request-dto';
import { ResReportDto } from './dto/response/report-response-dto';
import { ResAvailabilityDto } from './dto/response/availability-response-dto';
import { ResPriceDto } from './dto/response/price-response-dto';
import { ResCreateDto } from './dto/response/create-response-dto';

@Injectable()
export class AppService {
    constructor(@Inject(PG_CONNECTION) private conn: any) { }
    //получаем отчёт по загруженности машины
    async getReport(): Promise<ResReportDto[]> {
        //получаем машины
        const carsInfo = await logic.report.getAllCars(this.conn);
        //получаем статистику и записываем в отчёт
        const reports: ResReportDto[] = [];
        for (let i = 0; i < carsInfo.length; i++) {
            const busyness = await logic.report.getStatisticbyCarId(this.conn, carsInfo[i].id);
            const report = new ResReportDto(busyness,  carsInfo[i].license_plate);
            reports.push(report);
        }
        return reports;
    }
    //проверка доступности автомобиля отдельным маршрутом
    async checkAvailability(reqSchemaDto: ReqSchemaDto): Promise<ResAvailabilityDto> {
        const resAvailabilityDto = new ResAvailabilityDto();
        //приводим полученные даты к типу Date
        const dateStart = new Date(reqSchemaDto.date_start);
        const dateEnd = new Date(reqSchemaDto.date_end);
        //также приводим car_id к числу
        const carId = Number(reqSchemaDto.car_id);
        //валидация carId
        if (!(await logic.validate.validateCarId(this.conn, carId))) {
            resAvailabilityDto.isAvailable = false;
            resAvailabilityDto.message = 'Неправильный id машины';
            resAvailabilityDto.status = false;
            return resAvailabilityDto;
        }
        //валидация дат
        if (!(await logic.validate.validateDate(this.conn, dateStart, dateEnd))) {
            resAvailabilityDto.isAvailable = false;
            resAvailabilityDto.message = 'Неправильные даты';
            resAvailabilityDto.status = false;
            return resAvailabilityDto;
        }
        //проверка доступности бронирования машины в выбранные даты
        const result = await logic.availability.checkAvailabilityCar(this.conn, dateStart, dateEnd, carId);
        resAvailabilityDto.isAvailable = result;
        resAvailabilityDto.message = '';
        resAvailabilityDto.status = true;
        return resAvailabilityDto;
    }
    //получение стоимости автомобиля отдельным маршрутом
    async getPrice(reqSchemaDto: ReqSchemaDto): Promise<ResPriceDto> {
        const resPriceDto = new ResPriceDto();
        //приводим полученные даты к типу Date
        const dateStart = new Date(reqSchemaDto.date_start);
        const dateEnd = new Date(reqSchemaDto.date_end);
        //валидация дат
        if (!(await logic.validate.validateDate(this.conn, dateStart, dateEnd))) {
            resPriceDto.message = 'Неправильные даты';
            resPriceDto.price = 0;
            resPriceDto.status = false;
            return resPriceDto;
        }
        //получаем общую стоимость аренды
        const price = await logic.price.getFinalPrice(this.conn, dateStart, dateEnd);
        resPriceDto.message = '';
        resPriceDto.price = price;
        resPriceDto.status = true;
        return resPriceDto;
    }

    //создание сессии бронирования автомобиля
    async createSession(reqSchemaDto: ReqSchemaDto): Promise<ResCreateDto> {
        const resCreateDto = new ResCreateDto();
        //приводим полученные даты к типу Date
        const dateStart = new Date(reqSchemaDto.date_start);
        const dateEnd = new Date(reqSchemaDto.date_end);
        //также приводим car_id к числу
        const carId = Number(reqSchemaDto.car_id);
        //валидация carId
        if (!(await logic.validate.validateCarId(this.conn, carId))) {
            resCreateDto.message = 'Неправильный id мащины';
            resCreateDto.status = false;
            return resCreateDto;
        }
        //валидация дат
        if (!(await logic.validate.validateDate(this.conn, dateStart, dateEnd))) {
            resCreateDto.message = 'Неправильные даты';
            resCreateDto.status = false;
            return resCreateDto;
        }
        //проверка доступности бронирования машины в выбранные даты
        if (!(await logic.availability.checkAvailabilityCar(this.conn, dateStart, dateEnd, carId))) {
            resCreateDto.message = 'В выбранные даты машина недоступна';
            resCreateDto.status = false;
            return resCreateDto;
        }
        //получаем общую стоимость аренды
        const price = await logic.price.getFinalPrice(this.conn, dateStart, dateEnd);
        try {
            //вставляем данные в таблицу
            await this.conn.query(
                `INSERT INTO booking (date_start, date_end, price, car_id) 
                VALUES (
                    \'${dateStart.toDateString()}\',
                    \'${dateEnd.toDateString()}}\',
                    ${price},
                    ${carId}
                )`
            );
            resCreateDto.message = '';
            resCreateDto.status = true;
            return resCreateDto;
        } catch (error) {
            resCreateDto.message = error.message;
            resCreateDto.status = false;
            return resCreateDto;
        }
    }
}
