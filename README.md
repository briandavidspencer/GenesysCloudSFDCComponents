# Genesys Cloud CX Salesforce Components
Genesys Cloud CX and Salesforce combine into powerful system for knowing and serving customers throughout their brand relationship. Use out of the box products to produce standard experiences including personalized conversational automated services, one-to-one routing, contextual agent workspaces, and rich insights into performance and strategic opportunities. Use these open source components to enrich those standard experiences with deep integration for seamless, advanced experiences. Choose specific components to meet user requirements, or deploy a full set for a holistic experience workspace.

## Before You Get Started

The assets in this repo were developed using VS Code and the Salesforce Extension Pack. Many depend on Genesys Cloud for Salesforce being installed in the target Salesforce instance, configured to connect to a Genesys Cloud CX org, and to raise Lightning Message Service events. An Einstein AI account trained on customer queries and knowledge articles is needed for Einstein Agent Assist. For more information on these requirements, see:
*[Genesys Cloud for Salesforce](https://help.mypurecloud.com/articles/about-genesys-cloud-for-salesforce/)
*[Develop with Ease with Salesforce Extensions](https://developer.salesforce.com/tools/vscode)
*[Signup for Einstein Platform Services](https://api.einstein.ai/signup)

Once you have the target environments prepared, pull the repo assets for the desired components into VS Code and deploy them into your Salesforce org using the VS Code Salesforce extensions. Alternatively, you can manually import the files into Salesforce via the setup console. For instructions on the various ways to publish components into Salesforce, see [Choose Your Tools for Developing and Deploying Changes](https://help.salesforce.com/s/articleView?id=sf.code_tools_ant.htm&type=5).

## Components by User Requirements
### Agents receive Einstein knowledge recommendations based on real-time communication content
[Einstein Agent Assist](force-app/main/default/aura/EinsteinAgentAssist/), which requires [Einstein Agent Assist class](/force-app/main/default/classes/einsteinAgentAssist/).

### Agents receive Genesys Smart Advisor knowledge recommendations based on real-time communication content
Coming soon

### Agents receive guided workflow recommendations based on real-time communication content
The Einstein Agent Assist component includes code to activate Einstein Next Best Action strategies that feed both Next Best Action and Action & Recommendation components. Use [Einstein Agent Assist](force-app/main/default/aura/EinsteinAgentAssist/), follow the steps to configure your target objects, and modify the code as prescribed.

### Agents can see and review voice interaction transcripts in real-time within Lightning pages
Use [Genesys Cloud CX Interaction Transcript](force-app/main/default/lwc/gcxEmbeddedTranscript/) for real-time presentation and storage. Uses [getTranscripts](/force-app/main/default/classes/getTranscripts/) to link the transcript object with the activity record. Use [Genesys Cloud CX Embedded Transcript Viewer](force-app/main/default/lwc/embeddedTranscriptViewer/) to view them.

### Genesys Cloud CX digital communications are presented and stored in Lightning pages
Digital communications require API access beyond what is published in Genesys Cloud for Salesforce. Use [Genesys Cloud SDK](/force-app/main/default/aura/gcxSdk/) to enable these API calls and events. [Genesys Cloud Messaging Component](/force-app/main/default/lwc/gCX_Messaging_Service/) provides the real-time display and message sending capabilities. Use [getTranscripts](/force-app/main/default/classes/getTranscripts/) to retrieve historical messaging sessions and [Genesys Cloud Message Viewer](/force-app/main/default/lwc/messageViewer/) provides a view to them.

### Genesys Cloud interaction controls are embedded in Lightning pages for a single pane of glass
Coming soon

### Agents receive a holistic, dynamic Lightning page with everything needed to serve customers while communicating
Coming soon