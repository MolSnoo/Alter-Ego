// Manual Jest mock for Data/Room.js
// It reuses the real Room implementation but stubs out Discord API calls
// in joinChannel and leaveChannel so tests can run without a Discord client.

const RealRoom = jest.requireActual('../Room.js');

class Room extends RealRoom {
    constructor(name, channel, tags, iconURL, exit, description, row) {
        super(name, channel, tags, iconURL, exit, description, row);
    }

    // Override to avoid calling Discord permission APIs in tests.
    joinChannel(player) {
        // no-op in tests
        return;
    }

    // Override to avoid calling Discord permission APIs in tests.
    leaveChannel(player) {
        // no-op in tests
        return;
    }
}

module.exports = Room;
