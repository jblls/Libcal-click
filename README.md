# What's On static website.

The client JS reads the JSON uploaded from EZproxy UAT, <br/>
using a cronjob that lunches: <br/>
*/home/nfs/z3541612_sa/libcal/**libcal.py*** <br/> 

At the moment it uses my local WSL Linux to run the script: </br>
*/home/ste/Documents/libcal/**libcal.py***

The python script call the Springshare API to get Events details, <br/>
and upload the JSON to Github Pages using PyGithub.  <br/>
Need access token generated from Settings > Developer Settings > Personal Access Tokens, <br/>
with repo permissions. 
