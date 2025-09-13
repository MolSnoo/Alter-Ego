module.exports.mock = () => {
    const mock = jest.mock('googleapis')
    return mock
}