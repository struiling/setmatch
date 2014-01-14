SetMatch
=======

## A thesis project

SetMatch: Discovering and visualizing commonalities among individuals in self-identified groupings.

Uses Parse Code Cloud and Express

https://www.parse.com/docs/cloud_code_guide#started-installing

Foundation
http://foundation.zurb.com/develop/download.html

## Migration to another Parse account
Set up new app in Parse
Replace values in config/global.json
Import existing data (if really starting from scratch and losing all data, make sure a Global group is set up and references in user signup functions are defined, along with hard-coded trait IDs)

If not importing data and starting from scratch, you must create a Global group, set it to secretive, and create basic traits for First Name and Last Name

layout.js for displaying name
user.js signup for both initial name setting and adding user to global group
profile-edit.ejs
main.js email invite send

