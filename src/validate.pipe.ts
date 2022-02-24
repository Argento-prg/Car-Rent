import { isDateString, isInt } from 'class-validator'
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common'

@Injectable()
export class ValidatePipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        const boolDS = isDateString(value.date_start)
        const boolDE = isDateString(value.date_end)
        const boolCI = isInt(value.car_id)
        if (boolDS && boolDE && boolCI) {
            return value
        } else {
            throw new BadRequestException('ошибка валидации')
        }
    }
}