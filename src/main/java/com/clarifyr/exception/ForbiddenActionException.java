package com.clarifyr.exception;

/**
 * Exception thrown when a user attempts an action not allowed for their role.
 */
public class ForbiddenActionException extends RuntimeException {
    public ForbiddenActionException(String message) {
        super(message);
    }
}
