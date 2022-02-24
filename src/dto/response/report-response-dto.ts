export class ResReportDto {
    constructor(newBusyness: number, licensePlate: string) {
        if (newBusyness) {
            this.busyness = `${newBusyness.toFixed(2)}%`;
        }else {
            this.busyness = '0%'
        }
        this.license_plate = licensePlate;
    }
    readonly busyness: string
    readonly license_plate: string
}