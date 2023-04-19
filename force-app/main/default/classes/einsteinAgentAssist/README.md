# Genesys Cloud for Salesforce Einstein Constants

Update the values in the file [PureCloudKnowledgeUtilityConstants.cls](PureCloudKnowledgeUtilityConstants.cls). There are three fields to update:

1. USER_EMAIL: Enter the email address used to register for Einstein services
2. MODEL_ID: The language training model Id returned from Einstein when training on the dataset. It will be in a format like 7BWJMJDUXO3SHJLE7LWRLUD5JI.
3. (Optional) ACCESS_TOKEN: The access token given by Einstein to authenticate API calls. Best practice is to upload the PEM private key file into Salesforce instead of using this field. If using a private key, leave this field a blank string ('').