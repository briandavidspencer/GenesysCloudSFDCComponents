# Genesys Cloud CX Salesforce Components
Genesys Cloud CX and Salesforce combine into powerful system for knowing and serving customers throughout their brand relationship. Use out of the box products to produce standard experiences including personalized conversational automated services, one-to-one routing, contextual agent workspaces, and rich insights into performance and strategic opportunities. Use these open source components to enrich those standard experiences with deep integration for seamless, advanced experiences. Choose specific components to meet user requirements, or deploy a full set for a holistic experience workspace.

## Before You Get Started

The assets in this repo were developed using VS Code and the Salesforce Extension Pack. They depend on Genesys Cloud for Salesforce being installed in the target Salesforce instance, configured to connect to a Genesys Cloud CX org, and to raise Lightning Message Service events. An Einstein AI account trained on customer queries and knowledge articles is needed for Einstein Agent Assist. For more information on these requirements, see:
*[Genesys Cloud for Salesforce](https://help.mypurecloud.com/articles/about-genesys-cloud-for-salesforce/)
*[Develop with Ease with Salesforce Extensions](https://developer.salesforce.com/tools/vscode)
*[Signup for Einstein Platform Services](https://api.einstein.ai/signup)

The components are available from an unmanaged package found [here](https://login.salesforce.com/packaging/installPackage.apexp?p0=04t5a0000022YP1&isdtp=p1). Once installed, follow the instructions below to configure them and your environments for the functionality you desire.

Alternatively, pull the repo assets for the desired components into VS Code and deploy them into your Salesforce org using the VS Code Salesforce extensions. If preferred, you can manually import the files into Salesforce via the setup console. For instructions on the various ways to publish components into Salesforce, see [Choose Your Tools for Developing and Deploying Changes](https://help.salesforce.com/s/articleView?id=sf.code_tools_ant.htm&type=5).

## Components by User Requirements
### Agents receive Einstein knowledge recommendations based on real-time communication content
[Einstein Agent Assist](force-app/main/default/aura/EinsteinAgentAssist/), which requires [Einstein Agent Assist class](/force-app/main/default/classes/einsteinAgentAssist/). These components depend on Genesys Cloud for Salesforce raising Lightning Message Channel interaction and notification events; an active Einstein account with either a PEM private key file uploaded into Salesforce or an access token configured in the PureCloudKnowledgeUtilityConstants file; Salesforce Lightning Knowledge enabled on the Salesforce org; knowledge articles uploaded and published into Salesforce; and Einstein trained on those articles with related utterances. Resources are available in this repo for each of these training steps.

### Agents receive guided workflow recommendations based on real-time communication content
The Einstein Agent Assist component includes code to activate Einstein Next Best Action strategies that feed both Next Best Action and Action & Recommendation components. See [Salesforce documentation](https://help.salesforce.com/s/articleView?id=sf.einstein_next_best_action.htm&type=5) for instructions how to enable and configure Einstein Next Best Action within Salesforce. Use [Einstein Agent Assist](force-app/main/default/aura/EinsteinAgentAssist/). Once configured, deploy Einstein Next Best Action into the target record Lightning page and speak utterances that trigger the strategy.

### Agents can see and review voice interaction transcripts in real-time within Lightning pages
Use [Genesys Cloud CX Interaction Transcript](force-app/main/default/lwc/gcxEmbeddedTranscript/) for real-time presentation and storage. Uses [getTranscripts](/force-app/main/default/classes/getTranscripts/) to link the transcript object with the activity record. Use [Genesys Cloud CX Embedded Transcript Viewer](force-app/main/default/lwc/embeddedTranscriptViewer/) to view them.