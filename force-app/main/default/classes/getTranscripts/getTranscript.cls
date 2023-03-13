public with sharing class getTranscript {
    @AuraEnabled
    public static String getTranscript(String id){

        List<purecloud__PureCloud_Chat_Transcript__c> transcripts;
        try {
            transcripts = [SELECT purecloud__Body__c FROM purecloud__PureCloud_Chat_Transcript__c WHERE Id = :id];
        } catch (Exception e) {
            return e.getMessage();
        }
        return transcripts.get(0).purecloud__Body__c;
    }

    @AuraEnabled
    public static void linkTranscriptToActivity(String interactionId, String transcriptId) {
        Task activityToUpdate;
        try {
            activityToUpdate = [SELECT PureCloud_Chat_Transcript__c FROM Task WHERE Interaction_Id__c = :interactionId];
            activityToUpdate.PureCloud_Chat_Transcript__c = transcriptId;
            update activityToUpdate;
        }
        catch (DmlException e) {
            System.debug('linkTranscriptToActivity error: ' + e.getMessage());
        }
    }
}