package org.apache.nifi.registry.web.syncfusionutilities;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class AgentUtilities {
    public String getPostResponse(String agentUrl, String jsonData, String contentType) throws Exception{
        StringBuilder response = new StringBuilder();
        URL url = new URL(agentUrl);
        TrustAllCertificates.install();
        HttpURLConnection connection = (HttpURLConnection)url.openConnection();        
        byte[] data = jsonData.getBytes();
        connection.setFixedLengthStreamingMode(data.length);
        connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        connection.setRequestMethod("POST");
        connection.setRequestProperty("username", SyncfusionConstants.Syncfusion);
        TripleDESCipher passwordEncrypt = new TripleDESCipher();
        connection.setRequestProperty("password", passwordEncrypt.encrypt(SyncfusionConstants.DefaultUMSPassword));
        connection.setDoOutput(true);
        connection.connect();
        BufferedReader readData;
        try (OutputStream writeData = connection.getOutputStream()) {
            writeData.write(data);
            writeData.flush();
            readData = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            String line;
           while ((line = readData.readLine()) != null) {
               response.append(line);
            }
        }
        readData.close();
        return response.toString();
    }
    
    public String getResponse(String url) throws Exception {
    
        URL getResponseURl = new URL(url);
        
        TrustAllCertificates.install();
        HttpURLConnection con = (HttpURLConnection) getResponseURl.openConnection();
        con.setRequestMethod("GET");
        con.setRequestProperty("username", SyncfusionConstants.Syncfusion);
        TripleDESCipher passwordEncrypt = new TripleDESCipher();
        con.setRequestProperty("password", passwordEncrypt.encrypt(SyncfusionConstants.DefaultUMSPassword));
        BufferedReader in;
        in = new BufferedReader(
            new InputStreamReader(con.getInputStream()));
        String output;
        StringBuilder response = new StringBuilder();
        while ((output = in.readLine()) != null) {
            response.append(output);
        }
        in.close();
        return response.toString();
    }
}
