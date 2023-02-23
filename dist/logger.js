import winston from 'winston';
import { format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
const logger = winston.createLogger({
    level: 'info',
    defaultMeta: {
        service: 'user-service'
    },
    format: format.combine(format.timestamp({
        format: 'DD-MM-YYYY HH:mm:ss'
    }), format.errors({ stack: true }), format.splat(), format.json()),
    transports: [
        new DailyRotateFile({
            filename: path.join(process.cwd(), 'logs', 'history.log'),
            datePattern: 'dd-MM-YYYY',
            level: 'error'
        }),
        new winston.transports.Console(),
    ]
});
export default logger;
