import sys
import json
import os
from os import environ

def write():
    """Writes config files from environment variables"""
    # define file paths

    # default
    default_credentials_path = get_path("/../Configs/Defaults/default_credentials.json")
    default_settings_path = get_path("/../Configs/Defaults/default_settings.json")
    default_playerdefaults_path = get_path("/../Configs/Defaults/default_playerdefaults.json")
    default_serverconfig_path = get_path("/../Configs/Defaults/default_serverconfig.json")

    # actual
    credentials_path = get_path("/../Configs/credentials.json")
    settings_path = get_path("/../Configs/settings.json")
    serverconfig_path = get_path("/../Configs/serverconfig.json")
    playerdefaults_path = get_path("/../Configs/playerdefaults.json")

    # load json files to be written

    if environ.get("APPEND_SETTINGS") is not None:
        if environ.get("APPEND_SETTINGS") == "true":
            credentials = load_defaults_json(credentials_path, default_credentials_path)
            settings = load_defaults_json(settings_path, default_settings_path)
            serverconfig = load_defaults_json(serverconfig_path, default_serverconfig_path)
            playerdefaults = load_defaults_json(playerdefaults_path, default_playerdefaults_path)
    else:
        credentials = load_json(default_credentials_path)
        settings = load_json(default_settings_path)
        serverconfig = load_json(default_serverconfig_path)
        playerdefaults = load_json(default_playerdefaults_path)
    
    # set credentials
    set_key(credentials, "DISCORD_TOKEN", "discord", "token")
    set_key(credentials, "GOOG_PROJECT_ID", "google", "project_id")
    set_key(credentials, "GOOG_PRIVATE_KEY_ID", "google", "private_key_id")
    set_key(credentials, "GOOG_PRIVATE_KEY", "google", "private_key")
    set_key(credentials, "GOOG_CLIENT_EMAIL", "google", "client_email")
    set_key(credentials, "GOOG_CLIENT_ID", "google", "client_id")

    # set settings       
    set_key(settings, "COMMAND_PREFIX", "commandPrefix")
    set_key(settings, "DEBUG_MODE", "debug")
    set_key(settings, "SPREADSHEET_ID", "spreadsheetID")
    set_key(settings, "PIXELS_PER_M", "pixelsPerMeter")
    set_key(settings, "STAMINA_USE_RATE", "staminaUseRate")
    set_key(settings, "HEATED_SLOWDOWN_RATE", "heatedSlowdownRate")
    set_key(settings, "AUTOSAVE_INTERVAL", "autoSaveInterval")
    set_key(settings, "DICE_MIN", "diceMin")
    set_key(settings, "DICE_MAX", "diceMax")
    set_key(settings, "DEFAULT_DROP_OBJECT", "defaultDropObject")
    set_key(settings, "DEFAULT_ROOM_ICON_URL", "defaultRoomIconURL")
    set_key(settings, "AUTODELETE_WHISPER_CHANNELS", "autoDeleteWhisperChannels")
    set_key(settings, "ONLINE_ACTIVITY_TYPE", "onlineActivity", "type")
    set_key(settings, "ONLINE_ACTIVITY_STRING", "onlineActivity", "string")
    set_key(settings, "DEBUG_MODE_TYPE", "debugModeActivity", "type")
    set_key(settings, "DEBUG_MODE_STRING", "debugModeActivity", "string")
    set_key(settings, "IN_PROGRESS_TYPE", "gameInProgressActivity", "type")
    set_key(settings, "IN_PROGRESS_STRING", "gameInProgressActivity", "string")

    # set serverconfig
    set_key(serverconfig, "TESTER_ROLE", "testerRole")
    set_key(serverconfig, "ELIGIBLE_ROLE", "eligibleRole")
    set_key(serverconfig, "PLAYER_ROLE", "playerRole")
    set_key(serverconfig, "HEADMASTER_ROLE", "headmasterRole")
    set_key(serverconfig, "MODERATOR_ROLE", "moderatorRole")
    set_key(serverconfig, "DEAD_ROLE", "deadRole")
    set_key(serverconfig, "SPECTATOR_ROLE", "spectatorRole")
    set_key(serverconfig, "ROOM_CATEGORIES", "roomCategories")
    set_key(serverconfig, "WHISPER_CATEGORY", "whisperCategory")
    set_key(serverconfig, "SPECTATE_CATEGORY", "spectateCategory")
    set_key(serverconfig, "TESTING_CHANNEL", "testingChannel")
    set_key(serverconfig, "GENERAL_CHANNEL", "generalChannel")
    set_key(serverconfig, "ANNOUNCEMENT_CHANNEL", "announcementChannel")
    set_key(serverconfig, "COMMAND_CHANNEL", "commandChannel")
    set_key(serverconfig, "LOG_CHANNEL", "logChannel")

    # set playerdefaults
    set_key(playerdefaults, "DEFAULT_STR", "defaultStats", "strength")
    set_key(playerdefaults, "DEFAULT_INT", "defaultStats", "intelligence")
    set_key(playerdefaults, "DEFAULT_DEX", "defaultStats", "dexterity")
    set_key(playerdefaults, "DEFAULT_SPD", "defaultStats", "speed")
    set_key(playerdefaults, "DEFAULT_STM", "defaultStats", "stamina")
    set_key(playerdefaults, "DEFAULT_LOCATION", "defaultLocation")
    set_key(playerdefaults, "DEFAULT_STATUS_EFFECTS", "defaultStatusEffects")
    set_key(playerdefaults, "DEFAULT_INVENTORY", "defaultInventory")
    set_key(playerdefaults, "DEFAULT_DESC", "defaultDescription")

    # write files
    write_json(credentials_path, credentials)
    write_json(settings_path, settings)
    write_json(serverconfig_path, serverconfig)
    write_json(playerdefaults_path, playerdefaults)

def get_path(path):
    """Gets absolute path from relative path"""
    return sys.path[0] + path

def load_json(file_path):
    """Loads json file and returns it"""
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)

def load_defaults_json(file_path, default_path):
    "Loads json file, if file not found, replace with default values"
    # check if file exists, if so, load
    if os.path.isfile(file_path) and os.access(file_path, os.R_OK):
        load_json(file_path)
    # if file doesn't exist, create and fill with defaults. then load.
    else:
        default_data = load_json(default_path)
        write_json(file_path, default_data)
        return load_json(file_path)

def set_key(config, env, key1, key2=None): 
    "Sets json key from environment variable"
    if key2 is not None:
        if environ.get(env) is not None:
            config[key1][key2] = environ.get(env)
    else:
        if environ.get(env) is not None:
            config[key1] = environ.get(env)

def set_constant(config, val, key1, key2=None):
    "Sets json key from supplied value"
    if key2 is not None:
        config[key1][key2] = val
    else:
        config[key1] = val

def write_json(file_path, config):
    "Writes json file from dictionary"
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(json.dumps(config, indent=4))


if __debug__:
    write()
