# What's On interactive website.

The client JS reads the JSON uploaded to the S3 bucket where the Webapp is hosted, <br/>
with an AWS Lambda, triggered every X hours. <br/>

The python script: <br/>
*/home/nfs/z3541612_sa/libcal/**libcal.py*** <br/> 
also uploades the JSON to this github repo using PyGithub.
The script is also located on my local WSL Linux: </br>
*/home/ste/Documents/libcal/**libcal.py*** </br>
and needs an access token generated from Settings > Developer Settings > Personal Access Tokens, with repo permissions. 
