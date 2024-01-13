import subprocess
import sys
from os import environ
import write_config

image_commit = environ.get("IMAGE_COMMIT").split("}",1)[0]

if environ.get("IMAGE_TAG") is not None:
    image_tag = environ.get("IMAGE_TAG").split("}",1)[0]
    print(f"Alter Ego {image_tag.split(':',1)[1]} (commit {image_commit})\n")
else:
    print(f"Alter Ego (commit {image_commit})\n")

print("Writing configuration files...")
write_config.write()
print("Done.\n")

print("Starting Alter Ego...")
proc = subprocess.Popen(["node", sys.path[0] + "/../bot.js"], universal_newlines=True, stdout=sys.stdout, stderr=sys.stdout)
proc.wait()
