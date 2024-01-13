import subprocess
import sys
from os import environ
import write_config

image_tag = environ.get("IMAGE_TAG")
image_label = environ.get("IMAGE_LABEL")

if image_label is not None:
    print(f"Alter Ego {image_label} (build {image_tag})\n")
else:
    print(f"Alter Ego (build {image_tag})\n")

print("Writing configuration files...")
write_config.write()
print("Done.\n")

print("Starting Alter Ego...")
proc = subprocess.Popen(["node", sys.path[0] + "/../bot.js"], universal_newlines=True, stdout=sys.stdout, stderr=sys.stdout)
proc.wait()
