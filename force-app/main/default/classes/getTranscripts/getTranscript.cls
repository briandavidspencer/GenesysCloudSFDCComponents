public with sharing class getTranscript {
    @AuraEnabled
    public static String getTranscript(String id){

        List<purecloud__PureCloud_Chat_Transcript__c> transcripts;
        try {
            transcripts = [SELECT purecloud__Body__c FROM purecloud__PureCloud_Chat_Transcript__c WHERE Id = :id];
        } catch (Exception e) {
            return e.getMessage();
        }
        if (transcripts.size() > 0)
            return transcripts.get(0).purecloud__Body__c;
        else
            return '';
    }

    @AuraEnabled
    public static void linkTranscriptToActivity(String interactionId, String transcriptId) {
        List<Task> activities;
        Task activityToUpdate;
        try {
            activities = [SELECT PureCloud_Chat_Transcript__c FROM Task WHERE Interaction_Id__c = :interactionId];
            if (activities.size() > 0) {
                activityToUpdate = activities.get(0);
                activityToUpdate.PureCloud_Chat_Transcript__c = transcriptId;
                update activityToUpdate;
            }
        }
        catch (DmlException e) {
            System.debug('linkTranscriptToActivity error: ' + e.getMessage());
        }
    }
}