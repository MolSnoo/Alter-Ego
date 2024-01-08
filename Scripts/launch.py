import subprocess
import sys
import write_config

print("Writing configuration files...")
write_config.write()
print("Done.\n")

print("Starting Alter Ego...")
proc = subprocess.Popen(["node", sys.path[0] + "/../bot.js"], universal_newlines=True, stdout=sys.stdout, stderr=sys.stdout)
proc.wait()
