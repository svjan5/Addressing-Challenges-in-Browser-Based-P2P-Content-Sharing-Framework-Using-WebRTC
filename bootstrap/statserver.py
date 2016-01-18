#python statserver.py filename 8001
import SimpleHTTPServer
import SocketServer
import logging
import cgi
import sys
import os
import time

PORT = 8001
osDetails = os.uname()
username = osDetails[1]
username = "ubuntu"
# filepath = "\"file:///home/" + username + "/Dropbox/SDN/DTRM/index.html\""
filepath = "\"file:///home/" + username + "/Downloads/index.html\""
command = "google-chrome " + filepath
counter = 0

logging.basicConfig(filename=sys.argv[1])

class ServerHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):

    def do_GET(self):
        #logging.error(self.headers)
        SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        global counter
        #logging.error(self.headers)
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={'REQUEST_METHOD':'POST',
                     'CONTENT_TYPE':self.headers['Content-Type'],
                     })
        for item in form.list:
            ans = logging.error(item)

        if counter <= 10:
            time.sleep(2)
            os.system(command)
            # if counter%10 == 0:
            #     os.system("google-chrome --new-window");
            counter += 1

        SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

Handler = ServerHandler

httpd = SocketServer.TCPServer(("", PORT), Handler)

print "serving at port", PORT
os.system(command)

httpd.serve_forever()