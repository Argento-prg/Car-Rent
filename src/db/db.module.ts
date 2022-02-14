import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_CONNECTION } from './constants';
import { connection } from './connection';

const dbProvider = {
    provide: PG_CONNECTION,
    useValue: new Pool(connection),
};

@Module({
    providers: [dbProvider],
    exports: [dbProvider],
})
export class DbModule {}
