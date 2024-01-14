import sys
import json
import os
from os import environ

def write():
    """Writes config files from environment variables"""
    # define file paths

    # default
    default_credentials_path = get_path("/../Defaults/default_credentials.json")
    default_settings_path = get_path("/../Defaults/default_settings.json")
    default_playerdefaults_path = get_path("/../Defaults/default_playerdefaults.json")
    default_serverconfig_path = get_path("/../Defaults/default_serverconfig.json")
    default_constants_path = get_path("/../Defaults/default_constants.json")
    default_demodata_path = get_path("/../Defaults/default_demodata.json")

    # actual
    credentials_path = get_path("/../Configs/credentials.json")
    settings_path = get_path("/../Configs/settings.json")
    serverconfig_path = get_path("/../Configs/serverconfig.json")
    playerdefaults_path = get_path("/../Configs/playerdefaults.json")
    constants_path = get_path("/../Configs/constants.json")
    demodata_path = get_path("/../Configs/demodata.json")

    # load json files to be written
    credentials = load_json(default_credentials_path)
    settings = load_json(default_settings_path)
    playerdefaults = load_json(default_playerdefaults_path)
    constants = load_json(default_constants_path)
    demodata = load_json(default_demodata_path)

    # check if serverconfig file exsits, if so load from it. if not, load from defaults
    if os.path.isfile(serverconfig_path) and os.access(serverconfig_path, os.R_OK):
        serverconfig = load_json(serverconfig_path)
    else:
        serverconfig = load_json(default_serverconfig_path)
               
    # set credentials
    set_key(credentials, "s", "DISCORD_TOKEN", "discord", "token")
    set_key(credentials, "s", "G_PROJECT_ID", "google", "project_id")
    set_key(credentials, "s", "G_PRIVATE_KEY_ID", "google", "private_key_id")
    set_key(credentials, "s", "G_PRIVATE_KEY", "google", "private_key")
    set_key(credentials, "s", "G_CLIENT_EMAIL", "google", "client_email")
    set_key(credentials, "s", "G_CLIENT_ID", "google", "client_id")
    set_key(credentials, "s", "G_CLIENT_X509_CERT_URL", "google", "client_x509_cert_url")

    # set settings       
    set_key(settings, "s", "COMMAND_PREFIX", "commandPrefix")
    set_key(settings, "b", "DEBUG_MODE", "debug")
    set_key(settings, "s", "SPREADSHEET_ID", "spreadsheetID")
    set_key(settings, "i", "PIXELS_PER_M", "pixelsPerMeter")
    set_key(settings, "f", "STAMINA_USE_RATE", "staminaUseRate")
    set_key(settings, "f", "HEATED_SLOWDOWN_RATE", "heatedSlowdownRate")
    set_key(settings, "i", "AUTOSAVE_INTERVAL", "autoSaveInterval")
    set_key(settings, "i", "DICE_MIN", "diceMin")
    set_key(settings, "i", "DICE_MAX", "diceMax")
    set_key(settings, "s", "DEFAULT_DROP_OBJECT", "defaultDropObject")
    set_key(settings, "s", "DEFAULT_ROOM_ICON_URL", "defaultRoomIconURL")
    set_key(settings, "b", "AUTODELETE_WHISPER_CHANNELS", "autoDeleteWhisperChannels")
    set_key(settings, "s", "ONLINE_ACTIVITY_TYPE", "onlineActivity", "type")
    set_key(settings, "s", "ONLINE_ACTIVITY_STRING", "onlineActivity", "string")
    set_key(settings, "s", "DEBUG_MODE_TYPE", "debugModeActivity", "type")
    set_key(settings, "s", "DEBUG_MODE_STRING", "debugModeActivity", "string")
    set_key(settings, "s", "IN_PROGRESS_TYPE", "gameInProgressActivity", "type")
    set_key(settings, "s", "IN_PROGRESS_STRING", "gameInProgressActivity", "string")

    # set serverconfig
    set_key(serverconfig, "s", "TESTER_ROLE", "testerRole")
    set_key(serverconfig, "s", "ELIGIBLE_ROLE", "eligibleRole")
    set_key(serverconfig, "s", "PLAYER_ROLE", "playerRole")
    set_key(serverconfig, "s", "HEADMASTER_ROLE", "headmasterRole")
    set_key(serverconfig, "s", "MODERATOR_ROLE", "moderatorRole")
    set_key(serverconfig, "s", "DEAD_ROLE", "deadRole")
    set_key(serverconfig, "s", "SPECTATOR_ROLE", "spectatorRole")
    set_key(serverconfig, "s", "ROOM_CATEGORIES", "roomCategories")
    set_key(serverconfig, "s", "WHISPER_CATEGORY", "whisperCategory")
    set_key(serverconfig, "s", "SPECTATE_CATEGORY", "spectateCategory")
    set_key(serverconfig, "s", "TESTING_CHANNEL", "testingChannel")
    set_key(serverconfig, "s", "GENERAL_CHANNEL", "generalChannel")
    set_key(serverconfig, "s", "ANNOUNCEMENT_CHANNEL", "announcementChannel")
    set_key(serverconfig, "s", "COMMAND_CHANNEL", "commandChannel")
    set_key(serverconfig, "s", "LOG_CHANNEL", "logChannel")

    # set playerdefaults
    set_key(playerdefaults, "i", "DEFAULT_STR", "defaultStats", "strength")
    set_key(playerdefaults, "i", "DEFAULT_INT", "defaultStats", "intelligence")
    set_key(playerdefaults, "i", "DEFAULT_DEX", "defaultStats", "dexterity")
    set_key(playerdefaults, "i", "DEFAULT_SPD", "defaultStats", "speed")
    set_key(playerdefaults, "i", "DEFAULT_STA", "defaultStats", "stamina")
    set_key(playerdefaults, "s", "DEFAULT_LOCATION", "defaultLocation")
    set_key(playerdefaults, "s", "DEFAULT_STATUS_EFFECTS", "defaultStatusEffects")
    set_key(playerdefaults, "a", "DEFAULT_INVENTORY", "defaultInventory")
    set_key(playerdefaults, "s", "DEFAULT_DESC", "defaultDescription")
    
    # write files
    write_json(credentials_path, credentials)
    write_json(settings_path, settings)
    write_json(playerdefaults_path, playerdefaults)
    write_json(constants_path, constants)
    write_json(demodata_path, demodata)
    write_json(serverconfig_path, serverconfig)

