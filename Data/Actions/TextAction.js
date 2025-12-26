import Action from "../Action.js";
import Player from "../Player.js";
import { addDirectNarrationWithAttachments } from "../../Modules/messageHandler.js";

/**
 * @class TextAction
 * @classdesc Represents a text action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/text-action.html
 */
export default class TextAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Text;

	/**
	 * Performs a text action.
	 * @param {Player} recipient - The player who will receive the text.
	 * @param {string} messageText - The text content of the text message.
	 */
	performText(recipient, messageText) {
		if (this.performed) return;
		super.perform();
		const senderText = this.getGame().notificationGenerator.generateTextNotification(messageText, this.player.name, recipient.name);
		const recipientText = this.getGame().notificationGenerator.generateTextNotification(messageText, this.player.name);
		addDirectNarrationWithAttachments(this.player, senderText, this.message.attachments);
		addDirectNarrationWithAttachments(recipient, recipientText, this.message.attachments);
	}
}