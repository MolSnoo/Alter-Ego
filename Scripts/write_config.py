import sys
import json
import os
from os import environ

def write():
    # define file paths

    default_credentials_path = sys.path[0] + "/../credentials1.json"
    credentials_path = sys.path[0] + "/../credentials.json"
    settings_path = sys.path[0] + "/../settings.json"

    # load default json files
    with open(default_credentials_path, "r", encoding="utf-8") as file:
        default_credentials = json.load(file)

    # load json files to be written

    # check if credentials.json exists, if so, load
    if os.path.isfile(credentials_path) and os.access(credentials_path, os.R_OK):
        with open(credentials_path, "r") as file:
            credentials = json.load(file)
    # if file doesn't exist, create and fill with defaults. then load.
    else:
        with open(credentials_path, "w+", encoding="utf-8") as file:
            file.write(json.dumps(default_credentials, indent=4))
            credentials = json.load(file)
    
    # same for settings
    if os.path.isfile(settings_path) and os.access(settings_path, os.R_OK):
        with open(settings_path, "r") as file:
            settings = json.load(file)
    else:
        with open(settings_path, "w+") as file:
            file.write(json.dumps({}))
            settings = json.load(file) 
    
    # write credentials
    if environ.get("DISCORD_TOKEN") is not None:
        credentials["discord"]["token"] = environ.get("DISCORD_TOKEN")

    for key in credentials["google"]:
        if environ.get("G_" + key.upper()) is not None:
            credentials["google"][key] = environ.get("G_" + key.upper())

    formatted_credentials = json.dumps(credentials, indent=4)

    with open(sys.path[0] + "/../credentials.json", "w") as credentials:
        credentials.write(formatted_credentials)

    # Write Settings       
    for key in settings:
        if environ.get("S_" + key.upper()) is not None:
            settings[key] = environ.get("S_" + key.upper())

    formatted_settings = json.dumps(settings, indent=4)

    with open(sys.path[0] + "/../settings.json", "w") as settings:
        settings.write(formatted_settings)

if __debug__:
    write()
