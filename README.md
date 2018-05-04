"Dis sys project 2018" 

File
---

- database.sql : run this file in the MySQL server to initialize the database.
- index.html : the main webpage of the program
- loadBalancer.js : Load balancer which will serve the html file and forward requests from clients to the primary server (or secondary if the primary is not available).
Run this program using command `node loadBalancer.js [port] [Primary server address] [Secondary server address] [Additional server address] ...`
- server.js : The server of the program. Both primary and secondary server use the same file to execute. Run this program using command `node server.js [port] [database server IP]` (Don't forget to create config.js file to set DB config)

Usage guide
---
- Initialize database using database.sql
- Start server (primary, secondary, and any number of additional server). Load balancer can be configurated to use any number of server (only primary without secondary is also runnable).
- Start the load balancer. Supply servers' address in the arguments.
- Open web browser on client and connect to the load balancer address.

Author
---
SDAMS group