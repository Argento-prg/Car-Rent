import { Body, Controller, Get, HttpCode, HttpStatus, Post, UsePipes, } from '@nestjs/common'
import { AppService } from './app.service'
import { ReqSchemaDto } from './dto/request/schema-request-dto'
import { ResReportDto } from './dto/response/report-response-dto'
import { ResAvailabilityDto } from './dto/response/availability-response-dto'
import { ResPriceDto } from './dto/response/price-response-dto'
import { ResCreateDto } from './dto/response/create-response-dto'
import { ValidatePipe } from './validate.pipe'

@Controller('/api')
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get('/getreport')
    getReport(): Promise<ResReportDto[]> {
        return this.appService.getReport()
    }

    @Post('/checkavailability')
    @UsePipes(new ValidatePipe())
    @HttpCode(HttpStatus.OK)
    checkAvailability(@Body() reqSchemaDto: ReqSchemaDto): Promise<ResAvailabilityDto> {
        return this.appService.checkAvailability(reqSchemaDto)
    }

    @Post('/getprice')
    @UsePipes(new ValidatePipe())
    @HttpCode(HttpStatus.OK)
    getPrice(@Body() reqSchemaDto: ReqSchemaDto): Promise<ResPriceDto> {
        return this.appService.getPrice(reqSchemaDto)
    }

    @Post('/createsession')
    @UsePipes(new ValidatePipe())
    createSession(@Body() reqSchemaDto: ReqSchemaDto): Promise<ResCreateDto> {
        return this.appService.createSession(reqSchemaDto)
    }
}
