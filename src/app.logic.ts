import { Availability } from './logic/availability.logic';
import { Price } from './logic/price.logic';
import { Validate } from './logic/validate.logic';
import { Report } from './logic/report.logic';

class Logic {
    constructor() {
        this.availability = new Availability()
        this.price = new Price()
        this.validate = new Validate()
        this.report = new Report()
    }
    readonly availability: Availability
    readonly price: Price
    readonly validate: Validate
    readonly report: Report
}


export const logic = new Logic();