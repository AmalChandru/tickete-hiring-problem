import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

// Create logs directory path
const logDir = path.join(__dirname, "../logs");

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// File transports for daily rotating logs
const fileTransports = [
  new DailyRotateFile({
    level: "info",
    filename: `${logDir}/application-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d", // Retain logs for 14 days
  }),
  new DailyRotateFile({
    level: "error",
    filename: `${logDir}/error-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d", // Retain error logs for 30 days
  }),
];

// Console transport with dynamic log levels
const consoleTransport = new winston.transports.Console({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
});

// Create the Winston logger
const logger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [
    ...fileTransports,
    consoleTransport, // Console logs for real-time monitoring
  ],
});

// Handle uncaught exceptions
logger.exceptions.handle(
  new DailyRotateFile({
    filename: `${logDir}/exceptions-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
  }),
  new winston.transports.Console()
);

// Handle unhandled promise rejections
logger.rejections.handle(
  new DailyRotateFile({
    filename: `${logDir}/rejections-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
  }),
  new winston.transports.Console()
);

export default logger;
