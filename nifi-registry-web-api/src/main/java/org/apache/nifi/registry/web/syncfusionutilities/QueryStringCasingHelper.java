package org.apache.nifi.registry.web.syncfusionutilities;

public class QueryStringCasingHelper {

    public String EncodeCasing(String originalText, char markerChar) {
        StringBuilder builder = new StringBuilder();
        for (char ch : originalText.toCharArray()) {
            if(Character.isUpperCase(ch)) {
                builder.append(markerChar);
            }
            builder.append(ch);
        }
        return builder.toString();
    }
    
    public String DecodeCasing(String encryptedText, char markerChar) {
        StringBuilder builder = new StringBuilder();
        boolean isNextCharUpper = false;
        
        for (char ch : encryptedText.toCharArray()) {
            if (ch == markerChar) {
                    isNextCharUpper = true;
                    continue;
            }
            builder.append(isNextCharUpper ? Character.toUpperCase(ch) : Character.toLowerCase(ch));
            isNextCharUpper = ch == markerChar;
        }
        return builder.toString();
    }
}
