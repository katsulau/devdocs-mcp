export class AppError extends Error {
    constructor(
        public code: 'NOT_FOUND' | 'BAD_REQUEST' | 'INTERNAL_ERROR',
        message: string,
        cause: unknown
    ) {
        super(message, { cause });
        this.name = new.target.name;
    }
}


export class NotFoundError extends AppError {
    constructor(message: string, cause: unknown = null) {
        super('NOT_FOUND', message, cause);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string, cause: unknown = null) {
        super('BAD_REQUEST', message, cause);
    }
}