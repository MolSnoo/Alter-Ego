import subprocess
import sys
from os import environ
import write_config

image_tag = environ.get("IMAGE_TAG")

print(f"Welcome to Alter Ego Build: {image_tag}.\n")

print("Writing configuration files...")
write_config.write()
print("Done.\n")

print("Starting Alter Ego...")
proc = subprocess.Popen(["node", sys.path[0] + "/../bot.js"], universal_newlines=True, stdout=sys.stdout, stderr=sys.stdout)
proc.wait()
