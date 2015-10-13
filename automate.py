import os
import time

osDetails = os.uname()
username = osDetails[1]
filepath = "\"file:///home/" + username + "/Dropbox/SDN/DTRM/index.html\""
command = "google-chrome " + filepath

for i in range(4):
	os.system(command)
	time.sleep(5)