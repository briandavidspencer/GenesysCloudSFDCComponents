public with sharing class PureCloudKnowledgeUtilityController {
    
    @AuraEnabled
    public static String searchKnowledge(String searchValue) {
        String results = '';
        if(searchValue.length() > 3) {

            String searchString = 'FIND \'' + String.escapeSingleQuotes(searchValue) + '\' IN ALL FIELDS RETURNING Knowledge__kav(Id, Title, ArticleNumber LIMIT 10)';
            List<List<SObject>> searchList = search.query(searchString);
            
            JSONGenerator gen = JSON.createGenerator(false);
            gen.writeStartObject();
            gen.writeFieldName('data');
            gen.writeStartArray();
            
            for(List<SObject> listSObj: searchList) {
                for(SObject sobj: listSObj) {
                    Schema.DescribeSObjectResult objDescribe = sobj.getSObjectType().getDescribe();
                    String objName = objDescribe.getName();
                    if(objName.equalsIgnoreCase('Knowledge__kav')) {
                        Map<String, Object> fields = sobj.getPopulatedFieldsAsMap();
                        
                        String url = '/lightning/r/Knowledge__kav/' + (String)fields.get('Id') + '/view';
                        
                        gen.writeStartObject();
                        gen.writeStringField('id', (String)fields.get('Id'));
                        gen.writeStringField('title', (String)fields.get('Title'));
                        gen.writeStringField('articleNumber', (String)fields.get('ArticleNumber'));
                        gen.writeStringField('url', url);
                        gen.writeEndObject();
                    }
                }
            }
            gen.writeEndArray();
            gen.writeEndObject();
                    
            results = gen.getAsString();
        }
        
        return results;
    }
    
    @auraEnabled
    public static List<Probabilities> calculateIntent(String utterance) {
        List<Probabilities> probabilities = new List<Probabilities>();
        try {
            String intentEndpoint = 'https://api.einstein.ai/v2/language/intent';
            String accessToken;
            String sentimentModel = PureCloudKnowledgeConstants.MODEL_ID; 
      
            if(String.isBlank(PureCloudKnowledgeConstants.ACCESS_TOKEN)) {
                accessToken = getToken();
            } else {
                accessToken = PureCloudKnowledgeConstants.ACCESS_TOKEN;
            }
               
            Http http = new Http();
            HttpRequest request = new HttpRequest();
            request.setMethod('POST');
            request.setEndpoint(intentEndpoint);
            request.setHeader('Authorization', 'Bearer ' + accessToken);
            request.setHeader('Content-type', 'application/json');        
            
            String body = '{\"modelId\":\"'+ sentimentModel + '\",\"document\":\"' + utterance + '\"}';
            request.setBody(body);        
            HTTPResponse res = http.send(request);  
            Integer responseCode = res.getStatusCode();
            if(responseCode != 200) {
                throw new PureCloudCustomException(res.getBody());
            }
            
            JSONParser  parser = JSON.createParser(res.getBody());
            String label ='';
            Decimal probability = 0;
            
            while(parser.nextToken() != JSONToken.END_OBJECT) {
                if(parser.getCurrentToken() == JSONToken.FIELD_NAME) {
                    String text = parser.getText();
                    if(parser.nextToken() != JSONToken.VALUE_NULL) {
                        if(text == 'probabilities') {
                            while(parser.nextToken() != JSONToken.END_ARRAY) {
                                probabilities.add(new Probabilities(parser));
                            }
                        }
                    }
                }
            }
            
        } catch (Exception e) {
            System.debug(e.getMessage());
            System.debug(e.getStackTraceString());
            throw new AuraHandledException(e.getMessage());
        }
       
        return probabilities;
    }
    
    private static String getToken() {
        String accessToken = '';
        String tokenEndpoint = 'https://api.einstein.ai/v2/oauth2/token';
        String email = PureCloudKnowledgeConstants.USER_EMAIL;
        ContentVersion base64Content;
        
        List<ContentVersion> base64Contents = [SELECT  Title, VersionData FROM    ContentVersion WHERE   Title = 'einstein_platform' ];
        System.debug(base64Contents);
        if(base64Contents.size() == 0) {
            throw new PureCloudCustomException('Private Key File einstein_platform.pem is not found');
        }
        base64Content = base64Contents[0];
        DateTime tokenExpireTime = DateTime.now().addMinutes(30);
        String tokenExpireTimeinUnixFormate = ''+tokenExpireTime.getTime()/1000;

        String keyContents = base64Content.VersionData.toString();
        keyContents = keyContents.replace('-----BEGIN RSA PRIVATE KEY-----', '');
        keyContents = keyContents.replace('-----END RSA PRIVATE KEY-----', '');
        keyContents = keyContents.replace('\n', '');
        
        PureCloudJWT jwt = new PureCloudJWT('RS256');
        jwt.pkcs8 = keyContents;
        jwt.iss = 'developer.force.com';
        jwt.sub = email;
        jwt.aud = tokenEndpoint;
        jwt.exp = tokenExpireTimeinUnixFormate;

        accessToken = PureCloudJWTBearerFlow.getAccessToken(tokenEndpoint, jwt);  
        return accessToken;
    }
    
    private class Probabilities {
        @AuraEnabled
        public String label { get; set; } 
        @AuraEnabled
        public Double probability { get; set; }
        public Probabilities(JSONParser parser) {
            while (parser.nextToken() != JSONToken.END_OBJECT) {
                if (parser.getCurrentToken() == JSONToken.FIELD_NAME) {
                    String text = parser.getText();
                    if (parser.nextToken() != JSONToken.VALUE_NULL) {
                        if (text == 'label') {
                            label = parser.getText();
                        } else if (text == 'probability') {
                            probability = parser.getDoubleValue();
                        }  
                    }
                }
            }
        }
    }

    //Find object and update Last_utterance__c with interaction utterance
    //UNCOMMENT TO ENABLE EINSTEIN NEXT BEST ACTION INTEGRATION ... REQUIRES
    //A CUSTOM FIELD ON THE CASE OBJECT NAMED Last_utterance__c DEFINED AS A STRING
    //TO RECEIVE THE UTTERANCES FROM THE TRANSCRIPTION ENGINE
    @auraEnabled
    public static void updateLastUtterance(String recordId, String utterance){
        Contact contactToUpdate;
        try {
            contactToUpdate = [SELECT Last_utterance__c FROM Contact WHERE Id = :recordId];
            contactToUpdate.Last_utterance__c = utterance;
            update contactToUpdate;
        }
        catch (DmlException e) {
            System.debug('updateLastUtterance error: ' + e.getMessage());
            throw e;
        }
        catch (Exception e) {
            throw e;
        }
    }
}