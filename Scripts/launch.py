import subprocess
import sys
import write_config

write_config.write()

proc = subprocess.Popen(['node', '/home/node/app/bot.js'], universal_newlines=True, stdout=sys.stdout, stderr=sys.stdout)
proc.wait()