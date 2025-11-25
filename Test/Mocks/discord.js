module.exports.mock = () => {
    const mock = jest.mock('discord.js')
    return mock
}