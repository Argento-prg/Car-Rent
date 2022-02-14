import { CarsDto } from '../dto/help/cars-help-dto'; 

export class Report {
    //получить id и номера всех машин
    async getAllCars(connection: any): Promise<CarsDto[]> {
        //массив информации о машине
        const carsInfo: CarsDto[] = [];
        try {
            //получаем id и госномер машин из таблицы
            const carsResponse = await connection.query(
                'SELECT id, license_plate FROM cars'
            );
            const cars = carsResponse.rows;
            cars.forEach((car) => {
                //новый объект для записи информации в массив
                const newCarInfo = new CarsDto(car.id, car.license_plate);
                carsInfo.push(newCarInfo)
            })
        } catch (error) {}
        return carsInfo
    }

    //получаем количество дней предыдущего месяца
    private daysInMonth(year: number, month: number): number {
        return new Date(year, month, 0).getDate()
    }

    //получить статистику по одной машине
    async getStatisticbyCarId(connection: any, carId: number): Promise<number> {
        try {
            //получили даты для машины с id = carId
            const dateInfoResponse = await connection.query(
                `SELECT date_start AS start, date_end AS end 
                FROM booking WHERE car_id = ${carId} ORDER BY start`
            );
            const dateInfo = dateInfoResponse.rows;
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
                            countMonth++;
                        }
                        //прибавляем февраль
                        sum += 1;
                        countMonth++;
                        //учитываем долю марта
                        const daysMar = this.daysInMonth(date.end.getFullYear(), date.end.getMonth() + 1);
                        const marPart = date.end.getDate();
                        sum += (marPart / daysMar);
                        countMonth++;
                        lastMonth = date.end.getMonth();
                    } else {
                        //начало и конец записи находятся в соседних месяцах
                        //получаем часть предыдущего месяца
                        const prevMonthDays = this.daysInMonth(date.start.getFullYear(), date.start.getMonth() + 1)
                        const prevPart = prevMonthDays - date.start.getDate() + 1
                        sum += (prevPart / prevMonthDays)
                        if (lastMonth !== date.start.getMonth()) {
                            countMonth++;
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
                    const delta = (date.end.getTime() - date.start.getTime()) / (1000 * 3600 * 24) + 1;
                    //считаем число дней в месяце
                    const daysOfMonth = this.daysInMonth(date.end.getFullYear(), date.end.getMonth() + 1);
                    //складываем долю этого месяца с общей суммой
                    sum += (delta / daysOfMonth)
                    //если месяц поменялся, то увеличиваем счётчик месяцев
                    if (lastMonth !== date.end.getMonth()) {
                        lastMonth = date.end.getMonth()
                        countMonth++;
                    }
                }
                
            })
            const busyness = sum / countMonth * 100;

            return busyness
        } catch (error) {
            return 0
        }
    }
}