export default {
	defaultPronouns: "neutral",
	defaultVoice: "a neutral voice",
	defaultStats: {
		strength: 5,
		perception: 5,
		dexterity: 5,
		speed: 5,
		stamina: 5
	},
	defaultLocation: "living-room",
	defaultStatusEffects: "satisfied, well rested",
	defaultInventory: [
		["NULL", "", "RIGHT HAND", "", "", "", ""],
		["NULL", "", "LEFT HAND", "", "", "", ""],
		["NULL", "", "HAT", "", "", "", ""],
		["NULL", "", "GLASSES", "", "", "", ""],
		["NULL", "", "FACE", "", "", "", ""],
		["NULL", "", "NECK", "", "", "", ""],
		["NULL", "", "CHEST", "", "", "", ""],
		["DEFAULT SHIRT", "", "SHIRT", "", "1", "", "<desc><s>It's a plain, white T-shirt.</s></desc>"],
		["NULL", "", "JACKET", "", "", "", ""],
		["NULL", "", "BAG", "", "", "", ""],
		["NULL", "", "GLOVES", "", "", "", ""],
		["DEFAULT PANTS", "DEFAULT PANTS #", "PANTS", "", "1", "", "<desc><s>It's a plain pair of blue jeans.</s> <s>It has two pockets on the front.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s></desc>"],
		["DEFAULT UNDERWEAR", "", "UNDERWEAR", "", "1", "", "<desc><s>It's a plain, white pair of underwear.</s></desc>"],
		["DEFAULT SOCKS", "", "SOCKS", "", "1", "", "<desc><s>It's a pair of plain, white ankle socks.</s></desc>"],
		["DEFAULT SHOES", "", "SHOES", "", "1", "", "<desc><s>It's a pair of plain, white tennis shoes.</s></desc>"]
	],
	defaultDescription: "<desc><s>You examine <var v=\"container.displayName\" />.</s> <if cond=\"container.hasAttribute('concealed')\"><s><var v=\"container.pronouns.Sbj\" /> <if cond=\"container.pronouns.plural\">are</if><if cond=\"!container.pronouns.plural\">is</if> [HEIGHT], but <var v=\"container.pronouns.dpos\" /> face is concealed.</s></if><if cond=\"!container.hasAttribute('concealed')\"><s><var v=\"container.pronouns.Sbj\" /><if cond=\"container.pronouns.plural\">'re</if><if cond=\"!container.pronouns.plural\">'s</if> [HEIGHT] with [SKIN TONE], [HAIR], and [EYES].</s></if> <s><var v=\"container.pronouns.Sbj\" /> wear<if cond=\"!container.pronouns.plural\">s</if> <il name=\"equipment\"><item>a SHIRT</item>, <item>a pair of PANTS</item>, and <item>a pair of TENNIS SHOES</item></il>.</s> <s>You see <var v=\"container.pronouns.obj\" /> carrying <il name=\"hands\"></il>.</s></desc>"
}
