export class CarsDto {
    constructor(carId: number, licensePlate: string) {
        this.id = carId;
        this.license_plate = licensePlate;
    }
    readonly id: number;
    readonly license_plate: string;
}