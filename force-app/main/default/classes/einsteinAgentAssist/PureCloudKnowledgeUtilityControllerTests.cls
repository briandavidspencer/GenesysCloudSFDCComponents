@isTest
private class PureCloudKnowledgeUtilityControllerTests {
    
    @IsTest
    public static void testSearchKnowledge() {
		String jsonString = PureCloudKnowledgeUtilityController.searchKnowledge('test');
        System.assert(String.isNotBlank(jsonString));
    }

    @IsTest
    public static void testCalculateIntent() {
        
        ContentVersion cv = new ContentVersion();
        cv.Title = 'einstein_platform';
        cv.PathOnClient = 'einstein_platform.pem';
        Blob b = EncodingUtil.base64Decode('This is Version Data');
        cv.VersionData = Blob.valueOf('This is Version Data');
        insert cv;
        
        Test.setMock(HttpCalloutMock.class, new SalesforceHttpCalloutMock());
        string chat = 'can you help with my billing';
        Test.startTest();
        List<Object> listOfIntents = PureCloudKnowledgeUtilityController.calculateIntent(chat); 
        Test.stopTest();
        System.assert(listOfIntents.size() == 2);
    }
    
    @IsTest
    public static void testCalculateIntentNoPemFile() {
        
        try {
            Test.setMock(HttpCalloutMock.class, new SalesforceHttpCalloutMock());
            string chat = 'can you help with my billing';
            Test.startTest();
            List<Object> listOfIntents = PureCloudKnowledgeUtilityController.calculateIntent(chat); 
            Test.stopTest();
            System.assert(false);
        } catch(Exception e) {
            System.assert(true);
        } 
    }
    
    @IsTest
    public static void testBadServerResponse() {
        
        ContentVersion cv = new ContentVersion();
        cv.Title = 'einstein_platform';
        cv.PathOnClient = 'einstein_platform.pem';
        Blob b = EncodingUtil.base64Decode('This is Version Data');
        cv.VersionData = Blob.valueOf('This is Version Data');
        insert cv;
        
        try {
            Test.setMock(HttpCalloutMock.class, new FailedHttpCalloutMock());
            string chat = 'can you help with my billing';
            Test.startTest();
            List<Object> listOfIntents = PureCloudKnowledgeUtilityController.calculateIntent(chat); 
            Test.stopTest();
            System.assert(false);
        } catch(Exception e) {
            System.assert(true);
        }
    }

    @IsTest
    public static void testJwtIat() {
        PureCloudJWT purecloudJwt = new PureCloudJWT('RS256');
        purecloudJwt.iat = 'test';
        purecloudJwt.cert = 'test';
        purecloudJwt.privateKey = 'test';

        Assert.areEqual('test', purecloudJwt.iat);
        Assert.areEqual('test', purecloudJwt.cert);
        Assert.areEqual('test', purecloudJwt.privateKey);
    }

    @IsTest
    public static void testBadTokenResponse() {
        
        ContentVersion cv = new ContentVersion();
        cv.Title = 'einstein_platform';
        cv.PathOnClient = 'einstein_platform.pem';
        Blob b = EncodingUtil.base64Decode('This is Version Data');
        cv.VersionData = Blob.valueOf('This is Version Data');
        insert cv;
        
        try {
            Test.setMock(HttpCalloutMock.class, new FailedAccessTokenHttpCalloutMock());
            string chat = 'can you help with my billing';
            Test.startTest();
            List<Object> listOfIntents = PureCloudKnowledgeUtilityController.calculateIntent(chat); 
            Test.stopTest();
            System.assert(false);
        } catch(Exception e) {
            System.assert(true);
        }
    }

    @IsTest
    public static void goodUpdateLastUtterance() {
        Contact testContact = new Contact(FirstName='Joe', LastName='Test');
        insert testContact;
        PureCloudKnowledgeUtilityController.updateLastUtterance(testContact.Id, 'test');
        String testLastUtterance = [SELECT Last_utterance__c FROM Contact WHERE Id = :testContact.Id].Last_utterance__c;
        Assert.areEqual('test', testLastUtterance);
    }

    @IsTest
    public static void badIdUpdateLastUtterance() {
        try {
            PureCloudKnowledgeUtilityController.updateLastUtterance('noId', 'test');
            Assert.isTrue(false);
        }
        catch (Exception e) {
            Assert.isTrue(true);
        }
    }

    @IsTest
    public static void badUpdateLastUtterance() {
        String data = '12345';
        data = data.repeat(100);

        try {
            Contact testContact = new Contact(FirstName='Joe', LastName='Test');
            insert testContact;
            PureCloudKnowledgeUtilityController.updateLastUtterance(testContact.Id, data);
            String testLastUtterance = [SELECT Last_utterance__c FROM Contact WHERE Id = :testContact.Id].Last_utterance__c;
            Assert.isTrue(false);
            }
        catch (Exception e) {
            Assert.isTrue(true);
        }
    }

    public class SalesforceHttpCalloutMock implements HttpCalloutMock {
        
        public HttpResponse respond(HttpRequest req) { 
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-type', 'application/json');
            res.setStatusCode(200);
            res.setStatus('OK');
            if(req.getEndpoint() == 'https://api.einstein.ai/v2/language/intent') {
                res.setBody('{\"probabilities\":[{\"label\": \"How to Review Purchase History\", \"probability\": 0.21420689},'+ 
                            '{\"label\": \"How to Review Purchase History\", \"probability\": 0.21420689}] }');                           
            } if(req.getEndpoint() == 'https://api.einstein.ai/v2/oauth2/token') {
                res.setBody('{\"access_token\" : \"foobar\"}');
            }  
            return res;
        }
    }
    
    public class FailedHttpCalloutMock implements HttpCalloutMock {
        
        public HttpResponse respond(HttpRequest req) { 
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-type', 'application/json');
            if(req.getEndpoint() == 'https://api.einstein.ai/v2/language/intent') {
                res.setStatusCode(404);
                res.setStatus('Not Found');
                res.setBody('{}');                           
            } if(req.getEndpoint() == 'https://api.einstein.ai/v2/oauth2/token') {
                res.setStatusCode(200);
                res.setStatus('OK');
                res.setBody('{\"access_token\" : \"foobar\"}');
            }  
            return res;
        }
    }

    public class FailedAccessTokenHttpCalloutMock implements HttpCalloutMock {
        
        public HttpResponse respond(HttpRequest req) { 
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-type', 'application/json');
            if(req.getEndpoint() == 'https://api.einstein.ai/v2/language/intent') {
                res.setStatusCode(404);
                res.setStatus('Not Found');
                res.setBody('{}');                           
            } if(req.getEndpoint() == 'https://api.einstein.ai/v2/oauth2/token') {
                res.setStatusCode(404);
                res.setStatus('Not Found');
                res.setBody('{}');
            }  
            return res;
        }
    }
}