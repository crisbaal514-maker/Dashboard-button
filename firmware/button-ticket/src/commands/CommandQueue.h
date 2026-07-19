#pragma once

#include <Arduino.h>
#include "commands/Command.h"

/**
 * CommandQueue — Fixed-size circular queue for pending commands.
 *
 * Capacity: 8 commands (MAX_QUEUED_COMMANDS).
 * Used by CloudClient to enqueue commands received in heartbeat
 * instead of executing them immediately in the HTTP callback.
 * Application::loop() drains one command per cycle.
 *
 * This prevents:
 * - Long HTTP requests blocking the main loop
 * - Stack overflow from nested command execution
 * - Multiple commands arriving in a single heartbeat
 */
class CommandQueue {
public:
    static constexpr size_t MAX_QUEUED_COMMANDS = 8;

    CommandQueue();

    /**
     * Add a command to the queue.
     * Returns false if queue is full.
     */
    bool push(const Command& cmd);

    /**
     * Remove and return the oldest command.
     * Returns false if queue is empty.
     */
    bool pop(Command& cmd);

    /**
     * Peek at the oldest command without removing it.
     * Returns false if queue is empty.
     */
    bool peek(Command& cmd) const;

    /**
     * Number of commands currently in the queue.
     */
    size_t count() const;

    /**
     * Is the queue empty?
     */
    bool isEmpty() const;

    /**
     * Is the queue full?
     */
    bool isFull() const;

    /**
     * Clear all commands.
     */
    void clear();

private:
    Command _buffer[MAX_QUEUED_COMMANDS];
    size_t _head;    // Read position
    size_t _tail;    // Write position
    size_t _count;   // Number of items
};