def get_path(path):
    """Gets absolute path from relative path"""
    return sys.path[0] + path

def load_json(file_path):
    """Loads json file and returns it"""
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)

def set_key(config, flag, env, key1, key2=None):
    """Sets json key from environment variable"""
    env_string = environ.get(env)

    if env_string is not None:
        env_string = env_string.replace(r'\n', '\n')
        config_key = ""

        match(flag):
            case "s":
                config_key = env_string
            case "b":
                try:
                    config_key = json.loads(env_string.lower())
                except ValueError as e:
                    raise ValueError(f"Must supply a valid boolean for {env}! "
                                     "Valid values: true, false.") from e
            case "a":
                try:
                    config_key = json.loads(env_string)
                except ValueError as e:
                    raise ValueError(f"Must supply a valid JSON array for {env}! "
                                     "Have you tried adding single quotes around it?") from e
            case "i":
                try:
                    config_key = int(env_string)
                except ValueError as e:
                    raise ValueError(f"Must supply a valid integer for {env}!") from e
            case "f":
                try:
                    config_key = float(env_string)
                except ValueError as e:
                    raise ValueError(f"Must supply a valid float for {env}!") from e
            case _:
                raise ValueError("Must supply a valid type flag!")

        if key2 is not None:
            config[key1][key2] = config_key
        else:
            config[key1] = config_key

def write_json(file_path, config):
    """Writes json file from dictionary"""
    with open(file_path, "w+", encoding="utf-8") as file:
        file.write(json.dumps(config, indent=4))

if __debug__:
    write()
