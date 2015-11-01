import os
import time

osDetails = os.uname()
username = osDetails[1]
username = "sdnp2p"
filepath = "\"file:///home/" + username + "/Dropbox/SDN/DTRM/indextest.html\""
command = "google-chrome " + filepath

for i in range(50):
	if i%10 == 0:
		os.system("google-chrome --new-window");
		time.sleep(2)
	os.system(command)
	time.sleep(200)