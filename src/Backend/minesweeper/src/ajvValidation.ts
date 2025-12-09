import * as AjvModule from "ajv";
import type {ValidateFunction} from "ajv";
import * as addFormatsModule from "ajv-formats";
import type {NextFunction, Request, Response} from "express";
import type {UnifiedError} from "./types.js";

/**
 * Create and configure AJV instance used for request/response validation.
 */
const AjvCtor: any = (AjvModule as any).default ?? AjvModule;
const addFormats: any = (addFormatsModule as any).default ?? addFormatsModule;

const ajv = new AjvCtor({ allErrors: true });
addFormats(ajv);

function validateRequest(validateRequest: ValidateFunction | null, request: Request, next: NextFunction): boolean {
    // No request validator configured
    if(!validateRequest) {
        return true;
    }

    // Run request validation
    const ok = validateRequest(request.body);

    // If request validation failed, call next() with an error
    if(!ok) {
        const error: any = new Error("Validation failed");
        error.statusCode = 422;
        error.code = "validation_error";
        error.details = validateRequest.errors;

        console.warn(`[VALIDATION.ts] request validation failed:`, {path: request.path, errors: validateRequest.errors});
        next(error);
        return false;
    }

    // Else request validation passed
    console.debug(`[VALIDATION.ts] request validation passed`);
    return true;
} // validateRequest()

function attachResponseValidator(validateResponse: ValidateFunction | null, response: Response, request: Request): void {
    // No response validator configured
    if(!validateResponse) {
        return;
    }

    // Override response.json() to add validation
    const send = response.json.bind(response);
    response.json = (payload: any) => {
        // Run response validation
        const ok = validateResponse(payload);

        if(!ok) {
            console.error(`[VALIDATION.ts] response validation FAILED for ${request.method} ${request.path}:`, validateResponse.errors);
        }
        else {
            console.debug(`[VALIDATION.ts] response validation passed for ${request.method} ${request.path}`);
        }

        return send(payload);  // Call original response.json()
    }; // response.json
} // attachResponseValidator()

export function validate(schemas: { request?: any; response?: any }) {
    // Compile AJV validators
    const requestValue: ValidateFunction | null = schemas.request ? ajv.compile(schemas.request)
                                                                  : null;
    const responseValue: ValidateFunction | null = schemas.response ? ajv.compile(schemas.response)
                                                                    : null;

    // Return Express middleware
    return (request: Request, response: Response, next: NextFunction) => {
        console.debug(`[VALIDATION.ts] validate middleware start: ${request.method} ${request.path}`);

        // Run request validation, if it failed, a handler was already called
        if(!validateRequest(requestValue, request, next)) {
            return;
        }

        // Attach response validator (if any)
        attachResponseValidator(responseValue, response, request);

        // Continue to next middleware/route handler
        return next();
    }; // return
} // validate()

export function toUnifiedError(error: any, fallbackStatus = 500): UnifiedError {
    // Determine status code
    const status = error?.statusCode || fallbackStatus || 500;

    // Normalize error into a unified structure
    const unifiedError: UnifiedError = {
        status,
        payload: {
            code: error?.code || (status === 422 ? "validation_error" : "internal_error"),
            message: error?.message || "Unexpected error",
            details: error?.details ?? null
        }
    };

    console.error(`[VALIDATION.ts] toUnifiedError normalized:`, {rawError: error, unifiedError: unifiedError});
    return unifiedError;
} // toUnifiedError()
