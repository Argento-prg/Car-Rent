export class CarsDto {
    constructor(carId: number, licensePlate: string) {
        this.id = carId;
        this.license_plate = licensePlate;
    }
    id: number;
    license_plate: string;
}