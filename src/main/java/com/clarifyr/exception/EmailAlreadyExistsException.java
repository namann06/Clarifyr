package com.clarifyr.exception;

/**
 * Exception thrown when an email is already registered in the system.
 */
public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String message) {
        super(message);
    }
}
