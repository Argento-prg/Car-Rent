export class Price {
    //получить стоимость аренды машины за период
    async getFinalPrice(connection: any, dateStart: Date, dateEnd: Date): Promise<number> {
        //разница в днях (1000*3600*24 - перевод миллисекунд в дни)
        const deltaDate = (dateEnd.getTime() - dateStart.getTime()) / (1000 * 3600 * 24);
        //получаем базовую цену из таблицы настроек
        try {
            const baseResponse = await connection.query(
                'SELECT base_price FROM settings WHERE base_price IS NOT NULL'
            );
            const base_price = baseResponse.rows[0].base_price;
            //получаем тарифы из таблицы тарифов
            const tariffResponse = await connection.query('SELECT * FROM tariff');
            const tariff = tariffResponse.rows;
            //считаем сумму за период
            let sum = 0;
            for (let i = 1; i <= (deltaDate + 1); i++) {
                let discount = 0;
                //выбираем подходящую скидку
                tariff.forEach((tarif) => {
                    if (i >= tarif.min_days) {
                        discount = tarif.discount;
                    }
                });
                sum += (base_price * (1 - discount / 100));
            }
            return sum;
        } catch (error) {
            return 0
        }
    }
}

