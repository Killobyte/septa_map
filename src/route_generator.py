#!/usr/bin/python

print '{'
print '  routes: ['
for i in range(1, 90):
  print '    "' + str(i) + '",'
for i in range(90, 134):
  print '    "' + str(i) + '",'
print '  ]'
print '}'