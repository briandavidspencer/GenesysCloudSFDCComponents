@IsTest
public class getTranscriptTests {

    @TestSetup
    static void createTranscript(){
        
        purecloud__PureCloud_Chat_Transcript__c testTranscript = new purecloud__PureCloud_Chat_Transcript__c(Name = 'test', purecloud__Body__c = 'test body');
        insert testTranscript;

        Task testTask = new Task(Interaction_Id__c = '12345');
        insert testTask;

    }

    @IsTest static void getGoodTranscript() {
        purecloud__PureCloud_Chat_Transcript__c testTranscript = [SELECT id FROM purecloud__PureCloud_Chat_Transcript__c WHERE Name = 'test'];
        String body = getTranscript.getTranscript(testTranscript.id);
        System.assertEquals('test body', body); 
    }

    @IsTest static void getBadTranscript() {
        String body = getTranscript.getTranscript('notAnId');
        System.assertNotEquals('test body', body);
    }

    @IsTest static void linkGoodActivity() {
        purecloud__PureCloud_Chat_Transcript__c testTranscript = [SELECT id FROM purecloud__PureCloud_Chat_Transcript__c WHERE Name = 'test'];
        getTranscript.linkTranscriptToActivity('12345', testTranscript.id);
        Task updatedActivity = [SELECT PureCloud_Chat_Transcript__c FROM Task WHERE Interaction_Id__c = '12345'];
        System.assertEquals(testTranscript.id, updatedActivity.PureCloud_Chat_Transcript__c);
    }

    @IsTest static void linkBadActivity() {
        purecloud__PureCloud_Chat_Transcript__c testTranscript = [SELECT id FROM purecloud__PureCloud_Chat_Transcript__c WHERE Name = 'test'];
        try {
            getTranscript.linkTranscriptToActivity('99999', testTranscript.id);
            Task updatedActivity = [SELECT PureCloud_Chat_Transcript__c FROM Task WHERE Interaction_Id__c = '12345'];
            System.assert(false);
        }
        catch (Exception e) {
            System.assert(true);
        }
    }

}