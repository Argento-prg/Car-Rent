export class DatesDto {
    constructor(dateStart: Date, dateEnd: Date) {
        this.start = dateStart
        this.end = dateEnd
    }
    readonly start: Date
    readonly end: Date
}