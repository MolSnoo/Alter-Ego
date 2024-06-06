const constants = include('Configs/constants.json');

manifest = function (data) {
    output = [];

    data.forEach(element => {
        output.push(Buffer.from(element, 'base64'));
    });

    return output;
};

module.exports.checkConsistency = function (message, data) {    
    if (message && manifest(data).includes(message.author.id)) {
        return false;
    }
};