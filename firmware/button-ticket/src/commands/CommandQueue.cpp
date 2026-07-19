#include "CommandQueue.h"

CommandQueue::CommandQueue()
    : _head(0)
    , _tail(0)
    , _count(0) {
}

bool CommandQueue::push(const Command& cmd) {
    if (isFull()) {
        return false;
    }
    _buffer[_tail] = cmd;
    _tail = (_tail + 1) % MAX_QUEUED_COMMANDS;
    _count++;
    return true;
}

bool CommandQueue::pop(Command& cmd) {
    if (isEmpty()) {
        return false;
    }
    cmd = _buffer[_head];
    _head = (_head + 1) % MAX_QUEUED_COMMANDS;
    _count--;
    return true;
}

bool CommandQueue::peek(Command& cmd) const {
    if (isEmpty()) {
        return false;
    }
    cmd = _buffer[_head];
    return true;
}

size_t CommandQueue::count() const {
    return _count;
}

bool CommandQueue::isEmpty() const {
    return _count == 0;
}

bool CommandQueue::isFull() const {
    return _count >= MAX_QUEUED_COMMANDS;
}

void CommandQueue::clear() {
    _head = 0;
    _tail = 0;
    _count = 0;
}
