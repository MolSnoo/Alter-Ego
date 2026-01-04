import { ChannelType } from 'discord.js';
import { addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @type {CommandConfig} */
export const config = {
^    name: "delete_moderator",
^    description: "Deletes multiple messages at once.",
^    details: "Deletes multiple messages at once. You can delete up to 100 messages at a time. Only messages "
^        + "from the past 2 weeks can be deleted. You can also choose to only delete messages from a certain user. "
^        + "Note that if you specify a user and for example, 5 messages, it will not delete that user's last 5 messages. "
^        + "Rather, it will search through the past 5 messages, and if any of those 5 messages were sent by "
^        + "the given user, they wil be deleted.",
^    usableBy: "Moderator",
^    aliases: ["delete"],
^    requiresGame: false
^};
^
/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}delete 3\n`
        + `${settings.commandPrefix}delete 100\n`
        + `${settings.commandPrefix}delete @Alter Ego 5\n`
        + `${settings.commandPrefix}delete @MolSno 75`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return addReply(game, message, `You need to specify an amount of messages to delete. Usage:\n${usage(game.settings)}`);
^    const user = message.mentions.users.first();
^    const amount = parseInt(args[args.length - 1]);
    if (isNaN(amount)) return addReply(game, message, `Invalid amount specified.`);
    if (amount < 1) return addReply(game, message, `At least one message must be deleted.`);
    if (amount > 100) return addReply(game, message, `Only 100 messages can be deleted at a time.`);
^
    const channel = message.channel;
    if (channel.type === ChannelType.GuildText) {
        channel.messages.fetch({
            limit: amount
        }).then((messages) => {
            let size = messages.size;
            if (user) {
                const filterBy = user ? user.id : game.botContext.client.user.id;
                messages = messages.filter(message => message.author.id === filterBy);
                const actualMessages = [...messages.values()].slice(0, amount);
                size = actualMessages.length;
            }
            channel.bulkDelete(messages, true).then(() => {
                channel.send(`Deleted ${size} messages.`).then(message => { setTimeout(() => message.delete(), 3000); });
            }).catch(error => console.log(error.stack));
        });
    }
}
