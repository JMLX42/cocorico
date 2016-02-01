#!/usr/bin/python

print("---")
print("service: rabbitmq")

from optparse import OptionParser
import base64
import json
import sys
import urllib2

LOCALHOST = "127.0.0.1"

parser = OptionParser(add_help_option=False)
parser.add_option("-u", dest="username", default="guest")
parser.add_option("-w", dest="password", default="guest")
parser.add_option("-h", dest="host",     default=LOCALHOST)
parser.add_option("-p", dest="port",     default=15672, type="int")
parser.add_option("-t", dest="timeout",  default=5,     type="int")
parser.add_option("-s", dest="ssl",      action="store_true")

(options, args) = parser.parse_args()

def rabbitmq_api_request(endpoint):
  url = "http%s://%s:%d/api/%s" % ("s" if options.ssl else "", options.host, options.port, endpoint)
  request = urllib2.Request(url)

  base64string = base64.encodestring('%s:%s' % (options.username, options.password)).replace('\n', '')
  request.add_header("Authorization", "Basic %s" % base64string)

  response = urllib2.urlopen(request, timeout=options.timeout).read()
  return json.loads(response)

def print_variable(name, variable):
  print "%s: %d" % (name, variable)

if options.host == LOCALHOST:
  print("argument: %s" % options.port)
else:
  print("argument: %s:%d" % (options.host, options.port))

try:
  for api in ["vhosts", "bindings"]:
    print_variable(api, len(rabbitmq_api_request(api)))

  overview = rabbitmq_api_request("overview")

  print_variable("consumers",   overview["object_totals"]["consumers"])
  print_variable("queues",      overview["object_totals"]["queues"])
  print_variable("exchanges",   overview["object_totals"]["exchanges"])
  print_variable("connections", overview["object_totals"]["connections"])
  print_variable("channels",    overview["object_totals"]["channels"])

  print_variable("messages",                overview["queue_totals"]["messages"])
  print_variable("messages_ready",          overview["queue_totals"]["messages_ready"])
  print_variable("messages_unacknowledged", overview["queue_totals"]["messages_unacknowledged"])
except Exception as exception:
  print "error: \"%s\"" % exception
  sys.exit(254)
