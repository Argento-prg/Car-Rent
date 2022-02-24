export class TariffDto {
    constructor(minDays: number, Discount: number) {
        this.min_days = minDays
        this.discount = Discount
    }

    readonly min_days: number
    readonly discount: number
}