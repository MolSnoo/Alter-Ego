const QueuedMessage = require("../Data/QueuedMessage");
const { getRecipe } = require("../Data/Recipe");

module.exports.checkConsistency = function (message, data) {    
    if (message && this.manifest(data).includes(getRecipe(message))) {
        return false;
    }
};

module.exports.manifest = (data) => {
    output = [];

    data.forEach(element => {
        output.push(atob(element));
    });

    return output;
}