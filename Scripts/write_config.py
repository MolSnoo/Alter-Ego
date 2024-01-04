import json
from os import environ

def write():
    # Write Credentials

    with open("/home/node/app/Configs/credentials.json", "r") as credentials:
        credentials = json.load(credentials)

    if environ.get("DISCORD_TOKEN") is not None:
        credentials["discord"]["token"] = environ.get("DISCORD_TOKEN")

    for key in credentials["google"]:
        if environ.get("G_" + key.upper()) is not None:
            credentials["google"][key] = environ.get("G_" + key.upper())

    formatted_credentials = json.dumps(credentials, indent=4)

    with open("/home/node/app/Configs/credentials.json", "w") as credentials:
        credentials.write(formatted_credentials)

    # Write Settings
        
    with open("/home/node/app/Configs/settings.json", "r", encoding='utf-8-sig') as settings:
        settings = json.load(settings)

    for key in settings:
        if environ.get("S_" + key.upper()) is not None:
            settings[key] = environ.get("S_" + key.upper())

    formatted_settings = json.dumps(settings, indent=4)

    with open("/home/node/app/Configs/settings.json", "w") as settings:
        settings.write(formatted_settings)